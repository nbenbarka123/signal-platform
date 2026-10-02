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

  const prompt = `Expert IA chez SIGNAL by Djin. Session CEO ${companyName} (${sessionDate}).

Réponses :
${context}

JSON valide uniquement, sans markdown. Maximum 3 signaux, 3 agents, phrases courtes.

{"signals":[{"response_id":"ID","session_id":"SESSION_ID_PLACEHOLDER","signal_deduit":"problème court","agent_propose":"nom","agent_type":"agent_synthese","directeur_cible":"DG","priorite":"haute","justification":"lien court"}],"compte_rendu":{"titre":"Session ${companyName}","date":"${sessionDate}","entreprise":"${companyName}","synthese_dirigeant":"1 phrase","points_cles":["clé 1","clé 2"],"zones_protegees":["zone 1"],"contrainte_donnees":"1 phrase","prochaines_etapes":["étape 1"]},"recommandations":{"agents":[{"nom":"nom","type":"type","priorite":"haute","probleme_resolu":"1 phrase","directeur_cible":"direction","justification":"1 phrase"}],"synthese":"1 phrase"},"brief_table_ronde":{"objectif":"1 phrase","participants_recommandes":[{"direction":"DRH","pourquoi":"1 phrase"}],"questions_a_poser":[{"direction":"DAF","question":"question"}],"agents_a_presenter":["agent 1"],"points_attention":["point 1"]}}`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  // Strip markdown code blocks if present (```json ... ```)
  const clean = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()
  return JSON.parse(clean) as AnalysisResult
}
