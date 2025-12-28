
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

export const analyzeMedia = async (
  sourcePersonImageBase64: string,
  sourcePersonImageMimeType: string,
  backgroundImageBase64: string,
  backgroundImageMimeType: string,
  referencePersonImageBase64: string,
  referencePersonImageMimeType: string,
  clothingDescription: string | null,
  cameraView: string | null
): Promise<AnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const clothingInstruction = clothingDescription
    ? `- The person is wearing: ${clothingDescription}. Describe their pose from the source person image.`
    : `- From the source person image, describe their clothing and pose.`;

  const cameraPerspectiveInstruction = cameraView
    ? `- The camera perspective is a "${cameraView}" shot.`
    : `- From the source person image, precisely identify the camera perspective (e.g., "close up," "full body view," "half body view," "selfie perspective").`;


  const stagePromptDefinition = `
    1. stagePrompt:
       - From the reference image, describe the person's physical appearance for character consistency (gender, approximate age, hair style, hair color, distinct facial features).
       ${clothingInstruction}
       - From the background image, describe the background details and lighting.
       - Using the source person image for reference, also include the following details:
         - Expression: If smiling, it must be natural and subtle, not exaggerated.
         - Camera Orientation: The person must be looking directly at the camera.
       ${cameraPerspectiveInstruction}
       - Combine all these elements into a single, cohesive paragraph.
       - CRITICAL: Do not use any labels (like "PERSON'S LIKENESS:", "CONTEXT:", "EXPRESSION:", etc.) in the final output. The output must be a single block of descriptive text.
  `;

  const systemInstruction = `
    You are an expert prompt engineer for cinematic and creative video generation models.
    Analyze the provided images and user inputs.
    
    CRITICAL SAFETY INSTRUCTION: All generated descriptions and prompts must be strictly Safe-For-Work (SFW) and appropriate for all audiences. Avoid any sexually suggestive, violent, or otherwise inappropriate content.
    
    You must output exactly one prompt in JSON format:
    
    ${stagePromptDefinition}
    
    Output JSON schema:
    {
      "stagePrompt": "string"
    }
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [
      {
        role: 'user',
        parts: [
          { text: "This is the source person image for clothing, pose, and perspective:" },
          {
            inlineData: {
              data: sourcePersonImageBase64,
              mimeType: sourcePersonImageMimeType
            }
          },
          { text: "This is the background image for context (details and lighting):" },
          {
            inlineData: {
              data: backgroundImageBase64,
              mimeType: backgroundImageMimeType
            }
          },
          { text: "This is the reference image for the person's likeness:" },
          {
            inlineData: {
              data: referencePersonImageBase64,
              mimeType: referencePersonImageMimeType
            }
          },
          {
            text: "Generate the Stage Prompt based on these images and my instructions."
          }
        ]
      }
    ],
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          stagePrompt: { type: Type.STRING }
        },
        required: ["stagePrompt"]
      }
    }
  });

  const resultText = response.text?.trim() || "{}";
  return JSON.parse(resultText);
};

export const removePeopleFromImage = async (
  base64: string,
  mimeType: string
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: [{
      role: 'user',
      parts: [
        {
          inlineData: {
            data: base64,
            mimeType: mimeType,
          },
        },
        {
          text: 'Remove all people from this image. Only return the edited image.',
        },
      ],
    }],
  });
  
  const candidate = response.candidates?.[0];
  if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData) {
          return part.inlineData.data;
        }
      }
  }

  if (response.promptFeedback?.blockReason) {
    throw new Error(`Request was blocked for reason: ${response.promptFeedback.blockReason}`);
  }

  const text = response.text;
  if (text) {
    throw new Error(`Image generation failed, model returned text: "${text}"`);
  }

  throw new Error("Could not find image data in Gemini response.");
};

export const describeClothing = async (
  base64: string,
  mimeType: string
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: 'Analyze the provided image and describe the clothing worn by the person in detail. Focus on the type of clothing, color, pattern, material, and style. The description should be a single, concise paragraph.'
          },
          {
            inlineData: {
              data: base64,
              mimeType: mimeType
            }
          }
        ]
      }
    ]
  });

  const text = response.text;
  if (!text) {
      throw new Error("Failed to get a description from the model.");
  }
  return text.trim();
};

// FIX: Added missing upscaleImage function.
export const upscaleImage = async (
  base64: string,
  mimeType: string
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: [{
      role: 'user',
      parts: [
        {
          inlineData: {
            data: base64,
            mimeType: mimeType,
          },
        },
        {
          text: 'Upscale this image, increasing its resolution and detail. Only return the edited image.',
        },
      ],
    }],
  });
  
  const candidate = response.candidates?.[0];
  if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData) {
          return part.inlineData.data;
        }
      }
  }

  if (response.promptFeedback?.blockReason) {
    throw new Error(`Request was blocked for reason: ${response.promptFeedback.blockReason}`);
  }

  const text = response.text;
  if (text) {
    throw new Error(`Image generation failed, model returned text: "${text}"`);
  }

  throw new Error("Could not find image data in Gemini response.");
};


export const generate360Image = async (
  base64: string,
  mimeType: string
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: [{
      role: 'user',
      parts: [
        {
          inlineData: {
            data: base64,
            mimeType: mimeType,
          },
        },
        {
          text: 'Turn this image into a 360 panoramic image. Only return the edited image.',
        },
      ],
    }],
  });
  
  const candidate = response.candidates?.[0];
  if (candidate?.content?.parts) {
    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }
  }
  
  if (response.promptFeedback?.blockReason) {
    throw new Error(`Request was blocked for reason: ${response.promptFeedback.blockReason}`);
  }

  const text = response.text;
  if (text) {
    throw new Error(`Image generation failed, model returned text: "${text}"`);
  }

  throw new Error("Could not find image data in Gemini response.");
};

export const analyzeActionsFromFrames = async (
  frames: { base64: string; mimeType: string }[]
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const promptParts: any[] = [
    {
      text: `Analyze the following sequence of images and provide a detailed description of the person's actions and movements.
- Describe the full body sequence in detail, including actions like walking, dancing, or posing.
- Pay close attention to and describe the specifics of hand movements and gestures.
- Detail the person's facial expressions and any changes in emotion they convey.
- Focus ONLY on the sequence of actions, gestures, and expressions.
- Do NOT describe their physical appearance (gender, age, hair, eyes, etc.).
- Do NOT describe their clothing.
- Do NOT describe the background or environment.
- CRITICAL: Do NOT mention or describe any speaking, talking, or lip movements that suggest forming words or sentences.
The output must be a single, cohesive paragraph.`
    },
  ];

  frames.forEach(frame => {
    promptParts.push({
      inlineData: {
        data: frame.base64,
        mimeType: frame.mimeType
      }
    });
  });

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [
      {
        role: 'user',
        parts: promptParts
      }
    ]
  });

  const text = response.text;
  if (!text) {
      throw new Error("Failed to get a description from the model.");
  }
  return text.trim();
};