import { GoogleGenAI, Type } from "@google/genai";
import { ParsedMedication } from '../types';

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
    const API_KEY = process.env.API_KEY;
    if (!API_KEY) {
      throw new Error("API Key is not configured. Please ensure the API_KEY environment variable is set.");
    }
    const ai = new GoogleGenAI({ apiKey: API_KEY });

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
    
    if (!jsonText) {
        throw new Error("The model returned an empty response. Please try a clearer image.");
    }
    
    let parsedData: ParsedMedication[];
    try {
        parsedData = JSON.parse(jsonText);
    } catch (parseError) {
        console.error("Failed to parse JSON from model:", jsonText);
        throw new Error("The AI model returned an unexpected format. Please try again.");
    }

    if (!Array.isArray(parsedData)) {
        console.error("Parsed data is not an array:", parsedData);
        throw new Error("The AI model's response was not in the expected array format.");
    }

    return parsedData;

  } catch (error: any) {
    console.error("Error extracting medication info:", error);
    
    // List of our custom, user-facing errors that should be displayed as-is.
    const customErrors = [
      "API Key is not configured",
      "The model returned an empty response",
      "The AI model returned an unexpected format",
      "The AI model's response was not in the expected array format"
    ];

    if (customErrors.some(msg => error.message.includes(msg))) {
      throw error;
    }

    // Catch generic API key errors from the library (e.g., on initialization)
    // and provide a standard user-friendly message.
    if (error.toString().toLowerCase().includes('api key')) {
         throw new Error("API Key is invalid or missing. Please check your configuration.");
    }

    // Generic fallback for any other type of error.
    throw new Error("Failed to analyze the prescription. The image might be unclear, or there could be an issue with the AI service.");
  }
};