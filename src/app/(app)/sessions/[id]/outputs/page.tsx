import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { AGENT_TYPE_LABELS } from '@/types'

export default async function OutputsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: sessionId } = await params
  const supabase = await createClient()

  const [{ data: session }, { data: outputs }, { data: signals }] = await Promise.all([
    supabase.from('sessions').select('*, company:companies(nom)').eq('id', sessionId).single(),
    supabase.from('outputs').select('*').eq('session_id', sessionId),
    supabase.from('signals').select('*').eq('session_id', sessionId).order('priorite'),
  ])

  if (!session) notFound()

  const cr = outputs?.find(o => o.type === 'compte_rendu')
  const reco = outputs?.find(o => o.type === 'recommandations')
  const brief = outputs?.find(o => o.type === 'brief_table_ronde')

  if (!outputs?.length) {
    return (
      <div className="min-h-screen bg-[#f5f4f0] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#888884] mb-4">Cette session n'a pas encore été analysée.</p>
          <Link
            href={`/sessions/${sessionId}/process`}
            className="bg-[#c9a84c] text-[#111110] px-4 py-2 rounded-lg text-sm font-medium"
          >
            Lancer l'analyse →
          </Link>
        </div>
      </div>
    )
  }

  const crData = cr?.contenu_json as Record<string, unknown> | null
  const recoData = reco?.contenu_json as Record<string, unknown> | null
  const briefData = brief?.contenu_json as Record<string, unknown> | null

  return (
    <div className="min-h-screen bg-[#f5f4f0]">
      <div className="bg-white border-b border-[#e8e7e4] px-8 py-4">
        <div className="flex items-center justify-between max-w-5xl">
          <div className="flex items-center gap-3">
            <Link href={`/sessions/${sessionId}`} className="text-[#888884] hover:text-[#111110]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-base font-semibold text-[#111110]">
                Outputs — {session.company?.nom}
              </h1>
              <p className="text-xs text-[#888884]">Analyse complète de la session CEO</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl px-8 py-8 space-y-6">
        {/* Signaux */}
        {signals && signals.length > 0 && (
          <section className="bg-white rounded-xl border border-[#e8e7e4] p-6">
            <h2 className="font-semibold text-[#111110] mb-4 flex items-center gap-2">
              <div className="w-1 h-5 bg-[#c9a84c]" />
              Signaux extraits ({signals.length})
            </h2>
            <div className="space-y-3">
              {signals.map((signal) => (
                <div key={signal.id} className="flex gap-4 p-3 bg-[#f5f4f0] rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        signal.priorite === 'haute' ? 'bg-red-100 text-red-700' :
                        signal.priorite === 'moyenne' ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {signal.priorite}
                      </span>
                      <span className="text-xs text-[#888884]">
                        {AGENT_TYPE_LABELS[signal.agent_type as keyof typeof AGENT_TYPE_LABELS]}
                      </span>
                      {signal.directeur_cible && (
                        <span className="text-xs text-[#c9a84c]">→ {signal.directeur_cible}</span>
                      )}
                    </div>
                    <p className="text-sm text-[#111110] font-medium">{signal.agent_propose}</p>
                    <p className="text-xs text-[#888884] mt-0.5">{signal.signal_deduit}</p>
                    {signal.justification && (
                      <p className="text-xs text-[#888884] italic mt-1 border-l-2 border-[#dadad8] pl-2">
                        {signal.justification}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Compte rendu */}
        {crData && (
          <section className="bg-white rounded-xl border border-[#e8e7e4] p-6">
            <h2 className="font-semibold text-[#111110] mb-4 flex items-center gap-2">
              <div className="w-1 h-5 bg-[#c9a84c]" />
              Compte rendu
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-semibold text-[#888884] uppercase tracking-wide mb-2">Portrait du dirigeant</h3>
                <p className="text-sm text-[#111110] leading-relaxed">{String(crData.synthese_dirigeant ?? '')}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-xs font-semibold text-[#888884] uppercase tracking-wide mb-2">Points clés</h3>
                  <ul className="space-y-1">
                    {(crData.points_cles as string[] ?? []).map((p, i) => (
                      <li key={i} className="text-sm text-[#111110] flex gap-2">
                        <span className="text-[#c9a84c] mt-0.5">·</span>
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-[#888884] uppercase tracking-wide mb-2">Zones protégées</h3>
                  <ul className="space-y-1">
                    {(crData.zones_protegees as string[] ?? []).map((z, i) => (
                      <li key={i} className="text-sm text-[#111110] flex gap-2">
                        <span className="text-red-400 mt-0.5">✕</span>
                        {z}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-[#888884] uppercase tracking-wide mb-2">Politique données</h3>
                <p className="text-sm text-[#111110]">{String(crData.contrainte_donnees ?? '')}</p>
              </div>
            </div>
          </section>
        )}

        {/* Recommandations */}
        {recoData && (
          <section className="bg-white rounded-xl border border-[#e8e7e4] p-6">
            <h2 className="font-semibold text-[#111110] mb-1 flex items-center gap-2">
              <div className="w-1 h-5 bg-[#c9a84c]" />
              Recommandations agents IA
            </h2>
            <p className="text-sm text-[#888884] mb-4">{String(recoData.synthese ?? '')}</p>
            <div className="space-y-3">
              {(recoData.agents as Record<string, string>[] ?? []).map((agent, i) => (
                <div key={i} className="border border-[#e8e7e4] rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <h3 className="font-medium text-[#111110] text-sm">{agent.nom}</h3>
                      <p className="text-xs text-[#888884]">{agent.type} · {agent.directeur_cible}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                      agent.priorite === 'haute' ? 'bg-red-100 text-red-700' :
                      agent.priorite === 'moyenne' ? 'bg-amber-100 text-amber-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {agent.priorite}
                    </span>
                  </div>
                  <p className="text-sm text-[#111110]">{agent.probleme_resolu}</p>
                  <p className="text-xs text-[#888884] italic mt-1 border-l-2 border-[#c9a84c]/30 pl-2">
                    {agent.justification}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Brief table ronde */}
        {briefData && (
          <section className="bg-[#111110] rounded-xl p-6 text-[#f5f4f0]">
            <h2 className="font-semibold mb-1 flex items-center gap-2">
              <div className="w-1 h-5 bg-[#c9a84c]" />
              Brief table ronde directeurs
            </h2>
            <p className="text-sm text-[#888884] mb-5">{String(briefData.objectif ?? '')}</p>
            <div className="grid grid-cols-2 gap-5">
              <div>
                <h3 className="text-xs font-semibold text-[#888884] uppercase tracking-wide mb-3">Participants recommandés</h3>
                <ul className="space-y-2">
                  {(briefData.participants_recommandes as Record<string, string>[] ?? []).map((p, i) => (
                    <li key={i} className="text-sm">
                      <span className="text-[#c9a84c] font-medium">{p.direction}</span>
                      <span className="text-[#888884] ml-2">— {p.pourquoi}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-[#888884] uppercase tracking-wide mb-3">Questions à poser</h3>
                <ul className="space-y-2">
                  {(briefData.questions_a_poser as Record<string, string>[] ?? []).map((q, i) => (
                    <li key={i} className="text-sm">
                      <span className="text-[#c9a84c] font-medium">{q.direction} :</span>
                      <span className="text-[#f5f4f0]/80 ml-2">{q.question}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            {(briefData.points_attention as string[] ?? []).length > 0 && (
              <div className="mt-5 pt-5 border-t border-[#2a2a28]">
                <h3 className="text-xs font-semibold text-[#888884] uppercase tracking-wide mb-2">Points d'attention</h3>
                <ul className="space-y-1">
                  {(briefData.points_attention as string[]).map((p, i) => (
                    <li key={i} className="text-sm text-[#f5f4f0]/70 flex gap-2">
                      <span className="text-amber-400">⚠</span> {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  )
}
