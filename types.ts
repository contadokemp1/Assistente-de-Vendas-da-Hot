export interface Agent {
  id: string;
  name: string;
  prompt: string;
  isDefault?: boolean;
}

export interface BusinessParams {
  empresa: string;
  setorExemplo: string;
  oferta: string;
  promessaChave: string;
  tomDeVoz: string;
  ctasDisponiveis: string;
  regras: string;
  provas: string;
  idiomaPadrao: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  imagePreview?: string;
  isTranscription?: boolean;
}
