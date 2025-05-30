
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ImageData, GenderResult } from "../types";

const MODEL_NAME = "gemini-2.5-flash-preview-04-17";
const API_KEY = process.env.API_KEY;

const PROMPT = `Analyze the provided image. What is the perceived gender of the most prominent human face visible? 
Respond with *only one* of the following keywords: 'Male', 'Female', 'Indeterminate'. 
If no clear human face is visible, respond with 'NoFaceDetected'.`;

export const detectGenderFromImage = async (imageData: ImageData): Promise<GenderResult> => {
  if (!API_KEY) {
    console.error("API_KEY environment variable is not set.");
    return "Error"; // Or throw new Error("API_KEY not configured");
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [{
        parts: [
          { inlineData: { mimeType: imageData.mimeType, data: imageData.base64 } },
          { text: PROMPT }
        ]
      }],
      config: {
        // No specific config like temperature needed for this classification task.
        // Default thinkingConfig (enabled) is fine for better quality.
      }
    });

    const textResult = response.text.trim();

    if (textResult === "Male" || textResult === "Female" || textResult === "Indeterminate" || textResult === "NoFaceDetected") {
      return textResult as GenderResult;
    } else {
      console.warn("Unexpected response from Gemini API:", textResult);
      // Fallback or attempt to parse if Gemini is slightly off but understandable
      if (textResult.toLowerCase().includes("male")) return "Male";
      if (textResult.toLowerCase().includes("female")) return "Female";
      if (textResult.toLowerCase().includes("indeterminate")) return "Indeterminate";
      if (textResult.toLowerCase().includes("no face") || textResult.toLowerCase().includes("nofacedetected")) return "NoFaceDetected";
      return "Indeterminate"; // Default if parsing fails but not a clear error
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return "Error";
  }
};
