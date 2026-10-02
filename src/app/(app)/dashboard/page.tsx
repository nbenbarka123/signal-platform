import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import Link from 'next/link'
import { SESSION_STATUS_LABELS, type Session } from '@/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Charger les données
  const [{ data: sessions }, { data: companies }, { count: sessionCount }] = await Promise.all([
    supabase
      .from('sessions')
      .select('*, company:companies(nom, secteur)')
      .eq('consultant_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('companies')
      .select('id')
      .eq('created_by', user!.id),
    supabase
      .from('sessions')
      .select('id', { count: 'exact', head: true })
      .eq('consultant_id', user!.id)
      .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
  ])

  // Pipeline stats
  const pipeline = {
    planifiee: sessions?.filter(s => s.statut === 'planifiee').length ?? 0,
    en_cours: sessions?.filter(s => s.statut === 'en_cours').length ?? 0,
    traitee: sessions?.filter(s => s.statut === 'traitee').length ?? 0,
    table_ronde: sessions?.filter(s => s.statut === 'table_ronde').length ?? 0,
  }

  // Sessions à venir (7 prochains jours)
  const now = new Date()
  const in7days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const upcoming = sessions?.filter(s =>
    s.date_session &&
    new Date(s.date_session) >= now &&
    new Date(s.date_session) <= in7days
  ) ?? []

  return (
    <div className="p-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#111110]">Dashboard</h1>
          <p className="text-[#888884] text-sm mt-0.5">
            {format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}
          </p>
        </div>
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

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Entreprises"
          value={companies?.length ?? 0}
          icon="building"
          href="/companies"
        />
        <StatCard
          label="Sessions ce mois"
          value={sessionCount ?? 0}
          icon="chat"
          href="/sessions"
        />
        <StatCard
          label="Sessions à venir"
          value={upcoming.length}
          icon="calendar"
          href="/agenda"
          accent={upcoming.length > 0}
        />
      </div>

      {/* Pipeline */}
      <div className="bg-white border border-[#e8e7e4] rounded-xl p-6 mb-6">
        <h2 className="text-sm font-semibold text-[#111110] mb-4">Pipeline</h2>
        <div className="grid grid-cols-4 gap-3">
          {[
            { key: 'planifiee', label: 'Planifiées', color: 'bg-blue-100 text-blue-700' },
            { key: 'en_cours', label: 'En cours', color: 'bg-amber-100 text-amber-700' },
            { key: 'traitee', label: 'Traitées', color: 'bg-green-100 text-green-700' },
            { key: 'table_ronde', label: 'Table ronde', color: 'bg-purple-100 text-purple-700' },
          ].map(({ key, label, color }) => (
            <div key={key} className="bg-[#f5f4f0] rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-[#111110] mb-1">
                {pipeline[key as keyof typeof pipeline]}
              </div>
              <div className={`text-xs font-medium px-2 py-0.5 rounded-full inline-block ${color}`}>
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sessions récentes */}
      <div className="bg-white border border-[#e8e7e4] rounded-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0efec]">
          <h2 className="text-sm font-semibold text-[#111110]">Sessions récentes</h2>
          <Link href="/sessions" className="text-xs text-[#c9a84c] hover:underline">
            Voir tout
          </Link>
        </div>
        {!sessions?.length ? (
          <div className="px-6 py-12 text-center">
            <p className="text-[#888884] text-sm">Aucune session pour l'instant.</p>
            <Link href="/sessions/new" className="text-[#c9a84c] text-sm hover:underline mt-1 inline-block">
              Créer votre première session →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-[#f0efec]">
            {sessions.map((session: Session & { company?: { nom: string; secteur: string } }) => (
              <Link
                key={session.id}
                href={`/sessions/${session.id}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-[#fafaf8] transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-[#f0efec] rounded-lg flex items-center justify-center text-xs font-bold text-[#888884]">
                    {session.company?.nom?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-[#111110] group-hover:text-[#c9a84c] transition-colors">
                      {session.company?.nom ?? 'Entreprise inconnue'}
                    </div>
                    <div className="text-xs text-[#888884]">
                      {session.date_session
                        ? format(new Date(session.date_session), 'd MMM yyyy', { locale: fr })
                        : 'Date non définie'}
                    </div>
                  </div>
                </div>
                <StatusBadge status={session.statut} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, href, accent }: {
  label: string
  value: number
  icon: string
  href: string
  accent?: boolean
}) {
  return (
    <Link href={href} className="bg-white border border-[#e8e7e4] rounded-xl p-5 hover:border-[#c9a84c] transition-colors group">
      <div className="text-3xl font-bold text-[#111110] mb-1 group-hover:text-[#c9a84c] transition-colors">
        {value}
      </div>
      <div className="text-xs text-[#888884]">{label}</div>
    </Link>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    planifiee: 'bg-blue-50 text-blue-600',
    en_cours: 'bg-amber-50 text-amber-600',
    traitee: 'bg-green-50 text-green-600',
    table_ronde: 'bg-purple-50 text-purple-600',
    archivee: 'bg-gray-50 text-gray-500',
  }
  return (
    <span className={`text-xs px-2 py-1 rounded-full font-medium ${styles[status] ?? 'bg-gray-50 text-gray-500'}`}>
      {SESSION_STATUS_LABELS[status as keyof typeof SESSION_STATUS_LABELS] ?? status}
    </span>
  )
}
