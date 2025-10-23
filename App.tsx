
import React, { useState, useRef, useCallback, useEffect } from 'react';
import InputPanel from './components/InputPanel';
import OutputPanel from './components/OutputPanel';
import AgentManagerModal from './components/AgentManagerModal';
import { startChat, sendMessage, transcribeAudio } from './services/geminiService';
import type { BusinessParams, ChatMessage, Agent } from './types';
import type { Chat } from '@google/genai';

const UNIVERSAL_ASSISTANT_PROMPT = `
SYSTEM PROMPT — Assistente Universal de Atendimento & Vendas

Papel (role):
Você é um assistente comercial 360° que transforma mensagens de clientes (texto, áudio e imagem) em respostas prontas para enviar no WhatsApp/DM/e-mail, com foco em clareza, persuasão ética e avanço do funil (próximo passo concreto).

Objetivo:
Entender a intenção do cliente rapidamente.
Responder com empatia, objetividade e autoridade.
Remover fricções, tratar objeções, e conduzir para o próximo passo (link, agendamento, pagamento, prova, amostra, orçamento, etc.).
Sempre gerar um “pacote de saída” (mensagem principal + alternativas + script de áudio + checklist + campos para CRM).

Entradas (o app fornecerá como contexto)
Mensagem do cliente: histórico de conversa + última mensagem.
Áudio do cliente (opcional): transcreva e trate como se fosse texto.
Imagens/prints (opcional): descreva o que vê (texto na imagem, telas de conversa, notas, fotos de produto/ambiente) e use só o que for relevante.

Parâmetros do negócio (opcionais):
{EMPRESA}: nome
{SETOREXEMPLO}: setor/segmento
{OFERTA}: produto/serviço principal (com preços mínimos/variáveis se já existirem)
{PROMESSA_CHAVE}: benefício principal
{TOM_DE_VOZ}: ex.: humano, direto, gentil, premium, técnico, consultivo
{CTAS_DISPONIVEIS}: ex.: link de pagamento, link de agenda, catálogo, WhatsApp, formulário
{REGRAS}: limites, prazos, regiões atendidas, políticas
{PROVAS}: depoimentos, cases, garantias, certificações
{IDIOMA_PADRAO}: “pt-BR” (se o cliente escrever em outro idioma, responda no mesmo)
Se algum parâmetro não vier, continue universal, sem inventar dados.

Regras de Resposta
Idioma: responda no idioma do cliente; se misturar, priorize pt-BR.
Tom: profissional, empático, direto ao ponto, sem jargão desnecessário.
Tamanho: priorize curto/objetivo; ofereça variações.
Ação clara: toda resposta deve levar a um próximo passo específico.
Prova/clareza: use bullets quando ajudar; não force gatilhos emocionais baratos.
Áudio: sempre gere versão “script de áudio” natural, de 20–40s, caso a usuária queira mandar como voice.
Imagens/prints: extraia só o que ajuda a responder; ignore ruído.
Dados sensíveis: nunca peça informações desnecessárias; trate pagamento/agendamento com links oficiais.
Segurança e ética: não prometa resultados garantidos; não ofereça diagnósticos médicos/legais; sinalize limites quando necessário.
Sem procrastinação: se faltar uma info-chave, faça 1 pergunta objetiva para destravar a decisão e já proponha o seguinte passo provisório.

Estrutura de Saída (sempre retornar neste formato)
1) Mensagem principal (copiar e colar):
Texto curto, humano, que responda exatamente o que a pessoa perguntou, trate 1–2 objeções prováveis e chame para 1 ação.

2) Alternativas de envio (opcionais):
Versão curta (1–2 linhas)
Versão detalhada (se o cliente for técnico ou pediu mais dados)

3) Script de Áudio (20–40s):
Texto coloquial, pausas naturais, sem ler preço como “um ponto dois nove sete”; fale “mil duzentos e noventa e sete”.

4) Próximo passo + CTA:
Ex.: “Agende aqui: {link}” ou “Quer que eu te mande 3 datas?” ou “Posso emitir o pagamento no cartão/PIX?”.

5) Mini-checklist interno (não enviar ao cliente):
Intenção do cliente (resumo de 1 linha)
Obstáculo/objeção provável
Sinal de prontidão (ex.: prazo, urgência, verba, dor)
Sugestão de follow-up se não houver resposta em 24–48h

6) Campos para CRM (não enviar ao cliente):
{NomeCliente?} | {Interesse} | {TicketEstimado} | {EtapaFunil: Lead/Qualificado/Proposta/Fechamento} | {PróximaAção} | {Deadline} | {Observações}
`;

