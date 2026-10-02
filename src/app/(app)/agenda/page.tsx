import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, getDay } from 'date-fns'
import { fr } from 'date-fns/locale'
import { SESSION_STATUS_LABELS } from '@/types'
import { refreshAccessToken } from '@/lib/google/calendar'

export default async function AgendaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Sessions du mois en cours + 2 mois
  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(new Date(now.getFullYear(), now.getMonth() + 1, 1))

  const [{ data: sessions }, { data: profile }] = await Promise.all([
    supabase
      .from('sessions')
      .select('*, company:companies(nom, secteur)')
      .eq('consultant_id', user!.id)
      .gte('date_session', monthStart.toISOString())
      .lte('date_session', monthEnd.toISOString())
      .order('date_session'),
    supabase
      .from('profiles')
      .select('google_refresh_token')
      .eq('id', user!.id)
      .single(),
  ])

  const isGoogleConnected = !!profile?.google_refresh_token

  // Calendrier du mois courant
  const days = eachDayOfInterval({
    start: startOfMonth(now),
    end: endOfMonth(now),
  })

  const statusColors: { [key: string]: string } = {
    planifiee: 'bg-blue-500',
    en_cours: 'bg-amber-500',
    traitee: 'bg-green-500',
    table_ronde: 'bg-purple-500',
    archivee: 'bg-gray-400',
  }

  // Jours avec sessions
  function getSessionsForDay(date: Date) {
    return (sessions ?? []).filter(s =>
      s.date_session && isSameDay(new Date(s.date_session), date)
    )
  }

  // Décalage pour le premier jour du mois (lundi = 0)
  const firstDayOfWeek = (getDay(days[0]) + 6) % 7

  // Sessions à venir (liste)
  const upcomingSessions = (sessions ?? []).filter(s => {
    if (!s.date_session) return false
    return new Date(s.date_session) >= now
  })

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-[#111110]">Agenda</h1>
        <div className="flex items-center gap-3">
          {!isGoogleConnected ? (
            <a
              href="/api/auth/google"
              className="flex items-center gap-2 border border-[#e8e7e4] hover:border-[#c9a84c] text-[#888884] hover:text-[#111110] px-3 py-2 rounded-lg text-sm transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/>
              </svg>
              Connecter Google Calendar
            </a>
          ) : (
            <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Google Calendar connecté
            </div>
          )}
          <Link
            href="/sessions/new"
            className="bg-[#111110] hover:bg-[#1a1a18] text-[#f5f4f0] px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Planifier
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Calendrier */}
        <div className="col-span-2 bg-white border border-[#e8e7e4] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[#111110]">
              {format(now, 'MMMM yyyy', { locale: fr })}
            </h2>
          </div>

          {/* En-têtes jours */}
          <div className="grid grid-cols-7 mb-2">
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => (
              <div key={d} className="text-center text-xs text-[#888884] font-medium py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Grille */}
          <div className="grid grid-cols-7 gap-1">
            {/* Espaces vides avant le 1er */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {days.map(day => {
              const daySessions = getSessionsForDay(day)
              const today = isToday(day)
              return (
                <div
                  key={day.toISOString()}
                  className={`relative min-h-[56px] rounded-lg p-1.5 ${
                    today ? 'bg-[#111110]' : 'hover:bg-[#f5f4f0]'
                  }`}
                >
                  <span className={`text-xs font-medium ${today ? 'text-[#f5f4f0]' : 'text-[#888884]'}`}>
                    {format(day, 'd')}
                  </span>
                  <div className="mt-1 space-y-0.5">
                    {daySessions.slice(0, 2).map(s => (
                      <Link
                        key={s.id}
                        href={`/sessions/${s.id}`}
                        className={`block w-full rounded text-[10px] px-1 py-0.5 text-white truncate ${statusColors[s.statut]}`}
                        title={s.company?.nom}
                      >
                        {s.company?.nom ?? 'Session'}
                      </Link>
                    ))}
                    {daySessions.length > 2 && (
                      <div className="text-[10px] text-[#888884] px-1">+{daySessions.length - 2}</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Légende */}
          <div className="mt-4 pt-4 border-t border-[#f0efec] flex items-center gap-4 flex-wrap">
            {Object.entries(statusColors).map(([status, color]) => (
              <div key={status} className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${color}`} />
                <span className="text-xs text-[#888884]">{SESSION_STATUS_LABELS[status as keyof typeof SESSION_STATUS_LABELS]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sessions à venir */}
        <div className="space-y-4">
          <div className="bg-white border border-[#e8e7e4] rounded-xl p-5">
            <h2 className="font-semibold text-[#111110] mb-4 text-sm">Prochaines sessions</h2>
            {upcomingSessions.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-[#888884] mb-3">Aucune session planifiée.</p>
                <Link href="/sessions/new" className="text-xs text-[#c9a84c] hover:underline">
                  Planifier →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingSessions.slice(0, 8).map(s => (
                  <Link
                    key={s.id}
                    href={`/sessions/${s.id}`}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-[#f5f4f0] transition-colors group"
                  >
                    <div className="shrink-0 text-center min-w-[36px]">
                      <div className="text-xs text-[#888884]">
                        {s.date_session ? format(new Date(s.date_session), 'MMM', { locale: fr }) : '—'}
                      </div>
                      <div className="text-lg font-bold text-[#111110] leading-none">
                        {s.date_session ? format(new Date(s.date_session), 'd') : '—'}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-[#111110] group-hover:text-[#c9a84c] transition-colors truncate">
                        {s.company?.nom ?? '—'}
                      </div>
                      <div className="text-xs text-[#888884] mt-0.5">
                        {s.date_session ? format(new Date(s.date_session), 'HH:mm') : ''}
                        {s.duree_minutes && ` · ${s.duree_minutes / 60}h`}
                      </div>
                    </div>
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${statusColors[s.statut]}`} />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
