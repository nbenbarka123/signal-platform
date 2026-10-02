export type UserRole = 'admin' | 'consultant'

export interface Profile {
  id: string
  email: string
  nom: string | null
  prenom: string | null
  role: UserRole
  google_refresh_token: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Company {
  id: string
  nom: string
  secteur: string | null
  taille: 'PME' | 'ETI' | 'Grande entreprise' | null
  ville: string | null
  pays: string
  contact_nom: string | null
  contact_email: string | null
  contact_poste: string | null
  notes: string | null
  consultant_id: string | null
  effectif: number | null
  ca_estime: string | null
  nom_dirigeant: string | null
  prenom_dirigeant: string | null
  poste_dirigeant: string | null
  email_dirigeant: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export type SessionStatus = 'planifiee' | 'en_cours' | 'traitee' | 'table_ronde' | 'archivee'

export interface Session {
  id: string
  company_id: string
  consultant_id: string
  date_session: string | null
  duree_minutes: number
  statut: SessionStatus
  google_event_id: string | null
  notes_generales: string | null
  created_at: string
  updated_at: string
  // Joins
  company?: Company
  consultant?: Profile
  responses?: SessionResponse[]
  outputs?: Output[]
}

export interface GuideQuestion {
  id: string // ex: 'B1-Q1'
  bloc: 'B1' | 'B2' | 'B3' | 'B4'
  ordre: number
  question: string
  description: string | null
  signal_attendu: string | null
  agent_type_sugere: string | null
}

export interface SessionResponse {
  id: string
  session_id: string
  question_id: string
  reponse_verbatim: string | null
  notes_consultant: string | null
  enregistrement_url: string | null
  updated_at: string
  // Join
  question?: GuideQuestion
}

export type AgentType =
  | 'agent_synthese'
  | 'agent_decision'
  | 'agent_veille'
  | 'agent_communication'
  | 'agent_suivi_projet'
  | 'agent_analyse'
  | 'agent_connaissance'
  | 'garde_fou'
  | 'autre'

export interface Signal {
  id: string
  response_id: string
  session_id: string
  signal_deduit: string
  agent_propose: string
  agent_type: AgentType
  directeur_cible: string | null
  priorite: 'haute' | 'moyenne' | 'faible'
  justification: string | null
  created_at: string
}

export type OutputType = 'compte_rendu' | 'recommandations' | 'brief_table_ronde'

export interface Output {
  id: string
  session_id: string
  type: OutputType
  contenu_json: Record<string, unknown> | null
  contenu_texte: string | null
  pdf_url: string | null
  generated_at: string
  generated_by: string | null
}

export interface AgendaEvent {
  id: string
  session_id: string | null
  company_id: string | null
  consultant_id: string
  google_event_id: string | null
  titre: string
  description: string | null
  date_debut: string
  date_fin: string
  lieu: string | null
  participants: { email: string; nom: string }[]
  statut_sync: 'local' | 'synced' | 'error'
  created_at: string
  updated_at: string
}

// Labels affichage
export const SESSION_STATUS_LABELS: Record<SessionStatus, string> = {
  planifiee: 'Planifiée',
  en_cours: 'En cours',
  traitee: 'Traitée',
  table_ronde: 'Table ronde',
  archivee: 'Archivée',
}

export const AGENT_TYPE_LABELS: Record<AgentType, string> = {
  agent_synthese: 'Synthèse & reporting',
  agent_decision: 'Aide à la décision',
  agent_veille: 'Veille & intelligence',
  agent_communication: 'Communication interne',
  agent_suivi_projet: 'Suivi de projet',
  agent_analyse: 'Analyse de données',
  agent_connaissance: 'Base de connaissance',
  garde_fou: 'Zone protégée',
  autre: 'Autre',
}

export const BLOC_LABELS: Record<string, string> = {
  B1: 'Le dirigeant et son travail réel',
  B2: "L'organisation vue d'en haut",
  B3: 'Zones interdites',
  B4: 'Données et sensibilité',
}
