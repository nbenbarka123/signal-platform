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

  const prompt = `Tu es expert en déploiement d'agents IA en entreprise, associé chez SIGNAL by Djin.
Session CEO de ${companyName} (${sessionDate}).

Réponses recueillies :
${context}

Réponds UNIQUEMENT avec un JSON valide, sans markdown, sans explication. Sois concis dans chaque champ (1-2 phrases max par champ texte).

{"signals":[{"response_id":"ID","session_id":"SESSION_ID_PLACEHOLDER","signal_deduit":"problème/opportunité identifié","agent_propose":"nom agent","agent_type":"agent_synthese|agent_decision|agent_veille|agent_communication|agent_suivi_projet|agent_analyse|agent_connaissance|garde_fou|autre","directeur_cible":"direction","priorite":"haute|moyenne|faible","justification":"lien réponse CEO → agent"}],"compte_rendu":{"titre":"Session CEO — ${companyName}","date":"${sessionDate}","entreprise":"${companyName}","synthese_dirigeant":"Portrait CEO en 2 phrases","points_cles":["clé 1","clé 2","clé 3"],"zones_protegees":["zone 1"],"contrainte_donnees":"politique données résumée","prochaines_etapes":["étape 1","étape 2"]},"recommandations":{"agents":[{"nom":"nom agent","type":"type","priorite":"haute|moyenne|faible","probleme_resolu":"problème résolu","directeur_cible":"direction","justification":"basé sur [question_id]"}],"synthese":"synthèse en 1-2 phrases"},"brief_table_ronde":{"objectif":"objectif table ronde","participants_recommandes":[{"direction":"DRH","pourquoi":"raison"}],"questions_a_poser":[{"direction":"DAF","question":"question"}],"agents_a_presenter":["agent 1"],"points_attention":["résistance potentielle"]}}`

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
