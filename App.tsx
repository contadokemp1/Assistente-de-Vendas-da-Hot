
import React, { useState, useRef, useCallback, useEffect } from 'react';
import InputPanel from './components/InputPanel';
import OutputPanel from './components/OutputPanel';
import AgentManagerModal from './components/AgentManagerModal';
import { generateSalesResponse, transcribeAudio } from './services/geminiService';
import type { BusinessParams, GeminiOutput, Agent } from './types';

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

const HOT_SEDUCE_ASSISTANT_PROMPT = `
🧠 SYSTEM INSTRUCTION — “HOT SEDUCE ASSISTANT”
🔹 PAPEL E PROPÓSITO

Você é uma inteligência especialista em conversas de direct (DM) com foco em atração, condução e conversão de leads usando o Método SEDUCE da HOT.
Seu papel é ajudar mentoras, infoprodutoras e equipes de vendas a transformar interações no direct em relacionamentos que viram PIX, guiando na criação e execução de mensagens personalizadas dentro dos fluxos:

Tô Afim (ativação inicial),

Oi Sumida (reconexão),

CDP – Cliente Cara de Pix (fechamento).

🔹 TOM DE VOZ E ESTILO DE COMUNicação

Tom: leve, empático, permissivo, humano e estrategicamente envolvente.

Linguagem natural, ritmo de chat (Instagram / WhatsApp).

Usa nome próprio e conexão sincera (“Amei ver você por aqui, Lu!”).

Evita formalidade e jargões corporativos.

Emojis pontuais (🔥😉✨) apenas para humanizar.

Conduz com curiosidade e acolhimento, nunca com pressão.

Costuma devolver uma pergunta aberta para manter o diálogo fluido.

🔹 ESTRUTURA DE RESPOSTA (MÉTODO SEDUCE)

1. Ativação → Detectar se há sinal verde (RSV) e responder com energia + conexão emocional.
2. Condução → Nome + motivo do contato + conexão sincera + pergunta que levanta a bola.
3. Conversão → Acolhimento + oferta de ajuda (com permissão).

📋 Formatação visual:

Parágrafos curtos e bullets.

CTA humanizado no final (“Quer que eu te mostre como faria no teu caso?”).

🔹 REGRAS DE COMPORTAMENTO

Sempre seguir a estrutura SEDUCE.

Jamais responder se não houver sinal verde.

Aplicar a Regra do Esquenta: responder sempre um pouco mais do que a lead trouxe.

Evitar tom robótico, frio ou de venda forçada.

Manter confidencialidade total do Método HOT.

Nunca inventar fatos, criar dados sensíveis ou prometer resultados irreais.

Bloqueio automático pós-26/12/2025 (mensagem de expiração).

🔹 SAÍDA PADRÃO (sempre nesse formato)

1️⃣ Mensagem principal:
Texto pronto para envio no direct (humano, empático, estratégico).

2️⃣ Alternativas:

Versão curta (1–2 linhas).

Versão detalhada (explicativa ou técnica).

3️⃣ Roteiro de áudio (20–40s):
Transcrição falada natural, com pausas suaves, sem jargões.

4️⃣ Próximo passo / CTA:
Pergunta ou convite leve para avançar (ex: “Quer que eu te mostre como seria na prática?”).

5️⃣ Checklist interno (não enviar):

Intenção da lead

Emoção dominante

Temperatura (fria, morna, quente)

Etapa (Ativação / Condução / Conversão)

Sugestão de follow-up 24–48h

6️⃣ Campos para CRM (não enviar):
Nome | Interesse | Ticket | Etapa | Próx. Ação | Deadline | Observações
`;

const AGENTS_STORAGE_KEY = 'ai-sales-assistant-agents';

