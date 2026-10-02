import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { SESSION_STATUS_LABELS } from '@/types'

export default async function CompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: company }, { data: sessions }] = await Promise.all([
    supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .eq('consultant_id', user!.id)
      .single(),
    supabase
      .from('sessions')
      .select('*')
      .eq('company_id', id)
      .order('date_session', { ascending: false }),
  ])

  if (!company) notFound()

  const statusColors: { [key: string]: string } = {
    planifiee: 'bg-blue-50 text-blue-600',
    en_cours: 'bg-amber-50 text-amber-600',
    traitee: 'bg-green-50 text-green-600',
    table_ronde: 'bg-purple-50 text-purple-600',
    archivee: 'bg-gray-50 text-gray-500',
  }

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link href="/companies" className="text-[#888884] hover:text-[#111110]">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="w-12 h-12 bg-[#111110] rounded-xl flex items-center justify-center text-[#f5f4f0] text-lg font-bold">
            {company.nom[0].toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#111110]">{company.nom}</h1>
            <p className="text-sm text-[#888884]">
              {[company.secteur, company.ville].filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>
        <Link
          href={`/sessions/new?company=${company.id}`}
          className="bg-[#c9a84c] hover:bg-[#b8973b] text-[#111110] px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + Nouvelle session
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        {/* Infos entreprise */}
        <div className="col-span-2 bg-white border border-[#e8e7e4] rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-[#111110]">Fiche entreprise</h2>
          <div className="grid grid-cols-2 gap-4">
            {company.nom_dirigeant && (
              <div>
                <p className="text-xs text-[#888884] uppercase tracking-wide mb-1">Dirigeant</p>
                <p className="text-sm text-[#111110] font-medium">{company.nom_dirigeant}</p>
                <p className="text-xs text-[#888884]">{company.poste_dirigeant}</p>
              </div>
            )}
            {company.email_dirigeant && (
              <div>
                <p className="text-xs text-[#888884] uppercase tracking-wide mb-1">Email</p>
                <a href={`mailto:${company.email_dirigeant}`} className="text-sm text-[#c9a84c] hover:underline">
                  {company.email_dirigeant}
                </a>
              </div>
            )}
            {company.effectif && (
              <div>
                <p className="text-xs text-[#888884] uppercase tracking-wide mb-1">Effectif</p>
                <p className="text-sm text-[#111110]">{company.effectif.toLocaleString()} personnes</p>
              </div>
            )}
            {company.ca_estime && (
              <div>
                <p className="text-xs text-[#888884] uppercase tracking-wide mb-1">CA estimé</p>
                <p className="text-sm text-[#111110]">{company.ca_estime}</p>
              </div>
            )}
          </div>
          {company.notes && (
            <div className="pt-3 border-t border-[#f0efec]">
              <p className="text-xs text-[#888884] uppercase tracking-wide mb-1">Notes</p>
              <p className="text-sm text-[#111110] leading-relaxed">{company.notes}</p>
            </div>
          )}
        </div>

        {/* Stats rapides */}
        <div className="bg-white border border-[#e8e7e4] rounded-xl p-5">
          <h2 className="text-sm font-semibold text-[#111110] mb-4">Activité</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-[#888884]">Sessions total</span>
              <span className="text-sm font-semibold text-[#111110]">{sessions?.length ?? 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-[#888884]">Traitées</span>
              <span className="text-sm font-semibold text-green-600">
                {sessions?.filter(s => s.statut === 'traitee').length ?? 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-[#888884]">En cours</span>
              <span className="text-sm font-semibold text-amber-600">
                {sessions?.filter(s => s.statut === 'en_cours').length ?? 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sessions */}
      <div className="bg-white border border-[#e8e7e4] rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#f0efec] flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#111110]">Sessions</h2>
        </div>
        {!sessions?.length ? (
          <div className="p-8 text-center">
            <p className="text-[#888884] text-sm mb-3">Aucune session planifiée.</p>
            <Link href="/sessions/new" className="text-[#c9a84c] hover:underline text-sm">
              Planifier la première session CEO →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-[#f0efec]">
            {sessions.map(session => (
              <Link
                key={session.id}
                href={`/sessions/${session.id}`}
                className="flex items-center gap-4 px-6 py-3.5 hover:bg-[#fafaf8] transition-colors group"
              >
                <div className="flex-1">
                  <div className="text-sm text-[#111110] font-medium">
                    {session.date_session
                      ? format(new Date(session.date_session), 'EEEE d MMMM yyyy', { locale: fr })
                      : 'Date non définie'}
                  </div>
                  {session.date_session && (
                    <div className="text-xs text-[#888884] mt-0.5">
                      {format(new Date(session.date_session), 'HH:mm', { locale: fr })}
                      {session.duree_minutes && ` · ${session.duree_minutes / 60}h`}
                    </div>
                  )}
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${statusColors[session.statut as string]}`}>
                  {SESSION_STATUS_LABELS[session.statut as keyof typeof SESSION_STATUS_LABELS]}
                </span>
                {session.statut === 'traitee' && (
                  <span className="text-xs text-[#888884] group-hover:text-[#c9a84c] shrink-0">
                    Voir outputs →
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
