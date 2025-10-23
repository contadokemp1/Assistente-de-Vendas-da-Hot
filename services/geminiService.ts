
import { GoogleGenAI, GenerateContentResponse, Blob, Chat, Part } from '@google/genai';
import type { BusinessParams } from '../types';
import { encode } from '../utils/audio';

export const startChat = (systemInstruction: string, businessParams: BusinessParams) => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const businessParamsText = Object.entries(businessParams)
    .filter(([, value]) => value)
    .map(([key, value]) => `{${key.toUpperCase()}}: ${value}`)
    .join('\n');
    
  const fullSystemInstruction = `${systemInstruction}\n\nParâmetros do negócio fornecidos:\n${businessParamsText || 'Nenhum parâmetro fornecido.'}`;

  const modelName = 'gemini-2.5-flash';

  const chat = ai.chats.create({
    model: modelName,
    config: {
        systemInstruction: fullSystemInstruction,
    }
  });
  return chat;
};

export const sendMessage = async (
  chat: Chat,
  message: string,
  image: { base64: string; mimeType: string } | null,
): Promise<string> => {
  
  const parts: Part[] = [];

  if (image) {
    parts.push({
      inlineData: {
        data: image.base64,
        mimeType: image.mimeType,
      },
    });
  }

  // Only add the text message if it's not empty
  if (message.trim()) {
    parts.push({ text: message });
  }
  
  // The UI should prevent calling this with no content, but as a safeguard:
  if (parts.length === 0) {
    return '';
  }
  
  const response: GenerateContentResponse = await chat.sendMessage({ message: parts });
  return response.text;
};


export const transcribeAudio = (audioBlob: globalThis.Blob): Promise<string> => {
   if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  return new Promise(async (resolve, reject) => {
    let transcribedText = '';
    
    try {
      const audioContext = new AudioContext({ sampleRate: 16000 });
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      const pcmData = audioBuffer.getChannelData(0);

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            const chunkSize = 4096;
            for (let i = 0; i < pcmData.length; i += chunkSize) {
                const chunk = pcmData.slice(i, i + chunkSize);
                const int16 = new Int16Array(chunk.length);
                for (let j = 0; j < chunk.length; j++) {
                    int16[j] = Math.max(-1, Math.min(1, chunk[j])) * 32767;
                }
                const pcmBlob: Blob = {
                    data: encode(new Uint8Array(int16.buffer)),
                    mimeType: 'audio/pcm;rate=16000',
                };
                sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
            }
            sessionPromise.then(session => session.close());
          },
          onmessage: (message) => {
            if (message.serverContent?.inputTranscription) {
              transcribedText += message.serverContent.inputTranscription.text;
            }
          },
          onerror: (e) => {
            console.error('Live session error:', e);
            reject(new Error('Error during transcription session.'));
          },
          onclose: () => {
            resolve(transcribedText);
          },
        },
        config: {
          inputAudioTranscription: {},
        },
      });
    } catch (error) {
      console.error("Transcription failed:", error);
      reject(error);
    }
  });
};