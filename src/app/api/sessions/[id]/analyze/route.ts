export const maxDuration = 60

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { analyzeSession } from '@/lib/claude/analyze'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params
  const supabase = await createClient()

  // Vérifier auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Charger la session + réponses + questions
  const { data: session } = await supabase
    .from('sessions')
    .select('*, company:companies(nom)')
    .eq('id', sessionId)
    .eq('consultant_id', user.id)
    .single()

  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

  const { data: responses } = await supabase
    .from('session_responses')
    .select('*, question:guide_questions(*)')
    .eq('session_id', sessionId)

  if (!responses?.length) {
    return NextResponse.json({ error: 'No responses to analyze' }, { status: 400 })
  }

  const filledResponses = responses.filter(r => r.reponse_verbatim?.trim())

  if (filledResponses.length < 3) {
    return NextResponse.json(
      { error: 'Minimum 3 réponses requises pour l\'analyse' },
      { status: 400 }
    )
  }

  try {
    const sessionDate = session.date_session
      ? format(new Date(session.date_session), 'd MMMM yyyy', { locale: fr })
      : format(new Date(), 'd MMMM yyyy', { locale: fr })

    // Analyse LLM
    const analysis = await analyzeSession(
      filledResponses,
      session.company.nom,
      sessionDate
    )

    // Sauvegarder les signaux
    const signalsToInsert = analysis.signals.map(s => ({
      ...s,
      session_id: sessionId,
      // Mapper response_id du placeholder vers l'ID réel
      response_id: responses.find(r => r.question_id === s.response_id.split('_')[0])?.id
        ?? responses[0].id,
    }))

    await supabase.from('signals').insert(signalsToInsert)

    // Sauvegarder les outputs
    await supabase.from('outputs').upsert([
      {
        session_id: sessionId,
        type: 'compte_rendu',
        contenu_json: analysis.compte_rendu,
        contenu_texte: formatCompteRendu(analysis),
        generated_by: user.id,
      },
      {
        session_id: sessionId,
        type: 'recommandations',
        contenu_json: analysis.recommandations,
        contenu_texte: formatRecommandations(analysis),
        generated_by: user.id,
      },
      {
        session_id: sessionId,
        type: 'brief_table_ronde',
        contenu_json: analysis.brief_table_ronde,
        contenu_texte: formatBriefTableRonde(analysis),
        generated_by: user.id,
      },
    ], { onConflict: 'session_id,type' })

    // Mettre à jour le statut de la session
    await supabase
      .from('sessions')
      .update({ statut: 'traitee' })
      .eq('id', sessionId)

    return NextResponse.json({ success: true, analysis })
  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}

function formatCompteRendu(analysis: Awaited<ReturnType<typeof analyzeSession>>) {
  const cr = analysis.compte_rendu
  return `# ${cr.titre}

**Date :** ${cr.date}
**Entreprise :** ${cr.entreprise}

## Portrait du dirigeant
${cr.synthese_dirigeant}

## Points clés
${cr.points_cles.map(p => `- ${p}`).join('\n')}

## Zones protégées
${cr.zones_protegees.map(z => `- ${z}`).join('\n')}

## Politique données
${cr.contrainte_donnees}

## Prochaines étapes
${cr.prochaines_etapes.map((e, i) => `${i + 1}. ${e}`).join('\n')}
`
}

function formatRecommandations(analysis: Awaited<ReturnType<typeof analyzeSession>>) {
  const reco = analysis.recommandations
  return `# Recommandations agents IA

${reco.synthese}

## Agents proposés

${reco.agents.map(a => `### ${a.nom} (priorité ${a.priorite})
**Type :** ${a.type}
**Direction cible :** ${a.directeur_cible}
**Problème résolu :** ${a.probleme_resolu}
**Justification :** ${a.justification}
`).join('\n')}
`
}

function formatBriefTableRonde(analysis: Awaited<ReturnType<typeof analyzeSession>>) {
  const brief = analysis.brief_table_ronde
  return `# Brief table ronde directeurs

**Objectif :** ${brief.objectif}

## Participants recommandés
${brief.participants_recommandes.map(p => `- **${p.direction}** : ${p.pourquoi}`).join('\n')}

## Questions à poser par direction
${brief.questions_a_poser.map(q => `- **${q.direction}** : ${q.question}`).join('\n')}

## Agents à présenter
${brief.agents_a_presenter.map(a => `- ${a}`).join('\n')}

## Points d'attention
${brief.points_attention.map(p => `- ${p}`).join('\n')}
`
}
