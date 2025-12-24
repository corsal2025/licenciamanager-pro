import { LicenseData } from "../types";

// FIX: Do not initialize globally or at all in client. Use Backend.
// const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeLicenseDocument = async (base64Data: string, mimeType: string): Promise<Partial<LicenseData>> => {
  console.warn("Client-side AI Analysis has been disabled for security. Please use the Backend API endpoint.");
  throw new Error("Client-side AI Analysis is disabled. Use Backend API.");
};