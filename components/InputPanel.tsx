
import React, { useRef, useState, useCallback, useEffect } from 'react';
import type { BusinessParams, Agent } from '../types';
import BusinessParamsEditor from './BusinessParams';
import { UploadIcon, MicIcon, StopIcon, SparklesIcon } from './icons';

interface InputPanelProps {
  customerMessage: string;
  setCustomerMessage: React.Dispatch<React.SetStateAction<string>>;
  setUploadedImage: (file: { file: File, base64: string, mimeType: string } | null) => void;
  setAudioForTranscription: (blob: Blob | null) => void;
  isRecording: boolean;
  isTranscribing: boolean;
  startRecording: () => void;
  stopRecording: () => void;
  transcribedText: string;
  businessParams: BusinessParams;
  setBusinessParams: (params: BusinessParams) => void;
  useThinkingMode: boolean;
  setUseThinkingMode: (value: boolean) => void;
  onGenerate: () => void;
  isLoading: boolean;
  agents: Agent[];
  selectedAgentId: string;
  onAgentChange: (id: string) => void;
  onManageAgents: () => void;
}

const InputPanel: React.FC<InputPanelProps> = ({
  customerMessage,
  setCustomerMessage,
  setUploadedImage,
  setAudioForTranscription,
  isRecording,
  isTranscribing,
  startRecording,
  stopRecording,
  transcribedText,
  businessParams,
  setBusinessParams,
  useThinkingMode,
  setUseThinkingMode,
  onGenerate,
  isLoading,
  agents,
  selectedAgentId,
  onAgentChange,
  onManageAgents,
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        setImagePreview(reader.result as string);
        setUploadedImage({ file, base64: base64String, mimeType: file.type });
      };
      reader.readAsDataURL(file);
    }
  };
  
  useEffect(() => {
    if(transcribedText) {
      setCustomerMessage(prev => `${prev}\n\n[Transcrição de áudio]: ${transcribedText}`.trim());
    }
  }, [transcribedText, setCustomerMessage]);

  return (
    <div className="w-full lg:w-1/2 p-6 bg-black/70 backdrop-blur-sm border border-hot-red/30 rounded-2xl flex flex-col gap-6 h-full hot-glow-light">
      <h2 className="text-2xl font-bold text-hot-white">1. Insira os dados do cliente</h2>
      
      <div className="flex flex-col gap-2">
        <label htmlFor="agent-selector" className="font-medium text-hot-white/80">Agente de IA</label>
        <div className="flex gap-2">
            <select
                id="agent-selector"
                value={selectedAgentId}
                onChange={(e) => onAgentChange(e.target.value)}
                className="flex-grow w-full p-3 border border-hot-red/40 rounded-lg focus:ring-2 focus:ring-hot-red transition duration-150 bg-[#111] text-hot-white"
                disabled={isLoading}
            >
                {agents.map(agent => (
                    <option key={agent.id} value={agent.id} className="bg-[#111] text-hot-white">{agent.name}</option>
                ))}
            </select>
            <button onClick={onManageAgents} className="px-4 py-2 bg-black/50 text-hot-white font-semibold rounded-lg border border-hot-red/40 hover:bg-hot-red hover:text-white transition duration-150 disabled:opacity-50" disabled={isLoading}>
                Gerenciar
            </button>
        </div>
      </div>
      
      <div className="flex flex-col gap-2">
        <label htmlFor="customerMessage" className="font-medium text-hot-white/80">Mensagem do Cliente (texto, áudio, imagem)</label>
        <textarea
          id="customerMessage"
          value={customerMessage}
          onChange={(e) => setCustomerMessage(e.target.value)}
          placeholder="Cole a mensagem do cliente aqui..."
          className="w-full h-40 p-3 border border-hot-red/40 rounded-lg focus:ring-2 focus:ring-hot-red transition duration-150 bg-[#111] text-hot-white placeholder:text-hot-white/50"
          disabled={isLoading}
        />
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-transparent text-hot-white font-semibold rounded-lg border border-hot-red/60 hover:bg-hot-red hover:border-hot-red transition duration-150 disabled:opacity-50"
        >
          <UploadIcon className="w-5 h-5" />
          Anexar Imagem
        </button>
        <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
        
        <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isLoading || isTranscribing}
            className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 font-semibold rounded-lg border transition duration-150 disabled:opacity-50 ${
                isRecording 
                ? 'bg-hot-red text-white border-hot-red' 
                : 'bg-transparent text-hot-white border-hot-red/60 hover:bg-hot-red hover:border-hot-red'
            }`}
        >
            {isRecording ? <StopIcon className="w-5 h-5" /> : <MicIcon className="w-5 h-5" />}
            <span>{isRecording ? 'Parar Gravação' : (isTranscribing ? 'Transcrevendo...' : 'Gravar Áudio')}</span>
        </button>
      </div>

      {imagePreview && (
        <div className="relative">
          <img src={imagePreview} alt="Preview" className="w-32 h-32 object-cover rounded-lg border-2 border-hot-red/50" />
          <button onClick={() => { setImagePreview(null); setUploadedImage(null); if(fileInputRef.current) fileInputRef.current.value = ""; }} className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-1 leading-none w-6 h-6 flex items-center justify-center">&times;</button>
        </div>
      )}

      <BusinessParamsEditor params={businessParams} onParamsChange={setBusinessParams} />
      
      <div className="flex items-center justify-between bg-black/50 p-4 rounded-lg border border-hot-red/30">
        <div className="flex items-center gap-3">
            <SparklesIcon className="w-6 h-6 text-hot-red"/>
            <div>
                <h3 className="font-semibold text-hot-white">Modo Pensamento</h3>
                <p className="text-sm text-hot-white/60">Usa o modelo avançado para consultas complexas.</p>
            </div>
        </div>
        <button
          type="button"
          className={`${
            useThinkingMode ? 'bg-hot-red' : 'bg-hot-white/20'
          } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-hot-red focus:ring-offset-2 focus:ring-offset-black`}
          role="switch"
          aria-checked={useThinkingMode}
          onClick={() => setUseThinkingMode(!useThinkingMode)}
          disabled={isLoading}
        >
          <span
            aria-hidden="true"
            className={`${
              useThinkingMode ? 'translate-x-5' : 'translate-x-0'
            } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
          />
        </button>
      </div>

      <button
        onClick={onGenerate}
        disabled={isLoading || isRecording || !customerMessage.trim()}
        className="w-full mt-auto bg-hot-red text-white font-bold py-3 px-4 rounded-lg hover:bg-hot-red/90 transition duration-150 flex items-center justify-center gap-2 disabled:bg-hot-red/50 disabled:cursor-not-allowed hot-glow"
      >
        {isLoading ? (
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : 'Gerar Resposta'}
      </button>
    </div>
  );
};

export default InputPanel;