

## Installation

1. Clone this repository to your local machine:

  ```
  git clone https://github.com/mdimado/medbot.git
  cd medbot
  ```



### Set up Frontend
  
1. Change the current working directory to "frontend"
  
  ```  
  cd frontend
  ```

2. Install Dependencies:
   
  ```bash
  npm install
  ```

3. Set Up Firebase:
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/).
   - Obtain your Firebase config credentials.
   - Add your Firebase config to `src/firebase/firebaseConfig.js`.

4. Start the Development Server:
   
  ```bash
  npm start
  ```

   This will run the React development server. You can view the website at `http://localhost:3000`.

### Folder Structure

The project folder structure is organized as follows:

- **`public/`**: Contains static assets and the main `index.html` file.
- **`src/`**: Contains all the source code for the React.js frontend.
  - **`assets/`**: Static assets like images, fonts, etc.
  - **`components/`**: Reusable components
    - **`Header/`**: Header component
    - **`Helmet/`**: Helmet component
    - **`Layout/`**: Layout components
      - `Modal.jsx`: Modal component
      - `PatientForm.jsx`: PatientForm component
      - `PatientInfo.jsx`: PatientInfo component
  - **`custom-hooks/`**: Custom React hooks
  - **`pages/`**: Pages of the application
    - `ChatBot.jsx`: ChatBot page component
    - `Home.jsx`: Home page component
    - `Login.jsx`: Login page component
    - `Signup.jsx`: Signup page component
  - **`redux/`**: Redux setup
  - **`routers/`**: Router setup
  - **`styles/`**: CSS styles
    - `App.css`: Global styles
  - `App.js`: Main application component
  - `firebase.config.js`: Firebase configuration
  - `index.js`: Entry point


### Set up Backend
  
1. Change the current working directory to "backend"
  
  ```  
  cd backend
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

-   **Frontend**:
    -   **Setup**: React.js
    -   **Dependencies**: npm
-   **Backend**:
    -   **Language Used**: Python 3.9.13
    -   **API Framework**: FastAPI
  
### API Endpoints  
  
##### /create/req=<json>  
  
**\<json\>** - Enter patient json here  
**Functionality** - Creating a new patient bucket  
  
##### /query/req=<json>
  
**\<json\>** - JSON must contain `id` and `prompt`  
**Functionality** - Queries the RAG pipeline   

##### /status
  
**Functionality** - Returns 200 OK if API is up  
  

    