const App: React.FC = () => {
  const [customerMessage, setCustomerMessage] = useState('');
  const [uploadedImage, setUploadedImage] = useState<{ file: File, base64: string, mimeType: string } | null>(null);
  const [audioForTranscription, setAudioForTranscription] = useState<Blob | null>(null);
  const [transcribedText, setTranscribedText] = useState('');
  
  const [businessParams, setBusinessParams] = useState<BusinessParams>({
    empresa: '', setorExemplo: '', oferta: '', promessaChave: '',
    tomDeVoz: 'humano, direto, gentil, consultivo', ctasDisponiveis: '',
    regras: '', provas: '', idiomaPadrao: 'pt-BR',
  });
  
  const [useThinkingMode, setUseThinkingMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [output, setOutput] = useState<GeminiOutput | null>(null);

  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Load agents from localStorage or set defaults
  useEffect(() => {
    try {
      const storedAgents = localStorage.getItem(AGENTS_STORAGE_KEY);
      if (storedAgents) {
        const parsedAgents = JSON.parse(storedAgents);
        setAgents(parsedAgents);
        if (parsedAgents.length > 0) {
          setSelectedAgentId(parsedAgents[0].id);
        }
      } else {
        const defaultAgents: Agent[] = [
          { id: 'default-universal-assistant', name: 'Assistente Universal de Vendas', prompt: UNIVERSAL_ASSISTANT_PROMPT, isDefault: true },
          { id: 'default-hot-seduce-assistant', name: 'HOT Seduce Assistant', prompt: HOT_SEDUCE_ASSISTANT_PROMPT, isDefault: true },
        ];
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
            // Handle case where all agents are deleted
            setSelectedAgentId('');
        }
        return newAgents;
    });
  };


  const startRecording = useCallback(async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                sampleRate: 16000,
                channelCount: 1,
            }
        });
        mediaRecorderRef.current = new MediaRecorder(stream);
        mediaRecorderRef.current.ondataavailable = (event) => {
            audioChunksRef.current.push(event.data);
        };
        mediaRecorderRef.current.onstop = () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            setAudioForTranscription(audioBlob);
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

  const handleTranscription = async (blob: Blob) => {
    setIsTranscribing(true);
    setError(null);
    try {
        const text = await transcribeAudio(blob);
        setTranscribedText(text);
    } catch (err) {
        console.error(err);
        setError("Falha ao transcrever o áudio.");
    } finally {
        setIsTranscribing(false);
    }
  };

  const handleGenerate = async () => {
    if (!customerMessage.trim()) {
        setError("Por favor, insira a mensagem do cliente.");
        return;
    }
    const selectedAgent = agents.find(a => a.id === selectedAgentId);
    if (!selectedAgent) {
        setError("Nenhum agente de IA selecionado.");
        return;
    }

    setIsLoading(true);
    setError(null);
    setOutput(null);

    try {
      const result = await generateSalesResponse(
        customerMessage,
        uploadedImage,
        businessParams,
        useThinkingMode,
        selectedAgent.prompt
      );
      setOutput(result);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
    <div className="min-h-screen text-hot-white flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <header className="w-full max-w-7xl mb-8 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-hot-white tracking-wider" style={{ textShadow: '0 0 10px rgba(209,0,0,0.7)' }}>Assistente de Vendas IA</h1>
        <p className="mt-2 text-lg text-hot-white/80">Transforme mensagens de clientes em respostas prontas para fechar negócios.</p>
      </header>
      <main className="w-full max-w-7xl flex flex-col lg:flex-row gap-8 flex-grow">
        <InputPanel 
          customerMessage={customerMessage}
          setCustomerMessage={setCustomerMessage}
          setUploadedImage={setUploadedImage}
          setAudioForTranscription={setAudioForTranscription}
          isRecording={isRecording}
          isTranscribing={isTranscribing}
          startRecording={startRecording}
          stopRecording={stopRecording}
          transcribedText={transcribedText}
          businessParams={businessParams}
          setBusinessParams={setBusinessParams}
          useThinkingMode={useThinkingMode}
          setUseThinkingMode={setUseThinkingMode}
          onGenerate={handleGenerate}
          isLoading={isLoading}
          agents={agents}
          selectedAgentId={selectedAgentId}
          onAgentChange={setSelectedAgentId}
          onManageAgents={() => setIsAgentModalOpen(true)}
        />
        <OutputPanel 
          output={output}
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