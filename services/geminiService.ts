import { GoogleGenAI, Type } from "@google/genai";
import { LicenseData, LicenseStatus, ProcessStatus } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeLicenseDocument = async (base64Data: string, mimeType: string): Promise<Partial<LicenseData>> => {
  try {
    const model = "gemini-2.5-flash";
    
    const response = await ai.models.generateContent({
      model: model,
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Analiza este documento de licencia de conducir chilena (puede ser imagen o PDF). 
              Extrae la siguiente información en formato JSON estricto:
              - nombre completo (fullName)
              - RUT o identificador nacional (rut)
              - número de licencia (licenseNumber)
              - fecha de último control (lastControlDate) formato YYYY-MM-DD
              - fecha de emisión (issueDate) formato YYYY-MM-DD
              - fecha de vencimiento (expirationDate) formato YYYY-MM-DD
              - autoridad emisora (issuingAuthority)
              - país (country)
              - categoría/clase (category). IMPORTANTE: Las clases válidas en Chile son: A1, A2, A3, A4, A5, B, C, D, F. 
                NOTA: NO EXISTE LA CLASE E en Chile, ignora cualquier referencia a ella. Si detectas múltiples clases, sepáralas por comas.
              
              Además, intenta inferir el "processStatus" basado en el texto visible:
              - Si menciona explícitamente "Cambio de Domicilio", usa "ADDRESS_CHANGE"
              - Si parece ser una primera licencia (por ejemplo, conductor principiante o fecha emisión igual a inicio), usa "FIRST_LICENSE"
              - En cualquier otro caso, usa "PENDING"
              
              Si algún dato no es legible o no existe, usa 'N/A'.`,
            },
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Data,
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            fullName: { type: Type.STRING },
            rut: { type: Type.STRING },
            licenseNumber: { type: Type.STRING },
            category: { type: Type.STRING },
            issueDate: { type: Type.STRING },
            lastControlDate: { type: Type.STRING },
            expirationDate: { type: Type.STRING },
            issuingAuthority: { type: Type.STRING },
            country: { type: Type.STRING },
            processStatus: { type: Type.STRING, enum: ["PENDING", "ADDRESS_CHANGE", "FIRST_LICENSE"] }
          },
          required: ["fullName", "rut", "expirationDate"],
        },
      },
    });

    if (!response.text) {
      throw new Error("No se pudo generar respuesta del modelo.");
    }

    const data = JSON.parse(response.text);
    
    // Determine validity status based on expiration date
    let status = LicenseStatus.VALID;
    const today = new Date();
    const expDate = new Date(data.expirationDate);
    
    if (!isNaN(expDate.getTime())) {
      const diffTime = expDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        status = LicenseStatus.EXPIRED;
      } else if (diffDays <= 30) {
        status = LicenseStatus.NEAR_EXPIRY;
      }
    }

    // Map string response to Enum
    let pStatus = ProcessStatus.PENDING;
    if (data.processStatus === 'ADDRESS_CHANGE') pStatus = ProcessStatus.ADDRESS_CHANGE;
    if (data.processStatus === 'FIRST_LICENSE') pStatus = ProcessStatus.FIRST_LICENSE;

    return {
      fullName: data.fullName,
      rut: data.rut,
      licenseNumber: data.licenseNumber,
      category: data.category,
      issueDate: data.issueDate,
      lastControlDate: data.lastControlDate,
      expirationDate: data.expirationDate,
      issuingAuthority: data.issuingAuthority,
      country: data.country,
      status: status,
      processStatus: pStatus
    };

  } catch (error) {
    console.error("Error analyzing license:", error);
    throw error;
  }
};