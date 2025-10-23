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

export interface GeminiOutput {
  mensagemPrincipal: string;
  alternativaCurta: string;
  alternativaDetalhada: string;
  scriptAudio: string;
  proximoPasso: string;
  checklistIntencao: string;
  checklistObstaculo: string;
  checklistProntidao: string;
  checklistFollowUp: string;
  crmNome: string;
  crmInteresse: string;
  crmTicket: string;
  crmEtapa: string;
  crmProximaAcao: string;
  crmDeadline: string;
  crmObservacoes: string;
}
