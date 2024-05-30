import asyncio
import json
import logging
import os
import random
import time

import cohere
import requests
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from langchain.prompts import ChatPromptTemplate
from langchain_cohere import CohereEmbeddings
from langchain_community.document_loaders import DirectoryLoader, PyPDFLoader
from langchain_community.vectorstores import Qdrant
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_text_splitters import RecursiveCharacterTextSplitter
from mthrottle import Throttle
from playwright.async_api import async_playwright
from pydantic import BaseModel
from pypdf import PdfReader
from pypdf.errors import PdfReadError
from qdrant_client import QdrantClient
from qdrant_client.models import Batch, Distance, VectorParams

logger = logging.getLogger("PyPDF2")
logger.setLevel(logging.ERROR)

throttle_config = {"lookup": {"rps": 15}, "default": {"rps": 8}}
th = Throttle(throttle_config, 15)

llm15 = ChatGoogleGenerativeAI(model="gemini-1.5-pro-latest", temperature=0.9)
llm1 = ChatGoogleGenerativeAI(model="gemini-1.0-pro-latest")

load_dotenv()
COHERE_API_KEY = os.environ["COHERE_API_KEY"]
GOOGLE_API_KEY = os.environ["GOOGLE_API_KEY"]
LANGCHAIN_TRACING_V2 = os.environ["LANGCHAIN_TRACING_V2"]
LANGCHAIN_ENDPOINT = os.environ["LANGCHAIN_ENDPOINT"]
LANGCHAIN_API_KEY = os.environ["LANGCHAIN_API_KEY"]
LANGCHAIN_PROJECT = os.environ["LANGCHAIN_PROJECT"]


async def get_google(condition, newpath, n):
    prompts = [i.format(condition) for i in ["{} causes", "{} risk factors", "{} symptoms", "{} prevention and cure", "{} diagnosis", "{} treatment options", "{} prognosis", "{} complications", "{} epidemiology", "{} research and studies", "{} latest treatments and advancements"]]

    output = []
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        for prompt in prompts:
            url = f"https://www.google.com/search?q={prompt}&num={n}&hl=en&btnG=Google+Search&as_filetype=pdf"
            await page.goto(url)

            xpath = "//div[@class='yuRUbf']//a[contains(@href, 'pdf')]"
            links = await page.query_selector_all(xpath)
            links = await asyncio.gather(*(link.get_attribute("href") for link in links))
            output.extend(links)
        await browser.close()
    return output


def download_all(links, path):
    links = list(set(links))
    session = requests.Session()
    session.headers.update({"User-Agent": "Mozilla/5.0 (Windows NT 10.0; rv:109.0) Gecko/20100101 Firefox/118.0", "Accept": "application/json, text/plain, */*", "Accept-Language": "en-US,en;q=0.5"})

    idx = 0
    for filelink in links:
        idx += 1
        filename = f"{path}\\file{idx}.pdf"
        download(session, filelink, filename)
    session.close()
    return len(links)


def download(session, url, filename):
    th.check()
    try:
        with session.get(url, stream=True, timeout=10) as r:
            r.raise_for_status()
            with open(filename, mode="wb") as f:
                for chunk in r.iter_content(chunk_size=1000000):
                    f.write(chunk)
    except:
        return False


def valid_pdf(file):
    try:
        pdf = PdfReader(file)
        return True
    except PdfReadError:
        print(f"{file} - Invalid file")
        return False


def clean_dir(directory):
    for filename in os.listdir(directory):
        filepath = os.path.join(directory, filename)
        if os.path.isfile(filepath) and filepath.lower().endswith(".pdf"):
            if not valid_pdf(filepath):
                print(f"invalid file - {filepath}")
                os.remove(filepath)
    print("Directory cleaned")


def embed_docs(path):
    loader = DirectoryLoader(path, glob="**/*.pdf", loader_cls=PyPDFLoader, silent_errors=True)
    pages = loader.load_and_split()
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1024, chunk_overlap=100, length_function=len, is_separator_regex=False)
    texts = text_splitter.create_documents([pages[i].page_content for i in range(len(pages))])
    client = QdrantClient(url="http://localhost:6333")
    # client.create_collection(
    #     collection_name="MedicalPapers",
    #     vectors_config=VectorParams(size=1024, distance=Distance.DOT),
    # )
    # qdrant = Qdrant.from_documents(docs, embeddings, url=QDRANT_URL, collection_name=QDRANT_CLUSTER, api_key=QDRANT_KEY, force_recreate=True)
    cohere_client = cohere.Client(COHERE_API_KEY)
    client = QdrantClient()
    half = len(texts) // 2
    client.upsert(
        collection_name="MedicalPapers",
        points=Batch(
            ids=range(half),
            vectors=cohere_client.embed(
                model="embed-english-v3.0",
                input_type="search_document",
                texts=[texts[i].page_content for i in range(half)],
            ).embeddings,
            payloads=[{"Context{}".format(index): value} for index, value in enumerate([texts[i].page_content for i in range(half)], start=1)],
        ),
    )
    client.upsert(
        collection_name="MedicalPapers",
        points=Batch(
            ids=range(half, len(texts)),
            vectors=cohere_client.embed(
                model="embed-english-v3.0",
                input_type="search_document",
                texts=[texts[i].page_content for i in range(half, len(texts))],
            ).embeddings,
            payloads=[{"Context{}".format(index): value} for index, value in enumerate([texts[i].page_content for i in range(half, len(texts))], start=1)],
        ),
    )
    print("Documents indexed and embedded")