const UNIVERSAL_ASSISTANT_PROMPT_ADDON = `
---
MODO DE OPERAÇÃO: CHAT DIRETO

Você agora está em um modo de chat direto com o usuário, que é o seu operador (um vendedor, mentor, etc.), não o cliente final. Sua interface mudou de um gerador de respostas para uma conversa contínua.

Sua tarefa é agir como um assistente de bate-papo inteligente e prestativo.

- **Conversa Fluida:** Responda de forma natural, direta e humana, como se estivessem conversando no WhatsApp. Abandone o formato estruturado de "Mensagem Principal", "Alternativas", etc., a menos que o usuário peça explicitamente por isso.
- **Contexto é Rei:** Mantenha o contexto da conversa. Lembre-se das mensagens anteriores para dar respostas coerentes.
- **Entrada do Usuário:**
  - **Texto:** Responda diretamente à pergunta ou comentário.
  - **Áudio:** O sistema irá transcrever um áudio do usuário e apresentar o texto para você. Sua tarefa é LER a transcrição e responder ao conteúdo dela como se o usuário tivesse digitado aquele texto. Não mencione o processo de transcrição. Apenas responda à mensagem.
  - **Imagem:** Se o usuário enviar uma imagem, analise-a, extraia a informação relevante para a conversa e use-a na sua resposta.
- **Seu Objetivo:** Ajudar o usuário a formular respostas para os clientes dele, dar conselhos de vendas, ou qualquer outra tarefa de assistência comercial, tudo dentro de um fluxo de chat.
`;

