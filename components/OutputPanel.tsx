
import React, { useState } from 'react';
import type { GeminiOutput } from '../types';
import { CopyIcon, CheckIcon } from './icons';

interface OutputPanelProps {
  output: GeminiOutput | null;
  isLoading: boolean;
  error: string | null;
}

const CopyableField: React.FC<{ title: string, content: string }> = ({ title, content }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!content) return null;

    return (
        <div className="bg-black/50 p-4 rounded-lg border border-hot-red/30 relative">
            <h4 className="font-semibold text-hot-red mb-2">{title}</h4>
            <pre className="text-hot-white/90 whitespace-pre-wrap font-sans text-sm">{content}</pre>
            <button onClick={handleCopy} className="absolute top-3 right-3 p-1.5 bg-hot-red/20 text-hot-white rounded-md hover:bg-hot-red/40 transition-colors">
                {copied ? <CheckIcon className="w-4 h-4 text-green-400" /> : <CopyIcon className="w-4 h-4" />}
            </button>
        </div>
    );
}

const OutputPanel: React.FC<OutputPanelProps> = ({ output, isLoading, error }) => {
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-4 animate-pulse">
            <div className="h-6 bg-hot-white/10 rounded w-1/3"></div>
            <div className="h-20 bg-hot-white/10 rounded"></div>
            <div className="h-6 bg-hot-white/10 rounded w-1/4"></div>
            <div className="flex gap-4">
                <div className="h-10 bg-hot-white/10 rounded w-1/2"></div>
                <div className="h-10 bg-hot-white/10 rounded w-1/2"></div>
            </div>
            <div className="h-24 bg-hot-white/10 rounded"></div>
        </div>
      );
    }

    if (error) {
      return <div className="p-4 bg-hot-red/20 border border-hot-red text-hot-white rounded-lg">{error}</div>;
    }

    if (!output) {
      return (
        <div className="text-center text-hot-white/60 flex flex-col items-center justify-center h-full">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-hot-red/40 mb-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.17 48.17 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
            </svg>
            <h3 className="text-xl font-semibold text-hot-white/80">Sua resposta aparecerá aqui</h3>
            <p className="max-w-sm mt-2">Preencha as informações do cliente e clique em "Gerar Resposta" para começar.</p>
        </div>
      );
    }

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <h3 className="text-xl font-bold text-hot-white">✅ Respostas para o Cliente</h3>
                <CopyableField title="1) Mensagem Principal" content={output.mensagemPrincipal} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <CopyableField title="Alternativa Curta" content={output.alternativaCurta} />
                    <CopyableField title="Alternativa Detalhada" content={output.alternativaDetalhada} />
                </div>
                <CopyableField title="3) Script de Áudio" content={output.scriptAudio} />
                <CopyableField title="4) Próximo Passo + CTA" content={output.proximoPasso} />
            </div>

            <div className="space-y-4 bg-hot-red/10 p-5 rounded-xl border border-hot-red/30">
                <h3 className="text-xl font-bold text-hot-white">📋 Análise Interna (Não Enviar)</h3>
                
                <div className="bg-black/30 p-4 rounded-lg">
                    <h4 className="font-semibold text-hot-red mb-2">5) Mini-Checklist Interno</h4>
                    <ul className="space-y-2 text-sm text-hot-white/80 list-disc list-inside">
                        {output.checklistIntencao && <li><strong>Intenção:</strong> {output.checklistIntencao}</li>}
                        {output.checklistObstaculo && <li><strong>Obstáculo:</strong> {output.checklistObstaculo}</li>}
                        {output.checklistProntidao && <li><strong>Prontidão:</strong> {output.checklistProntidao}</li>}
                        {output.checklistFollowUp && <li><strong>Follow-up:</strong> {output.checklistFollowUp}</li>}
                    </ul>
                </div>

                <div className="bg-black/30 p-4 rounded-lg">
                    <h4 className="font-semibold text-hot-red mb-2">6) Campos para CRM</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 text-sm">
                        <div className="text-hot-white/80"><strong className="text-hot-white/60">Nome:</strong> {output.crmNome}</div>
                        <div className="text-hot-white/80"><strong className="text-hot-white/60">Interesse:</strong> {output.crmInteresse}</div>
                        <div className="text-hot-white/80"><strong className="text-hot-white/60">Ticket:</strong> {output.crmTicket}</div>
                        <div className="text-hot-white/80"><strong className="text-hot-white/60">Etapa:</strong> {output.crmEtapa}</div>
                        <div className="text-hot-white/80"><strong className="text-hot-white/60">Próx. Ação:</strong> {output.crmProximaAcao}</div>
                        <div className="text-hot-white/80"><strong className="text-hot-white/60">Deadline:</strong> {output.crmDeadline}</div>
                        <div className="col-span-2 md:col-span-3 text-hot-white/80"><strong className="text-hot-white/60">Obs:</strong> {output.crmObservacoes}</div>
                    </div>
                </div>
            </div>
        </div>
    );
  };

  return (
    <div className="w-full lg:w-1/2 p-6 bg-black/70 backdrop-blur-sm border border-hot-red/30 rounded-2xl h-full overflow-y-auto hot-glow-light">
      <h2 className="text-2xl font-bold text-hot-white mb-6">2. Analise e Use a Resposta Gerada</h2>
      {renderContent()}
    </div>
  );
};

export default OutputPanel;