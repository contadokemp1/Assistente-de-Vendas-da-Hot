
import React, { useRef, useEffect } from 'react';
import type { ChatMessage } from '../types';

interface OutputPanelProps {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
}

const OutputPanel: React.FC<OutputPanelProps> = ({ messages, isLoading, error }) => {
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const renderContent = () => {
    if (!messages.length && !isLoading && !error) {
      return (
        <div className="text-center text-hot-white/60 flex flex-col items-center justify-center h-full">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-hot-red/40 mb-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.17 48.17 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
            </svg>
            <h3 className="text-xl font-semibold text-hot-white/80">Sua conversa começa aqui</h3>
            <p className="max-w-sm mt-2">Envie uma mensagem, imagem ou áudio para iniciar a conversa com seu assistente de IA.</p>
        </div>
      );
    }

    return (
      <div className="flex-grow flex flex-col h-full">
        <div className="flex-grow overflow-y-auto space-y-4 pr-2 -mr-2">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xl p-3 rounded-2xl ${
                    msg.role === 'user' 
                        ? 'bg-hot-red text-white rounded-br-none' 
                        : 'bg-black/50 border border-hot-red/30 text-hot-white rounded-bl-none'
                }`}>
                  {msg.imagePreview && (
                    <img src={msg.imagePreview} alt="User upload" className="rounded-lg mb-2 max-w-xs" />
                  )}
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.text}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-end gap-2 justify-start">
                <div className="max-w-xl p-3 rounded-2xl bg-black/50 border border-hot-red/30 text-hot-white rounded-bl-none">
                    <div className="flex items-center gap-2">
                        <span className="block w-2 h-2 bg-hot-red/50 rounded-full animate-pulse [animation-delay:0s]"></span>
                        <span className="block w-2 h-2 bg-hot-red/50 rounded-full animate-pulse [animation-delay:0.2s]"></span>
                        <span className="block w-2 h-2 bg-hot-red/50 rounded-full animate-pulse [animation-delay:0.4s]"></span>
                    </div>
                </div>
              </div>
            )}
            {error && <div className="p-4 bg-hot-red/20 border border-hot-red text-hot-white rounded-lg">{error}</div>}
            <div ref={messagesEndRef} />
        </div>
      </div>
    );
  };

  return (
    <div className="w-full lg:w-1/2 p-6 bg-black/70 backdrop-blur-sm border border-hot-red/30 rounded-2xl h-full flex flex-col hot-glow-light">
      <h2 className="text-2xl font-bold text-hot-white mb-6">2. Conversa com o Assistente</h2>
      {renderContent()}
    </div>
  );
};

export default OutputPanel;
