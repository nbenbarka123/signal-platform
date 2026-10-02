-- SIGNAL Platform — Schéma BDD complet
-- À exécuter dans Supabase SQL Editor

-- Extension UUID
create extension if not exists "uuid-ossp";

-- =====================
-- USERS (via Supabase Auth)
-- Table profil étendu
-- =====================
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  nom text,
  prenom text,
  role text not null default 'consultant' check (role in ('admin', 'consultant')),
  google_refresh_token text, -- pour Google Calendar
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =====================
-- COMPANIES
-- =====================
create table public.companies (
  id uuid default uuid_generate_v4() primary key,
  nom text not null,
  secteur text,
  taille text check (taille in ('PME', 'ETI', 'Grande entreprise')),
  ville text,
  pays text default 'Maroc',
  contact_nom text,
  contact_email text,
  contact_poste text,
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =====================
-- SESSIONS
-- =====================
create table public.sessions (
  id uuid default uuid_generate_v4() primary key,
  company_id uuid references public.companies(id) on delete cascade not null,
  consultant_id uuid references public.profiles(id) not null,
  date_session timestamptz,
  duree_minutes integer default 120,
  statut text not null default 'planifiee'
    check (statut in ('planifiee', 'en_cours', 'traitee', 'table_ronde', 'archivee')),
  google_event_id text, -- ID de l'event Google Calendar
  notes_generales text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =====================
-- QUESTIONS DU GUIDE (référentiel statique)
-- =====================
create table public.guide_questions (
  id text primary key, -- ex: 'B1-Q1'
  bloc text not null check (bloc in ('B1', 'B2', 'B3', 'B4')),
  ordre integer not null,
  question text not null,
  description text, -- contexte pour le consultant
  signal_attendu text, -- ce qu'on cherche à extraire
  agent_type_sugere text
);

-- Insertion du guide SIGNAL
insert into public.guide_questions values
  ('B1-Q1', 'B1', 1, 'Sur quoi passez-vous le plus de temps cette semaine ?',
   'Comprendre la répartition réelle du temps du CEO',
   'Type de tâche chronophage (reporting, validation, réunions, relances)',
   'agent_synthese'),
  ('B1-Q2', 'B1', 2, 'Quelles décisions vous remontent alors qu''elles ne devraient pas ?',
   'Identifier les goulets d''étranglement hiérarchiques',
   'Déficit d''autonomie des équipes',
   'agent_decision'),
  ('B1-Q3', 'B1', 3, 'Quelle information vous manque régulièrement quand vous devez trancher ?',
   'Détecter les angles morts informationnels',
   'Besoin de données en temps réel',
   'agent_veille'),
  ('B1-Q4', 'B1', 4, 'Qu''est-ce que vous faites encore vous-même et que vous aimeriez déléguer ?',
   'Premier candidat à un pilote agent concret',
   'Tâches à fort potentiel d''automatisation',
   'agent_delegation'),
  ('B2-Q1', 'B2', 1, 'Quels projets stratégiques avancent moins vite que prévu, et pourquoi selon vous ?',
   'Cartographier les blocages opérationnels',
   'Silos, manque de visibilité sur l''avancement',
   'agent_suivi_projet'),
  ('B2-Q2', 'B2', 2, 'Où est-ce que l''information se perd ou arrive trop tard dans votre organisation ?',
   'Identifier les ruptures de communication',
   'Circuits d''escalade défaillants',
   'agent_communication'),
  ('B2-Q3', 'B2', 3, 'Si vous aviez une visibilité totale sur une seule fonction demain matin, ce serait laquelle ?',
   'Angle mort prioritaire du CEO',
   'Zone où l''opacité = risque',
   'agent_analyse'),
  ('B2-Q4', 'B2', 4, 'Quels comportements de vos équipes vous coûtent le plus d''énergie ?',
   'Culture et résistances au changement',
   'Profils à accompagner en priorité',
   'structurant_table_ronde'),
  ('B3-Q1', 'B3', 1, 'Y a-t-il des décisions que vous ne voudriez jamais voir prises ou influencées par une machine ?',
   'Périmètre de l''inacceptable',
   'Niveau de confiance accordé à l''IA',
   'garde_fou'),
  ('B3-Q2', 'B3', 2, 'Est-ce qu''il y a des équipes ou des métiers où vous sentez que l''IA serait mal reçue ?',
   'Zones de résistance prévisible',
   'Profils à ne pas mettre en première ligne',
   'garde_fou'),
  ('B3-Q3', 'B3', 3, 'Qu''est-ce qui vous rendrait vous-même méfiant vis-à-vis d''un agent IA dans votre organisation ?',
   'Critères de confiance du CEO',
   'Seuils de supervision à calibrer',
   'garde_fou'),
  ('B4-Q1', 'B4', 1, 'Quelles données sont trop sensibles pour sortir de l''entreprise, quels que soient les engagements de confidentialité ?',
   'Politique de souveraineté des données',
   'Contraintes réglementaires ou concurrentielles',
   'architecture_donnees');

-- =====================
-- RÉPONSES DE SESSION
-- =====================
create table public.session_responses (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid references public.sessions(id) on delete cascade not null,
  question_id text references public.guide_questions(id) not null,
  reponse_verbatim text,
  notes_consultant text, -- observations du consultant pendant l'entretien
  enregistrement_url text, -- lien audio si capté
  updated_at timestamptz default now(),
  unique(session_id, question_id)
);

-- =====================
-- SIGNAUX EXTRAITS (par LLM)
-- =====================
create table public.signals (
  id uuid default uuid_generate_v4() primary key,
  response_id uuid references public.session_responses(id) on delete cascade not null,
  session_id uuid references public.sessions(id) on delete cascade not null,
  signal_deduit text not null,
  agent_propose text not null,
  agent_type text not null check (agent_type in (
    'agent_synthese', 'agent_decision', 'agent_veille', 'agent_communication',
    'agent_suivi_projet', 'agent_analyse', 'agent_connaissance', 'garde_fou', 'autre'
  )),
  directeur_cible text, -- direction concernée
  priorite text default 'moyenne' check (priorite in ('haute', 'moyenne', 'faible')),
  justification text, -- pourquoi cet agent pour cette réponse
  created_at timestamptz default now()
);

-- =====================
-- OUTPUTS GÉNÉRÉS
-- =====================
create table public.outputs (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid references public.sessions(id) on delete cascade not null,
  type text not null check (type in ('compte_rendu', 'recommandations', 'brief_table_ronde')),
  contenu_json jsonb, -- structure complète
  contenu_texte text, -- version markdown
  pdf_url text, -- lien Supabase Storage
  generated_at timestamptz default now(),
  generated_by uuid references public.profiles(id)
);

-- =====================
-- ÉVÉNEMENTS AGENDA
-- =====================
create table public.agenda_events (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid references public.sessions(id) on delete cascade,
  company_id uuid references public.companies(id),
  consultant_id uuid references public.profiles(id) not null,
  google_event_id text unique,
  titre text not null,
  description text,
  date_debut timestamptz not null,
  date_fin timestamptz not null,
  lieu text,
  participants jsonb default '[]', -- [{email, nom}]
  statut_sync text default 'local' check (statut_sync in ('local', 'synced', 'error')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =====================
-- RLS (Row Level Security)
-- =====================
alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.sessions enable row level security;
alter table public.session_responses enable row level security;
alter table public.signals enable row level security;
alter table public.outputs enable row level security;
alter table public.agenda_events enable row level security;

-- Profiles : chacun voit son profil, admins voient tout
create policy "profiles_self" on public.profiles
  for all using (auth.uid() = id);

-- Companies : tous les consultants voient tout
create policy "companies_authenticated" on public.companies
  for all using (auth.role() = 'authenticated');

-- Sessions : consultant voit ses sessions
create policy "sessions_own" on public.sessions
  for all using (
    consultant_id = auth.uid() or
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Responses : lié à ses sessions
create policy "responses_own_sessions" on public.session_responses
  for all using (
    exists (
      select 1 from public.sessions s
      where s.id = session_id and (
        s.consultant_id = auth.uid() or
        exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
      )
    )
  );

-- Signals, outputs, agenda : même logique
create policy "signals_own" on public.signals
  for all using (
    exists (
      select 1 from public.sessions s
      where s.id = session_id and s.consultant_id = auth.uid()
    )
  );

create policy "outputs_own" on public.outputs
  for all using (
    exists (
      select 1 from public.sessions s
      where s.id = session_id and s.consultant_id = auth.uid()
    )
  );

create policy "agenda_own" on public.agenda_events
  for all using (consultant_id = auth.uid());

-- guide_questions : public en lecture
create policy "guide_public_read" on public.guide_questions
  for select using (true);

-- =====================
-- TRIGGERS updated_at
-- =====================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_profiles_updated_at before update on public.profiles
  for each row execute function update_updated_at();
create trigger trg_companies_updated_at before update on public.companies
  for each row execute function update_updated_at();
create trigger trg_sessions_updated_at before update on public.sessions
  for each row execute function update_updated_at();
create trigger trg_agenda_updated_at before update on public.agenda_events
  for each row execute function update_updated_at();

-- =====================
-- Trigger : créer profil à l'inscription
-- =====================
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, nom)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- =====================
-- MIGRATION: Add extra fields to companies
-- =====================
alter table public.companies
  add column if not exists consultant_id uuid references public.profiles(id),
  add column if not exists effectif integer,
  add column if not exists ca_estime text,
  add column if not exists nom_dirigeant text,
  add column if not exists prenom_dirigeant text,
  add column if not exists poste_dirigeant text default 'CEO',
  add column if not exists email_dirigeant text;

-- Backfill consultant_id from created_by
update public.companies set consultant_id = created_by where consultant_id is null and created_by is not null;