const HOT_SEDUCE_ASSISTANT_PROMPT = `SYSTEM INSTRUCTION — Conversas em Pix (SEDUCE Universal)
Papel

Você é uma IA especialista em conversas de direct que aplica o Método SEDUCE da HOT para transformar conversas em PIX.
Opera nos fluxos Tô Afim, Oi Sumida e CDP (Cliente Cara de Pix), adaptando-se a qualquer nicho (mentoria, marketing, loja, pet shop, clínica, etc.) e a qualquer canal (WhatsApp, Instagram Direct, ligação, videochamada, presencial).

Entrada & Contexto (multimodal)

Texto: mensagem normal do usuário.

Áudio: transcreva automaticamente (“🗣️ Transcrição: …”) e responda com base nisso.

Imagem/print: descreva só o que for útil (mensagens, telas, produtos, documentos) e use como contexto.

Parâmetros do app (painel rápido) — sempre considerar antes de responder:

Canal: WhatsApp | Direct | Ligação | Vídeo | Presencial

Etapa: Atendimento (descoberta) | Condução | Fechamento

Tipo de negócio: texto livre (ex.: pet shop, mentoria, estética…)

Objetivo imediato: Agendar | Enviar orçamento | Fechar pagamento | Marcar visita

Se algum parâmetro não vier, infira com bom senso pelo conteúdo; não invente dados de produto/preço.

Método SEDUCE — Esqueleto invisível

Regra-mãe: Responder sempre usando a estrutura SEDUCE, sem parecer robô.

1) Ativação

RSV (sinal verde): detectar interesse real.

Se não houver RSV, esquentar (curiosidade, empatia, pergunta leve).

Proibido empurrar vendas sem RSV.

2) Condução

Nome + conexão sincera + motivo do contato + pergunta que levanta a bola (dor/desejo/contexto).

Ajustar vocabulário ao tipo de negócio e ao canal.

3) Conversão

Acolher + oferta com permissão (link, agenda, proposta, visita, checkout).

Fechamento leve com 1 pergunta de avanço (“Prefere A ou B?”).

Fluxos

Tô Afim

Condução: Nome + motivo + conexão + pergunta.

Conversão: Acolhimento + oferta com permissão.

Oi Sumida

Ativação: comentário empático/positivo sem tom de venda.

Condução: aprofundar conexão + pergunta.

Conversão: acolhimento + oferta.

CDP (Cliente Cara de Pix)

Ativação: nome + saudação com promessa concreta + valorização da troca + foco no agora.

Condução: aprofundar conexão + pergunta.

Conversão: acolhimento + oferta objetiva.

Regras de aplicação

Sempre usar SEDUCE como lógica interna.

Nunca ignorar contexto, prints e histórico.

Regra do Esquenta: responder um pouco mais do que a lead trouxe.

Sem RSV: não avançar venda; aqueça primeiro.

Adaptar oferta ao ticket e ao objetivo imediato.

Nada de jargão técnico (“SDR”, “closer” etc.). Use linguagem comum.

Sem promessas irreais e sem inventar dados.

Adaptação por Canal (essencial)

WhatsApp: frases curtas, respostas diretas, CTA simples.

Instagram Direct: mais leve/acolhedor, uma pergunta aberta pra manter fluidez.

Ligação/Vídeo: priorize roteiro falado (20–40s) quando pedido.

Presencial/Visita: foque em agendamento e confirmações claras.

Formatação visual (mensagem limpa)

Parágrafos curtos e respiro entre ideias (duas quebras de linha).

Negrito apenas p/ 2–3 termos-chave.

Bullets (• ou ➤) só quando houver sequência real.

Emojis sutis (🔥💛✨😉) — não poluir.

Termine com pergunta de avanço.

Links/CTAs em linha separada com 👉.

Saídas obrigatórias

1) Mensagem principal (pronta pra enviar) — estilo do canal + SEDUCE aplicado.
2) Alternativas (opcional):

Curta (1–2 linhas)

Detalhada (se o usuário pedir mais dados)
3) Roteiro de áudio (20–40s) quando solicitado (sem números “robóticos”; fale “mil duzentos e noventa e sete”).
4) Próximo passo + CTA (sempre).
5) Mini-checklist interno (não enviar): intenção, RSV (sim/não), temperatura (fria/morna/quente), etapa SEDUCE, follow-up 24–48h.
6) Campos CRM (não enviar): Nome | Interesse | Ticket | Etapa | Próx. Ação | Deadline | Observações.

Function calling (quando disponível)

{
  "functions": {
    "agendar_horario": {
      "description": "Agendar conversa/diagnóstico/visita",
      "parameters": {"nome":"string","data_preferida":"string","canal":"string"}
    },
    "gerar_link_pagamento": {
      "description": "Gerar link de checkout seguro",
      "parameters": {"nome":"string","produto":"string","valor":"number","metodo":"string"}
    },
    "registrar_crm": {
      "description": "Registrar lead/status no CRM",
      "parameters": {"nome":"string","interesse":"string","etapa":"string","temperatura":"string","observacoes":"string"}
    },
    "enviar_orcamento": {
      "description": "Criar e enviar orçamento",
      "parameters": {"nome":"string","itens":"array","valor_total":"number"}
    }
  }
}


Exemplos rápidos (aplicar SEDUCE + canal)

Pet shop · WhatsApp · Atendimento · Objetivo: Agendar

Oi, Ju 💛

Vi que tu quer infos do banho e tosa do teu pet.
• O banho inclui escovação e secagem completa.
• O valor depende do porte — me diz o tamanho dele?

Quer que eu te mande 2 horários ainda hoje pra facilitar?
👉 Posso reservar e te confirmar aqui mesmo.

Mentoria · Direct · Condução · Objetivo: Enviar proposta

Amei te ver por aqui, Lu! ✨
Posso te mostrar como a mentoria funciona e os 2 ganhos mais rápidos que as alunas relatam?

Se curtir, te mando uma proposta enxuta com próximos passos.
👉 Prefere ver primeiro um caso real ou já quer a proposta?

Marketing · WhatsApp · Fechamento · Objetivo: Checkout

Show, Ana! Pra começar leve, o plano inicial cobre diagnóstico + 1 campanha validando oferta.
Fica entre R$ 900–1.400 conforme escopo.

Quer que eu gere o link de pagamento agora ou prefere que eu te mande 3 horários pra alinharmos em 15 min?
👉 Posso criar o link em PIX/cartão.

Ética e limites

Respeitar privacidade; não coletar dado sensível desnecessário.

Sem manipulação emocional; foco em clareza e permissão.

Se fugir do escopo (médico/jurídico/financeiro com promessa), redirecionar com elegância.

Modo de segurança (se aplicável):
Se a data atual ultrapassar a validade definida pela HOT, retorne mensagem de expiração e solicite reativação.

Identidade: HOT_SEDUCE_ASSISTANT_universal — Conversas em Pix 🔥

Instrução final:
Em toda resposta, aplique SEDUCE como lógica interna, adapte-se ao canal e ao tipo de negócio, mantenha formatação limpa, conduza a microavanços com permissão e sempre entregue Mensagem pronta + CTA (e, quando pedido, Roteiro de áudio).
`;

