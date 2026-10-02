import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { SESSION_STATUS_LABELS, type Session } from '@/types'

export default async function SessionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: sessions } = await supabase
    .from('sessions')
    .select('*, company:companies(nom, secteur, ville)')
    .eq('consultant_id', user!.id)
    .order('created_at', { ascending: false })

  const statusColors: Record<string, string> = {
    planifiee: 'bg-blue-50 text-blue-600',
    en_cours: 'bg-amber-50 text-amber-600',
    traitee: 'bg-green-50 text-green-600',
    table_ronde: 'bg-purple-50 text-purple-600',
    archivee: 'bg-gray-50 text-gray-500',
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-[#111110]">Sessions</h1>
        <Link
          href="/sessions/new"
          className="bg-[#111110] hover:bg-[#1a1a18] text-[#f5f4f0] px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nouvelle session
        </Link>
      </div>

      {!sessions?.length ? (
        <div className="bg-white border border-[#e8e7e4] rounded-xl p-12 text-center">
          <p className="text-[#888884] mb-3">Aucune session pour l'instant.</p>
          <Link href="/sessions/new" className="text-[#c9a84c] hover:underline text-sm">
            Planifier votre première session CEO →
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-[#e8e7e4] rounded-xl overflow-hidden">
          <div className="divide-y divide-[#f0efec]">
            {sessions.map((session: Session & { company?: { nom: string; secteur: string; ville: string } }) => (
              <Link
                key={session.id}
                href={`/sessions/${session.id}`}
                className="flex items-center gap-5 px-6 py-4 hover:bg-[#fafaf8] transition-colors group"
              >
                <div className="w-10 h-10 bg-[#f0efec] rounded-xl flex items-center justify-center text-sm font-bold text-[#888884] shrink-0">
                  {session.company?.nom?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-[#111110] text-sm group-hover:text-[#c9a84c] transition-colors truncate">
                    {session.company?.nom ?? '—'}
                  </div>
                  <div className="text-xs text-[#888884] mt-0.5">
                    {session.company?.secteur && `${session.company.secteur} · `}
                    {session.date_session
                      ? format(new Date(session.date_session), 'd MMM yyyy', { locale: fr })
                      : 'Date non définie'}
                  </div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${statusColors[session.statut]}`}>
                  {SESSION_STATUS_LABELS[session.statut]}
                </span>
                {session.statut === 'traitee' && (
                  <span className="text-xs text-[#888884] hover:text-[#c9a84c] shrink-0">
                    Voir outputs →
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
