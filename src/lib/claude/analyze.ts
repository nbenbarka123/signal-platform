import Anthropic from '@anthropic-ai/sdk'
import type { SessionResponse, GuideQuestion, Signal } from '@/types'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

interface ResponseWithQuestion extends SessionResponse {
  question: GuideQuestion
}

interface AnalysisResult {
  signals: Omit<Signal, 'id' | 'created_at'>[]
  compte_rendu: {
    titre: string
    date: string
    entreprise: string
    synthese_dirigeant: string
    points_cles: string[]
    zones_protegees: string[]
    contrainte_donnees: string
    prochaines_etapes: string[]
  }
  recommandations: {
    agents: {
      nom: string
      type: string
      priorite: 'haute' | 'moyenne' | 'faible'
      probleme_resolu: string
      directeur_cible: string
      justification: string
    }[]
    synthese: string
  }
  brief_table_ronde: {
    objectif: string
    participants_recommandes: { direction: string; pourquoi: string }[]
    questions_a_poser: { direction: string; question: string }[]
    agents_a_presenter: string[]
    points_attention: string[]
  }
}

export async function analyzeSession(
  responses: ResponseWithQuestion[],
  companyName: string,
  sessionDate: string
): Promise<AnalysisResult> {

  const context = responses
    .filter(r => r.reponse_verbatim?.trim())
    .map(r => `
[${r.question.id} — ${r.question.question}]
Réponse CEO : ${r.reponse_verbatim}
${r.notes_consultant ? `Notes consultant : ${r.notes_consultant}` : ''}
Signal attendu : ${r.question.signal_attendu ?? 'Non défini'}
    `).join('\n---\n')

  const prompt = `Tu es un expert en transformation digitale et déploiement d'agents IA en entreprise, associé chez SIGNAL by Djin.

Tu viens de conduire une session de shadowing de 2-3 heures avec le CEO de ${companyName} (${sessionDate}).

Voici les réponses recueillies au cours de l'entretien :

${context}

Produis une analyse complète en JSON avec la structure exacte suivante. Chaque agent proposé DOIT être tracé jusqu'à la réponse CEO qui l'a générée.

Réponds UNIQUEMENT avec un JSON valide, sans markdown, sans explication.

{
  "signals": [
    {
      "response_id": "ID_DE_LA_REPONSE",
      "session_id": "SESSION_ID_PLACEHOLDER",
      "signal_deduit": "Ce que la réponse révèle comme problème ou opportunité",
      "agent_propose": "Nom de l'agent IA proposé",
      "agent_type": "agent_synthese|agent_decision|agent_veille|agent_communication|agent_suivi_projet|agent_analyse|agent_connaissance|garde_fou|autre",
      "directeur_cible": "Direction concernée",
      "priorite": "haute|moyenne|faible",
      "justification": "Lien explicite entre la réponse CEO et cet agent"
    }
  ],
  "compte_rendu": {
    "titre": "Compte rendu session CEO — ${companyName}",
    "date": "${sessionDate}",
    "entreprise": "${companyName}",
    "synthese_dirigeant": "Portrait du CEO en 3-4 phrases : son style, ses priorités, son rapport à l'IA",
    "points_cles": ["Point clé 1", "Point clé 2", "Point clé 3"],
    "zones_protegees": ["Zone que l'IA ne doit pas toucher 1"],
    "contrainte_donnees": "Résumé de la politique données de l'entreprise",
    "prochaines_etapes": ["Étape 1", "Étape 2"]
  },
  "recommandations": {
    "agents": [
      {
        "nom": "Nom de l'agent",
        "type": "Type d'agent",
        "priorite": "haute|moyenne|faible",
        "probleme_resolu": "Le problème concret que cet agent résout",
        "directeur_cible": "Direction à impliquer",
        "justification": "Basé sur la réponse du CEO à [question_id] : ..."
      }
    ],
    "synthese": "Synthèse des recommandations en 2-3 phrases"
  },
  "brief_table_ronde": {
    "objectif": "Ce que la table ronde doit accomplir",
    "participants_recommandes": [
      {"direction": "DRH", "pourquoi": "Raison basée sur les réponses CEO"}
    ],
    "questions_a_poser": [
      {"direction": "DAF", "question": "Question à poser au DAF lors de la table ronde"}
    ],
    "agents_a_presenter": ["Agent 1 à présenter"],
    "points_attention": ["Résistance potentielle identifiée"]
  }
}`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8000,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  // Strip markdown code blocks if present (```json ... ```)
  const clean = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()
  return JSON.parse(clean) as AnalysisResult
}
