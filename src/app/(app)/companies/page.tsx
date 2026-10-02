import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Company } from '@/types'

export default async function CompaniesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: companies } = await supabase
    .from('companies')
    .select(`
      *,
      sessions(id, statut)
    `)
    .eq('consultant_id', user!.id)
    .order('nom')

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-[#111110]">Entreprises</h1>
        <Link
          href="/companies/new"
          className="bg-[#111110] hover:bg-[#1a1a18] text-[#f5f4f0] px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nouvelle entreprise
        </Link>
      </div>

      {!companies?.length ? (
        <div className="bg-white border border-[#e8e7e4] rounded-xl p-12 text-center">
          <div className="w-12 h-12 bg-[#f0efec] rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-[#888884]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <p className="text-[#888884] mb-3">Aucune entreprise pour l'instant.</p>
          <Link href="/companies/new" className="text-[#c9a84c] hover:underline text-sm">
            Ajouter votre première entreprise →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {companies.map((company: Company & { sessions?: { id: string; statut: string }[] }) => {
            const sessions = company.sessions ?? []
            const total = sessions.length
            const treated = sessions.filter(s => s.statut === 'traitee').length
            const inProgress = sessions.filter(s => s.statut === 'en_cours').length

            return (
              <Link
                key={company.id}
                href={`/companies/${company.id}`}
                className="bg-white border border-[#e8e7e4] rounded-xl p-5 hover:border-[#c9a84c]/40 hover:shadow-sm transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-[#f0efec] group-hover:bg-[#c9a84c]/10 rounded-xl flex items-center justify-center text-sm font-bold text-[#888884] group-hover:text-[#c9a84c] shrink-0 transition-colors">
                    {company.nom[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[#111110] text-sm group-hover:text-[#c9a84c] transition-colors truncate">
                      {company.nom}
                    </h3>
                    <p className="text-xs text-[#888884] mt-0.5">
                      {[company.secteur, company.ville].filter(Boolean).join(' · ')}
                    </p>
                    {company.ca_estime && (
                      <p className="text-xs text-[#888884] mt-0.5">CA ~{company.ca_estime}</p>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-[#f0efec] flex items-center gap-4">
                  <div className="text-xs text-[#888884]">
                    <span className="font-medium text-[#111110]">{total}</span> session{total > 1 ? 's' : ''}
                  </div>
                  {treated > 0 && (
                    <div className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                      {treated} traitée{treated > 1 ? 's' : ''}
                    </div>
                  )}
                  {inProgress > 0 && (
                    <div className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                      {inProgress} en cours
                    </div>
                  )}
                  {total === 0 && (
                    <div className="text-xs text-[#c9a84c]">Planifier une session →</div>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