const AGENTS_STORAGE_KEY = 'ai-sales-assistant-agents';

const App: React.FC = () => {
  const [customerMessage, setCustomerMessage] = useState('');
  const [uploadedImage, setUploadedImage] = useState<{ file: File, base64: string, mimeType: string } | null>(null);
  
  const [businessParams, setBusinessParams] = useState<BusinessParams>({
    empresa: '', setorExemplo: '', oferta: '', promessaChave: '',
    tomDeVoz: 'humano, direto, gentil, consultivo', ctasDisponiveis: '',
    regras: '', provas: '', idiomaPadrao: 'pt-BR',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const chatRef = useRef<Chat | null>(null);

  // Load agents from localStorage or set defaults
  useEffect(() => {
    try {
      const storedAgents = localStorage.getItem(AGENTS_STORAGE_KEY);
      const defaultAgents: Agent[] = [
        { id: 'default-universal-assistant', name: 'Assistente Universal de Vendas', prompt: UNIVERSAL_ASSISTANT_PROMPT + UNIVERSAL_ASSISTANT_PROMPT_ADDON, isDefault: true },
        { id: 'default-hot-seduce-assistant', name: 'HOT Seduce Assistant', prompt: HOT_SEDUCE_ASSISTANT_PROMPT, isDefault: true },
      ];

      if (storedAgents) {
        const parsedAgents: Agent[] = JSON.parse(storedAgents);
        // Ensure default agents are up-to-date
        const updatedAgents = defaultAgents.map(defaultAgent => {
            const storedDefault = parsedAgents.find(p => p.id === defaultAgent.id);
            return storedDefault ? { ...storedDefault, prompt: defaultAgent.prompt, name: defaultAgent.name } : defaultAgent;
        });
        const customAgents = parsedAgents.filter(p => !p.isDefault);
        
        const finalAgents = [...updatedAgents, ...customAgents];
        setAgents(finalAgents);

        if (finalAgents.length > 0) {
          const defaultSelection = finalAgents.find(a => a.isDefault);
          setSelectedAgentId(defaultSelection ? defaultSelection.id : finalAgents[0].id);
        }
      } else {
        setAgents(defaultAgents);
        setSelectedAgentId(defaultAgents[0].id);
      }
    } catch (e) {
      console.error("Failed to load agents from storage", e);
    }
  }, []);

  // Save agents to localStorage whenever they change
  useEffect(() => {
    if (agents.length > 0) {
      try {
        localStorage.setItem(AGENTS_STORAGE_KEY, JSON.stringify(agents));
      } catch (e) {
        console.error("Failed to save agents to storage", e);
      }
    }
  }, [agents]);

  // Initialize or re-initialize chat when context changes
  useEffect(() => {
    const selectedAgent = agents.find(a => a.id === selectedAgentId);
    if (selectedAgent) {
        try {
            chatRef.current = startChat(selectedAgent.prompt, businessParams);
            setMessages([]);
            setError(null);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Falha ao iniciar o chat.");
            console.error(e);
        }
    }
  }, [selectedAgentId, businessParams, agents]);

  const handleSaveAgent = (agentToSave: Omit<Agent, 'id'> & { id?: string }) => {
    setAgents(prevAgents => {
      if (agentToSave.id) { // Update existing
        return prevAgents.map(a => a.id === agentToSave.id ? { ...a, ...agentToSave } : a);
      } else { // Add new
        const newAgent: Agent = { ...agentToSave, id: `custom-${Date.now()}` };
        return [...prevAgents, newAgent];
      }
    });
  };

  const handleDeleteAgent = (agentId: string) => {
    setAgents(prevAgents => {
        const newAgents = prevAgents.filter(a => a.id !== agentId);
        if (selectedAgentId === agentId && newAgents.length > 0) {
            setSelectedAgentId(newAgents[0].id);
        } else if (newAgents.length === 0) {
            setSelectedAgentId('');
        }
        return newAgents;
    });
  };

  const startRecording = useCallback(async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: { sampleRate: 16000, channelCount: 1 }
        });
        mediaRecorderRef.current = new MediaRecorder(stream);
        mediaRecorderRef.current.ondataavailable = (event) => {
            audioChunksRef.current.push(event.data);
        };
        mediaRecorderRef.current.onstop = () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            handleTranscription(audioBlob);
            audioChunksRef.current = [];
            stream.getTracks().forEach(track => track.stop());
        };
        audioChunksRef.current = [];
        mediaRecorderRef.current.start();
        setIsRecording(true);
    } catch (err) {
        console.error("Error starting recording:", err);
        setError("Não foi possível acessar o microfone. Verifique as permissões.");
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
    }
  }, []);

  const handleSendMessage = async (messageText: string, image: { file: File, base64: string, mimeType: string } | null) => {
      if (!chatRef.current) {
          setError("Sessão de chat não iniciada. Selecione um agente.");
          return;
      }

      setIsLoading(true);
      setError(null);

      try {
          const responseText = await sendMessage(chatRef.current, messageText, image);
          const modelMessage: ChatMessage = {
              id: `model-${Date.now()}`,
              role: 'model',
              text: responseText,
          };
          setMessages(prev => [...prev, modelMessage]);
      } catch (err) {
          console.error(err);
          const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.';
          setError(errorMessage);
          setMessages(prev => prev.slice(0, -1)); // Remove the user message if sending failed
      } finally {
          setIsLoading(false);
      }
  };

  const handleTranscription = async (blob: Blob) => {
    setIsTranscribing(true);
    setError(null);
    try {
        const text = await transcribeAudio(blob);
        
        const transcriptionMessage: ChatMessage = {
            id: `user-transcription-${Date.now()}`,
            role: 'user',
            text: `🗣️ Transcrição: ${text}`,
            isTranscription: true,
        };
        setMessages(prev => [...prev, transcriptionMessage]);
        
        await handleSendMessage(text, null);

    } catch (err) {
        console.error(err);
        setError("Falha ao transcrever o áudio.");
    } finally {
        setIsTranscribing(false);
    }
  };

  const handleGenerate = async () => {
    if (!customerMessage.trim() && !uploadedImage) {
        setError("Por favor, insira uma mensagem ou imagem.");
        return;
    }
    
    const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        text: customerMessage,
        ...(uploadedImage && { imagePreview: URL.createObjectURL(uploadedImage.file) })
    };
    setMessages(prev => [...prev, userMessage]);
    
    await handleSendMessage(customerMessage, uploadedImage);

    setCustomerMessage('');
    setUploadedImage(null);
  };

  return (
    <>
    <div className="min-h-screen text-hot-white flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <header className="w-full max-w-7xl mb-8 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-hot-white tracking-wider" style={{ textShadow: '0 0 10px rgba(209,0,0,0.7)' }}>Assistente de Vendas IA</h1>
        <p className="mt-2 text-lg text-hot-white/80">Converse com seu assistente para criar respostas e fechar negócios.</p>
      </header>
      <main className="w-full max-w-7xl flex flex-col lg:flex-row gap-8 flex-grow">
        <InputPanel 
          customerMessage={customerMessage}
          setCustomerMessage={setCustomerMessage}
          setUploadedImage={setUploadedImage}
          isRecording={isRecording}
          isTranscribing={isTranscribing}
          startRecording={startRecording}
          stopRecording={stopRecording}
          businessParams={businessParams}
          setBusinessParams={setBusinessParams}
          onGenerate={handleGenerate}
          isLoading={isLoading}
          agents={agents}
          selectedAgentId={selectedAgentId}
          onAgentChange={setSelectedAgentId}
          onManageAgents={() => setIsAgentModalOpen(true)}
        />
        <OutputPanel 
          messages={messages}
          isLoading={isLoading}
          error={error}
        />
      </main>
    </div>
    <AgentManagerModal
        isOpen={isAgentModalOpen}
        onClose={() => setIsAgentModalOpen(false)}
        agents={agents}
        onSaveAgent={handleSaveAgent}
        onDeleteAgent={handleDeleteAgent}
    />
    </>
  );
};

export default App;
