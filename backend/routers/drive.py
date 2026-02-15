from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import database, models, schemas, logger
import shutil
import os
import uuid
from typing import List
import json

# Goodle Drive Libs
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload

router = APIRouter(
    prefix="/drive",
    tags=["drive"]
)

# Configuration
DRIVE_SIM_PATH = "drive_simulation"
CREDENTIALS_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "credentials.json")
# If you want a specific folder in Drive, set ID here. PROD: Load from ENV
DRIVE_FOLDER_ID = None 

# scopes
SCOPES = ['https://www.googleapis.com/auth/drive.file']

def get_drive_service():
    """
    Attempts to authenticate with Google Drive API.
    Returns service object or None if fails.
    """
    if not os.path.exists(CREDENTIALS_FILE):
        print(f"Credentials not found at {CREDENTIALS_FILE}. Using Simulation.")
        return None
        
    try:
        # Check if file is not empty/placeholder
        with open(CREDENTIALS_FILE, 'r') as f:
            content = json.load(f)
            if "project_id" not in content and "INSTRUCCIONES" in content:
                 print("Credentials file is placeholder. Using Simulation.")
                 return None

        creds = service_account.Credentials.from_service_account_file(
            CREDENTIALS_FILE, scopes=SCOPES)
        service = build('drive', 'v3', credentials=creds)
        return service
    except Exception as e:
        print(f"Failed to create Drive Service: {e}")
        return None

if not os.path.exists(DRIVE_SIM_PATH):
    os.makedirs(DRIVE_SIM_PATH)

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    username: str = Form(...),
    db: Session = Depends(get_db)
):
    # Prepare Simulation Path (always needed for fallback)
    user_sim_path = os.path.join(DRIVE_SIM_PATH, username)
    if not os.path.exists(user_sim_path):
        os.makedirs(user_sim_path)
    
    # 1. Try Real Drive
    service = get_drive_service()
    if service:
        try:
            print(f"Attempting upload of {file.filename} to REAL Google Drive...")
            
            file_metadata = {
                'name': f"{username}_{file.filename}", 
                'mimeType': file.content_type
            }
            if DRIVE_FOLDER_ID:
                file_metadata['parents'] = [DRIVE_FOLDER_ID]
            
            # Note: UploadFiel.file is SpooledTemporaryFile. 
            # We must ensure it's at start.
            await file.seek(0)
            
            media = MediaIoBaseUpload(file.file, mimetype=file.content_type, resumable=True)
            
            drive_file = service.files().create(
                body=file_metadata,
                media_body=media,
                fields='id, webContentLink, webViewLink'
            ).execute()
            
            print(f"Uploaded Real File ID: {drive_file.get('id')}")
            
            # LOG: Real Upload
            logger.log_action(db, username=username, action="UPLOAD_REAL", details=f"File: {file.filename}, ID: {drive_file.get('id')}")
            
            return {
                "status": "success",
                "message": "Archivo subido a Google Drive (Real)",
                "drive_id": drive_file.get('id'),
                "web_link": drive_file.get('webViewLink'),
                "file_name": file.filename
            }
        except Exception as e:
            print(f"⚠️ Google Drive Real Failed: {e}")
            print("🔄 Falling back to Simulation Storage...")
            # Fall through to simulation logic
            pass

    # 2. Simulation (Fallback or Default)
    try:
        print(f"Uploading {file.filename} to SIMULATION Drive...")
        
        file_location = os.path.join(user_sim_path, file.filename)
        
        # Reset cursor because it might have been read in the failed attempt
        await file.seek(0)
        
        with open(file_location, "wb+") as file_object:
            shutil.copyfileobj(file.file, file_object)
            
        # LOG: Simulated Upload
        logger.log_action(db, username=username, action="UPLOAD_SIMULATION", details=f"File: {file.filename} (Fallback/Sim)")

        return {
            "status": "success",
            "message": "Archivo guardado en Drive (Simulado Local - Respaldo)",
            "drive_id": str(uuid.uuid4()),
            "web_link": f"http://localhost:8000/static/{username}/{file.filename}",
            "file_name": file.filename
        }
    except Exception as e:
        print(f"Error in Simulation fallback: {e}")
        raise HTTPException(status_code=500, detail=f"Fatal Upload Error: {str(e)}")

@router.get("/list")
def list_files(username: str):
    service = get_drive_service()
    
    # --- REAL DRIVE ---
    if service:
        try:
            # List files that start with username (simple strategy for finding 'folder')
            # Or query name contains username
            query = f"name contains '{username}' and trashed = false"
            results = service.files().list(
                q=query, pageSize=10, fields="nextPageToken, files(id, name, mimeType, webViewLink)").execute()
            items = results.get('files', [])
            return items
        except Exception as e:
            print(f"Drive List Error: {e}")
            return []
            
    # --- SIMULATION ---
    else:
        user_path = os.path.join(DRIVE_SIM_PATH, username)
        if not os.path.exists(user_path):
            return []
            
        files = []
        for f in os.listdir(user_path):
            files.append({
                "id": str(uuid.uuid4()),
                "name": f,
                "mimeType": "application/pdf"
            })
        return files
