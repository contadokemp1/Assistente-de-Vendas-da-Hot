
import React, { useRef, useState, useCallback, useEffect } from 'react';
import type { BusinessParams, Agent } from '../types';
import BusinessParamsEditor from './BusinessParams';
import { UploadIcon, MicIcon, StopIcon } from './icons';

interface InputPanelProps {
  customerMessage: string;
  setCustomerMessage: React.Dispatch<React.SetStateAction<string>>;
  setUploadedImage: (file: { file: File, base64: string, mimeType: string } | null) => void;
  isRecording: boolean;
  isTranscribing: boolean;
  startRecording: () => void;
  stopRecording: () => void;
  businessParams: BusinessParams;
  setBusinessParams: (params: BusinessParams) => void;
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
  isRecording,
  isTranscribing,
  startRecording,
  stopRecording,
  businessParams,
  setBusinessParams,
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
        const previewUrl = reader.result as string;
        setImagePreview(previewUrl);
        setUploadedImage({ file, base64: base64String, mimeType: file.type });
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleRemoveImage = () => {
      setImagePreview(null);
      setUploadedImage(null);
      if(fileInputRef.current) fileInputRef.current.value = "";
  }
  
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        if (!isLoading && !isRecording && customerMessage.trim()) {
            onGenerate();
        }
    }
  };


  return (
    <div className="w-full lg:w-1/2 p-6 bg-black/70 backdrop-blur-sm border border-hot-red/30 rounded-2xl flex flex-col gap-6 h-full hot-glow-light">
      <h2 className="text-2xl font-bold text-hot-white">1. Interaja com o Assistente</h2>
      
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
      
      <div className="flex flex-col gap-2 flex-grow">
        <label htmlFor="customerMessage" className="font-medium text-hot-white/80">Sua Mensagem (texto, áudio, imagem)</label>
        <textarea
          id="customerMessage"
          value={customerMessage}
          onChange={(e) => setCustomerMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite sua mensagem aqui ou grave um áudio..."
          className="w-full h-40 p-3 border border-hot-red/40 rounded-lg focus:ring-2 focus:ring-hot-red transition duration-150 bg-[#111] text-hot-white placeholder:text-hot-white/50 flex-grow"
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
        <div className="relative w-32 h-32">
          <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-lg border-2 border-hot-red/50" />
          <button onClick={handleRemoveImage} className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-1 leading-none w-6 h-6 flex items-center justify-center">&times;</button>
        </div>
      )}

      <BusinessParamsEditor params={businessParams} onParamsChange={setBusinessParams} />
      
      <button
        onClick={onGenerate}
        disabled={isLoading || isRecording || (!customerMessage.trim() && !imagePreview)}
        className="w-full mt-auto bg-hot-red text-white font-bold py-3 px-4 rounded-lg hover:bg-hot-red/90 transition duration-150 flex items-center justify-center gap-2 disabled:bg-hot-red/50 disabled:cursor-not-allowed hot-glow"
      >
        {isLoading ? (
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : 'Enviar'}
      </button>
    </div>
  );
};

export default InputPanel;