def cohereRetrival(collection, textList):
    cohere_client = cohere.Client(COHERE_API_KEY)
    client = QdrantClient()
    result = client.search(
        collection_name=collection,
        query_vector=cohere_client.embed(
            model="embed-english-v3.0",
            input_type="search_query",
            texts=textList,
        ).embeddings[0],
    )
    return result


def ragFusion(prompt, collection="MedicalPapers"):
    co = cohere.Client(COHERE_API_KEY)
    queryGenerationPrompt = ChatPromptTemplate.from_template("Given the prompt: '{prompt}', generate {num_queries} questions that are better articulated. Return in the form of an list. For example: ['question 1', 'question 2', 'question 3']")
    queryGenerationChain = queryGenerationPrompt | llm1
    queries = queryGenerationChain.invoke({"prompt": prompt, "num_queries": 3}).content.split("\n")
    retrievedContent = []
    for query in queries:
        ret = cohereRetrival(collection, [query])
        for doc in ret:
            for key, value in doc.payload.items():
                value = value.replace("\xa0", " ")
                value = value.replace("\t", "  ")
                value = value.replace("\r", "")
                value = value.replace("\n", "      ")
                retrievedContent.append(value)
    retrievedContent = list(set(retrievedContent))
    result = co.rerank(model="rerank-english-v3.0", query=prompt, documents=retrievedContent, top_n=5, return_documents=True)
    context = ""
    for i in result.results:
        context += i.document.text
        context += "\n\n"
    return context


app = FastAPI()
origins = ["http://localhost.tiangolo.com", "https://localhost.tiangolo.com", "http://localhost", "http://localhost:8080", "http://localhost:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
router = APIRouter()


class CParams(BaseModel):
    req: str
    # n: int = 5


class QParams(BaseModel):
    req: str
    # id: int
    # prompt: str


@router.post("/create")
async def create(params=Depends(CParams)):
    start = time.time()
    req = json.loads(params.req)

    n = 4
    id = req["id"]
    condition = req["condition"]
    newpath = f".\\files\\{id}"
    if not os.path.exists(newpath):
        os.makedirs(newpath)

    with open(newpath + "\\details.json", "w") as file:
        file.write(json.dumps(req))

    with open(f".\\files\\{id}\\history.txt", "w") as file:
        file.write("")
    dstring = "\n".join([f"{key}:{value}" for key, value in req.items()])

    with open(newpath + "\\details.txt", "w") as file:
        file.write(dstring)

    links = await get_google(condition, newpath, n)
    length = download_all(links, newpath)
    clean_dir(newpath)
    embed_docs(newpath)

    return {"id": id, "status": f"Downloaded {length} files", "Path": newpath, "Time taken": time.time() - start}


@router.get("/query")
async def query(params=Depends(QParams)):
    treatment_box = """You are a medical assistant that specializes in providing second opinions, diagnosing complex cases and suggesting treatment plans. When I describe the patient details, medical context and task, give me the appropriate treatment plan based on the task given by analyzing the patient details and medical context. Include how your answer is related to the patient's history. Do not print the analysis or summary of the patient's details."""
    answer_box = """
As a medical assistant specializing in second opinions, treatment plans and medical diagnoses, accurate and relevant response to the given question. Ensure the response is detailed, factually correct, coherent, and clear to understand. Answer in a factual and relevant manner, describing each step.
"""

    template = """{box}
    
    {history}

    Patient History : {details}

    Medical Context : {context}

    Task: {question}
    """
    req = json.loads(params.req)
    id = req["id"]
    userprompt = req["prompt"]
    path = f".\\files\\{id}\\details.txt"
    with open(path, "r") as file:
        details = file.readlines()
    hpath = f".\\files\\{id}\\history.txt"

    file_path = f".\\files\\{id}\\details.json"
    with open(file_path, "r") as file:
        patient_data = json.load(file)
    # Extract condition and description
    condition = patient_data["condition"]
    description = patient_data["description"]

    with open(hpath, "r") as history_file:
        history = history_file.read()
    history = f"""This is your previous chat history with your patient. Your answer should be a continuation of the conversation between you and the patient.
    Chat history : +\n{history}"""

    context = ragFusion(userprompt)
    prompt = ChatPromptTemplate.from_template(template)
    chain = prompt | llm15
    if "treatment" in prompt:
        box = treatment_box
    else:
        box = answer_box

    result = chain.invoke({"context": context[0], "details": details, "question": prompt, "box": box, "history": history})
    with open(hpath, "a") as history_file:
        history_file.write("##### Human: " + userprompt + "\n\n")
        history_file.write("##### Bot: " + result.content + "\n\n")
    return {"Output": result.content}


@router.get("/status")
def status():
    return {"status": "200 OK"}


app.include_router(router)

print("helo")
