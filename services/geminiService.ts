
import { GoogleGenAI, Type } from "@google/genai";
import { ParsedMedication } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("API_KEY environment variable not set. Gemini API calls will fail.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

const fileToGenerativePart = (file: File) => {
  return new Promise<{ inlineData: { data: string; mimeType: string } }>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result !== 'string') {
        return reject(new Error("Failed to read file as base64 string."));
      }
      const base64Data = reader.result.split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

const schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      name: { 
        type: Type.STRING, 
        description: "Full name of the medication, including the brand name in parentheses if available. Example: 'Cefprozil (MESOGOLD)'" 
      },
      dosage: { 
        type: Type.STRING, 
        description: "Dosage strength. Example: '500mg'" 
      },
      quantity: { 
        type: Type.STRING, 
        description: "Total quantity. Example: '20 Viên' or '30 Gói'" 
      },
      instructions: { 
        type: Type.STRING, 
        description: "Detailed instructions on how and when to take the medication. Example: 'uống ngày 2 viên chia 2 lần sáng chiều cách nhau 12h'" 
      },
    },
    required: ["name", "dosage", "quantity", "instructions"],
  },
};

export const extractMedicationInfoFromImage = async (imageFile: File): Promise<ParsedMedication[]> => {
  try {
    const imagePart = await fileToGenerativePart(imageFile);
    const prompt = `You are an expert medical assistant. Analyze the provided prescription file (image or PDF). Extract the following details for each medication listed: name, dosage, quantity, and the full instructions for taking the medication. Ignore all other personal patient information and general advice ('Lời dặn'). Return the result as a valid JSON array, where each object represents one medication. Do not include any text outside of the JSON array.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts: [imagePart, { text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const jsonText = response.text.trim();
    const parsedData: ParsedMedication[] = JSON.parse(jsonText);
    return parsedData;

  } catch (error) {
    console.error("Error extracting medication info:", error);
    throw new Error("Failed to analyze the prescription. Please ensure the image is clear and try again.");
  }
};