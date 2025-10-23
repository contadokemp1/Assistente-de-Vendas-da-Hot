
import React, { useState, useEffect } from 'react';
import type { Agent } from '../types';
import { PencilIcon, TrashIcon, PlusIcon } from './icons';

interface AgentManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  agents: Agent[];
  onSaveAgent: (agent: Omit<Agent, 'id'> & { id?: string }) => void;
  onDeleteAgent: (agentId: string) => void;
}

const AgentManagerModal: React.FC<AgentManagerModalProps> = ({ isOpen, onClose, agents, onSaveAgent, onDeleteAgent }) => {
  const [editingAgent, setEditingAgent] = useState<Partial<Agent> | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setEditingAgent(null);
    }
  }, [isOpen]);

  const handleSave = () => {
    if (editingAgent && editingAgent.name && editingAgent.prompt) {
      onSaveAgent(editingAgent as Omit<Agent, 'id'> & { id?: string });
      setEditingAgent(null);
    }
  };

  const startNewAgent = () => {
    setEditingAgent({ name: '', prompt: '' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-[#111111] border border-hot-red/50 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col hot-glow" onClick={e => e.stopPropagation()}>
        <header className="p-6 border-b border-hot-red/30">
          <h2 className="text-2xl font-bold text-hot-white">Gerenciar Agentes</h2>
        </header>
        
        <div className="flex-grow p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Agent List */}
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-hot-white/90">Meus Agentes</h3>
                <button onClick={startNewAgent} className="flex items-center gap-1.5 text-sm bg-hot-red text-white font-semibold py-1.5 px-3 rounded-lg hover:bg-hot-red/90">
                    <PlusIcon className="w-4 h-4" />
                    Novo
                </button>
            </div>
            <ul className="space-y-2">
              {agents.map(agent => (
                <li key={agent.id} className="flex items-center justify-between p-3 bg-black/50 rounded-lg transition-colors hover:bg-hot-red/20">
                  <span className="font-medium text-hot-white/90">{agent.name} {agent.isDefault ? <span className="text-xs text-hot-red/80">(Padrão)</span> : ''}</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setEditingAgent(agent)} className="text-hot-white/70 hover:text-hot-red p-1"><PencilIcon className="w-5 h-5" /></button>
                    {!agent.isDefault && (
                      <button onClick={() => onDeleteAgent(agent.id)} className="text-hot-white/70 hover:text-hot-red p-1"><TrashIcon className="w-5 h-5" /></button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Agent Editor */}
          <div className={`p-4 rounded-lg transition-colors ${editingAgent ? 'bg-black/50 border border-hot-red/30' : 'flex items-center justify-center text-hot-white/50 bg-black/20'}`}>
            {editingAgent ? (
              <div className="flex flex-col gap-4 h-full">
                <h3 className="text-lg font-semibold text-hot-white/90">{editingAgent.id ? 'Editar Agente' : 'Novo Agente'}</h3>
                <div>
                  <label htmlFor="agentName" className="block text-sm font-medium text-hot-white/70 mb-1">Nome do Agente</label>
                  <input
                    id="agentName"
                    type="text"
                    placeholder="Ex: Especialista em E-commerce"
                    value={editingAgent.name || ''}
                    onChange={e => setEditingAgent({ ...editingAgent, name: e.target.value })}
                    className="w-full px-3 py-2 bg-[#111] border border-hot-red/40 rounded-md text-sm shadow-sm placeholder-hot-white/40 focus:outline-none focus:ring-1 focus:ring-hot-red focus:border-hot-red text-hot-white"
                    disabled={editingAgent.isDefault}
                  />
                </div>
                <div className="flex-grow flex flex-col">
                  <label htmlFor="agentPrompt" className="block text-sm font-medium text-hot-white/70 mb-1">Instrução de Sistema (Prompt)</label>
                  <textarea
                    id="agentPrompt"
                    placeholder="Cole a instrução do sistema aqui..."
                    value={editingAgent.prompt || ''}
                    onChange={e => setEditingAgent({ ...editingAgent, prompt: e.target.value })}
                    className="w-full flex-grow px-3 py-2 bg-[#111] border border-hot-red/40 rounded-md text-sm shadow-sm placeholder-hot-white/40 focus:outline-none focus:ring-1 focus:ring-hot-red focus:border-hot-red text-hot-white"
                    disabled={editingAgent.isDefault}
                    rows={10}
                  />
                </div>
                {!editingAgent.isDefault && (
                    <div className="flex justify-end gap-3">
                        <button onClick={() => setEditingAgent(null)} className="py-2 px-4 bg-hot-white/20 text-hot-white font-semibold rounded-lg hover:bg-hot-white/30">Cancelar</button>
                        <button onClick={handleSave} className="py-2 px-4 bg-hot-red text-white font-semibold rounded-lg hover:bg-hot-red/90">Salvar</button>
                    </div>
                )}
              </div>
            ) : (
                <p>Selecione um agente para editar ou crie um novo.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentManagerModal;