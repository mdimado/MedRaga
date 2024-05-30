### Set up project  
  
1. Clone the repository or download as zip and extract it.  
  
```  
git clone https://github.com/omkar-334/MedRaga-API.git  
```  
  
2. Create a virtual environment  
  
```  
python -m venv .venv  
```  
  
3. Activate .venv  
  
```  
.venv\Scripts\activate  
```  
  
4. Install required libraries and install playwright.  
  
```python  
pip install -r requirements.txt
playwright install
```

5. Download and run Qdrant  
   For Windows, run these commands from WSL.  
First, download the latest Qdrant image from Dockerhub:   
```
docker pull qdrant/qdrant
``` 
Then, run the service:
```
docker run -p 6333:6333 -p 6334:6334 \
    -v $(pwd)/qdrant_storage:/qdrant/storage:z \
    qdrant/qdrant
```
Qdrant is now accessible at `localhost:6333`  

6. Add API Keys to `.env`

7. Check path locations.

For Windows - paths are defined by `\\`  
For Mac OS - paths are defined by `/`  

8. Start API  
  
```python  
uvicorn app:app 
```
Do not use `--reload` tag, since the API contains `async` functions. API will break.
  
### Project Details  
  
**Language Used** - Python 3.9.13  
**API Framework** - FastAPI    
  
### API Endpoints  
  
##### /create/req=<json>  
  
**\<json\>** - Enter patient json here  
**Functionality** - Creating a new patient bucket  
  
##### /query/req=<json>
  
**\<json\>** - JSON must contain `id` and `prompt`  
**Functionality** - Queries the RAG pipeline   

##### /status
  
**Functionality** - Returns 200 OK if API is up  
  
![Ratings Comparison](https://github.com/omkar-334/MedRaga-API/blob/main/ratings.png)  

![Response Text Comparison](https://github.com/omkar-334/MedRaga-API/blob/main/reponse_text.png)  
    
