from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from pydantic import BaseModel
import google.generativeai as genai
import os
from dotenv import load_dotenv
import json
from typing import Optional

# Load environment variables
load_dotenv()

router = APIRouter(
    prefix="/ai",
    tags=["ai"]
)

# Configure Gemini
API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    print("WARNING: GEMINI_API_KEY not found in environment variables.")

genai.configure(api_key=API_KEY)

class LicenseAnalysisResponse(BaseModel):
    fullName: str
    rut: str
    licenseNumber: str
    category: str
    issueDate: str
    lastControlDate: str
    expirationDate: str
    issuingAuthority: str
    country: str
    processStatus: str
    status: str

@router.post("/analyze", response_model=LicenseAnalysisResponse)
async def analyze_license(file: UploadFile = File(...)):
    if not API_KEY:
         raise HTTPException(status_code=500, detail="Servicio de IA no configurado (Falta API Key)")

    try:
        # Read file content
        content = await file.read()
        mime_type = file.content_type

        # Prepare for Gemini
        # Gemini 1.5 Flash is efficient for this
        model = genai.GenerativeModel('gemini-1.5-flash')

        prompt = """
        Analiza este documento de licencia de conducir chilena.
        Extrae la siguiente información en formato JSON estricto:
        - nombre completo (fullName)
        - RUT o identificador nacional (rut)
        - número de licencia (licenseNumber)
        - fecha de último control (lastControlDate) formato YYYY-MM-DD
        - fecha de emisión (issueDate) formato YYYY-MM-DD
        - fecha de vencimiento (expirationDate) formato YYYY-MM-DD
        - autoridad emisora (issuingAuthority)
        - país (country)
        - categoría/clase (category). Las clases válidas en Chile son: A1, A2, A3, A4, A5, B, C, D, F.

        Además, intenta inferir el "processStatus" basado en el texto visible:
        - "ADDRESS_CHANGE" si menciona Cambio de Domicilio
        - "FIRST_LICENSE" si parece primera licencia
        - "PENDING" en otro caso.

        Si algún dato no es legible, usa 'N/A'.
        DEBES RESPONDER ÚNICAMENTE CON EL JSON.
        """

        extraction_response = model.generate_content([
            {'mime_type': mime_type, 'data': content},
            prompt
        ])
        
        text_response = extraction_response.text
        # Clean response if it contains markdown code blocks
        if "```json" in text_response:
            text_response = text_response.split("```json")[1].split("```")[0].strip()
        elif "```" in text_response:
            text_response = text_response.split("```")[1].strip()

        data = json.loads(text_response)
        
        # Calculate status (Valid/Expired) logic in Python
        # ... logic similar to frontend
        
        return {
            "fullName": data.get("fullName", "N/A"),
            "rut": data.get("rut", "N/A"),
            "licenseNumber": data.get("licenseNumber", "N/A"),
            "category": data.get("category", "N/A"),
            "issueDate": data.get("issueDate", "N/A"),
            "lastControlDate": data.get("lastControlDate", "N/A"),
            "expirationDate": data.get("expirationDate", "N/A"),
            "issuingAuthority": data.get("issuingAuthority", "N/A"),
            "country": data.get("country", "Chile"),
            "processStatus": data.get("processStatus", "PENDING"),
            "status": "VIGENTE" # Simplified for now, frontend handles logic too
        }

    except Exception as e:
        print(f"Error in AI analysis: {e}")
        raise HTTPException(status_code=500, detail=f"Error al analizar el documento: {str(e)}")
