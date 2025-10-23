import { GoogleGenAI, GenerateContentResponse, Blob } from '@google/genai';
import type { BusinessParams, GeminiOutput } from '../types';
import { encode } from '../utils/audio';

const parseResponse = (text: string): GeminiOutput => {
  const output: Partial<GeminiOutput> = {};
  
  const sections = [
    { key: 'mensagemPrincipal', start: '1) Mensagem principal (copiar e colar):', altStart: '1️⃣ Mensagem principal:', endNext: ['2) Alternativas de envio', '2️⃣ Alternativas', '3) Script de Áudio', '3️⃣ Roteiro de áudio'] },
    { key: 'alternativaCurta', start: 'Versão curta:', endNext: ['Versão detalhada'] },
    { key: 'alternativaDetalhada', start: 'Versão detalhada:', endNext: ['3) Script de Áudio', '3️⃣ Roteiro de áudio'] },
    { key: 'scriptAudio', start: '3) Script de Áudio (20–40s):', altStart: '3️⃣ Roteiro de áudio (20–40s):', endNext: ['4) Próximo passo', '4️⃣ Próximo passo'] },
    { key: 'proximoPasso', start: '4) Próximo passo + CTA:', altStart: '4️⃣ Próximo passo / CTA:', endNext: ['5) Mini-checklist interno', '5️⃣ Checklist interno'] },
    { key: 'checklistIntencao', start: 'Intenção do cliente', altStart: 'Intenção da lead', endNext: ['Obstáculo/objeção provável', 'Obstáculo', 'Emoção dominante'] },
    { key: 'checklistObstaculo', start: 'Obstáculo/objeção provável', altStart: 'Obstáculo:', endNext: ['Sinal de prontidão', 'Temperatura'] },
    { key: 'checklistProntidao', start: 'Sinal de prontidão', altStart: 'Temperatura (fria, morna, quente)', endNext: ['Sugestão de follow-up', 'Etapa'] },
    { key: 'checklistFollowUp', start: 'Sugestão de follow-up', altStart: 'Sugestão de follow-up 24–48h', endNext: ['6) Campos para CRM', '6️⃣ Campos para CRM'] },
  ];

  for (const section of sections) {
      let startIndex = text.indexOf(section.start);
      if(startIndex === -1 && section.altStart) {
          startIndex = text.indexOf(section.altStart);
      }
      if (startIndex === -1) continue;
      
      const startTag = text.includes(section.start) ? section.start : (section.altStart || '');
      startIndex += startTag.length;

      let endIndex = text.length;
      for (const next of section.endNext) {
          const nextIndex = text.indexOf(next, startIndex);
          if (nextIndex !== -1) {
              endIndex = Math.min(endIndex, nextIndex);
          }
      }
      output[section.key as keyof GeminiOutput] = text.substring(startIndex, endIndex).trim();
  }

  const crmHeader = '6) Campos para CRM';
  const crmHeaderAlt = '6️⃣ Campos para CRM';
  let crmStartIndex = text.indexOf(crmHeader);
  if (crmStartIndex === -1) {
    crmStartIndex = text.indexOf(crmHeaderAlt);
  }

  if (crmStartIndex !== -1) {
    const crmSection = text.substring(crmStartIndex);
    const crmLine = crmSection.split('\n')[1] || '';
    const crmParts = crmLine.split('|').map(p => p.trim());
    output.crmNome = crmParts[0] || '';
    output.crmInteresse = crmParts[1] || '';
    output.crmTicket = crmParts[2] || '';
    output.crmEtapa = crmParts[3] || '';
    output.crmProximaAcao = crmParts[4] || '';
    output.crmDeadline = crmParts[5] || '';
    output.crmObservacoes = crmParts[6] || '';
  }
  
  return output as GeminiOutput;
};

export const generateSalesResponse = async (
  message: string,
  image: { base64: string; mimeType: string } | null,
  businessParams: BusinessParams,
  useThinkingMode: boolean,
  systemInstruction: string,
): Promise<GeminiOutput> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const modelName = useThinkingMode ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
  
  const businessParamsText = Object.entries(businessParams)
    .filter(([, value]) => value)
    .map(([key, value]) => `{${key.toUpperCase()}}: ${value}`)
    .join('\n');

  const fullPrompt = `
Parâmetros do negócio fornecidos:
${businessParamsText || 'Nenhum parâmetro fornecido.'}

---

Mensagem do cliente:
${message}
`;

  const parts: (string | { inlineData: { data: string; mimeType: string; } })[] = [fullPrompt];
  if (image) {
    parts.unshift({
      inlineData: {
        data: image.base64,
        mimeType: image.mimeType,
      },
    });
  }

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: modelName,
    contents: { parts: parts },
    config: {
      systemInstruction: systemInstruction,
      ...(useThinkingMode && { thinkingConfig: { thinkingBudget: 32768 } })
    }
  });

  return parseResponse(response.text);
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
