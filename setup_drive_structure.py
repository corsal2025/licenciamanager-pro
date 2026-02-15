import os
import os.path
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# If modifying these scopes, delete the file token.json.
SCOPES = ['https://www.googleapis.com/auth/drive']

FOLDER_STRUCTURE = {
    'name': 'LICENCIA_MANAGER_SYSTEM',
    'subfolders': [
        {
            'name': '01_ESCANEADAS_PENDIENTES',
            'subfolders': [
                {'name': 'JUAN_PEREZ'},
                {'name': 'MARIA_GONZALEZ'},
                {'name': 'PEDRO_SOTO'},
                {'name': 'ANA_ROJAS'}
            ]
        },
        {
            'name': '02_BASE_DATOS_EXCEL',
            'subfolders': []
        },
        {
            'name': '03_SUBIDAS_CONASET',
            'subfolders': []
        }
    ]
}

def get_credentials():
    creds = None
    # The file token.json stores the user's access and refresh tokens, and is
    # created automatically when the authorization flow completes for the first
    # time.
    if os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_file('token.json', SCOPES)
    # If there are no (valid) credentials available, let the user log in.
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            # Check if credentials.json exists
            if not os.path.exists('credentials.json'):
                print("❌ Error: No se encontró el archivo 'credentials.json'.")
                print("Por favor, descarga tus credenciales OAuth 2.0 desde Google Cloud Console")
                print("y guarda el archivo como 'credentials.json' en esta carpeta.")
                return None
                
            flow = InstalledAppFlow.from_client_secrets_file(
                'credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)
        # Save the credentials for the next run
        with open('token.json', 'w') as token:
            token.write(creds.to_json())
    return creds

def create_folder(service, name, parent_id=None):
    file_metadata = {
        'name': name,
        'mimeType': 'application/vnd.google-apps.folder'
    }
    if parent_id:
        file_metadata['parents'] = [parent_id]
    
    try:
        # Check if folder already exists
        query = f"name = '{name}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false"
        if parent_id:
            query += f" and '{parent_id}' in parents"
            
        results = service.files().list(q=query, fields="files(id, name)").execute()
        items = results.get('files', [])
        
        if items:
            print(f"✅ Carpeta existente encontrada: {name}")
            return items[0]['id']
        
        # Create if not exists
        file = service.files().create(body=file_metadata, fields='id').execute()
        print(f"✨ Carpeta creada: {name}")
        return file.get('id')
        
    except HttpError as error:
        print(f"❌ Error al crear carpeta {name}: {error}")
        return None

def setup_structure(service, structure, parent_id=None):
    folder_id = create_folder(service, structure['name'], parent_id)
    if folder_id and 'subfolders' in structure:
        for subfolder in structure['subfolders']:
            setup_structure(service, subfolder, folder_id)

def main():
    print("🚀 Iniciando configuración de estructura en Google Drive...")
    creds = get_credentials()
    if not creds:
        return

    try:
        service = build('drive', 'v3', credentials=creds)
        setup_structure(service, FOLDER_STRUCTURE)
        print("\n✅ ¡Estructura de carpetas creada exitosamente en tu Google Drive!")
        print("Busca la carpeta 'LICENCIA_MANAGER_SYSTEM' en tu unidad.")
        
    except HttpError as error:
        print(f"❌ Ocurrió un error: {error}")

if __name__ == '__main__':
    main()
