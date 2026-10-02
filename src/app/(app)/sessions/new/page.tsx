'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Company } from '@/types'

export default function NewSessionPage() {
  const [companies, setCompanies] = useState<Pick<Company, 'id' | 'nom' | 'secteur' | 'ville'>[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    company_id: '',
    date_session: '',
    heure: '09:00',
    duree_minutes: '120',
    notes_prep: '',
  })
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase
      .from('companies')
      .select('id, nom, secteur, ville')
      .order('nom')
      .then(({ data }) => setCompanies(data ?? []))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.company_id || !form.date_session) {
      setError('Entreprise et date sont obligatoires')
      return
    }
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const datetime = `${form.date_session}T${form.heure}:00`

    const { data, error: err } = await supabase
      .from('sessions')
      .insert({
        company_id: form.company_id,
        consultant_id: user.id,
        date_session: datetime,
        duree_minutes: parseInt(form.duree_minutes),
        notes_prep: form.notes_prep || null,
        statut: 'planifiee',
      })
      .select()
      .single()

    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    router.push(`/sessions/${data.id}`)
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/sessions" className="text-[#888884] hover:text-[#111110]">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-[#111110]">Nouvelle session</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-[#e8e7e4] rounded-xl p-6 space-y-5">
        {/* Entreprise */}
        <div>
          <label className="block text-xs font-semibold text-[#888884] uppercase tracking-wide mb-2">
            Entreprise *
          </label>
          {companies.length === 0 ? (
            <div className="text-sm text-[#888884]">
              Aucune entreprise.{' '}
              <Link href="/companies/new" className="text-[#c9a84c] hover:underline">
                Créer une entreprise →
              </Link>
            </div>
          ) : (
            <select
              value={form.company_id}
              onChange={e => setForm(f => ({ ...f, company_id: e.target.value }))}
              className="w-full border border-[#e8e7e4] rounded-lg px-3 py-2.5 text-sm text-[#111110] focus:outline-none focus:ring-2 focus:ring-[#c9a84c]/30 focus:border-[#c9a84c]"
              required
            >
              <option value="">Sélectionner une entreprise</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nom}{c.secteur ? ` — ${c.secteur}` : ''}{c.ville ? `, ${c.ville}` : ''}
                </option>
              ))}
            </select>
          )}
          <Link href="/companies/new" className="text-xs text-[#c9a84c] hover:underline mt-1 inline-block">
            + Créer une nouvelle entreprise
          </Link>
        </div>

        {/* Date et heure */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#888884] uppercase tracking-wide mb-2">
              Date *
            </label>
            <input
              type="date"
              value={form.date_session}
              onChange={e => setForm(f => ({ ...f, date_session: e.target.value }))}
              className="w-full border border-[#e8e7e4] rounded-lg px-3 py-2.5 text-sm text-[#111110] focus:outline-none focus:ring-2 focus:ring-[#c9a84c]/30 focus:border-[#c9a84c]"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#888884] uppercase tracking-wide mb-2">
              Heure
            </label>
            <input
              type="time"
              value={form.heure}
              onChange={e => setForm(f => ({ ...f, heure: e.target.value }))}
              className="w-full border border-[#e8e7e4] rounded-lg px-3 py-2.5 text-sm text-[#111110] focus:outline-none focus:ring-2 focus:ring-[#c9a84c]/30 focus:border-[#c9a84c]"
            />
          </div>
        </div>

        {/* Durée */}
        <div>
          <label className="block text-xs font-semibold text-[#888884] uppercase tracking-wide mb-2">
            Durée prévue
          </label>
          <select
            value={form.duree_minutes}
            onChange={e => setForm(f => ({ ...f, duree_minutes: e.target.value }))}
            className="w-full border border-[#e8e7e4] rounded-lg px-3 py-2.5 text-sm text-[#111110] focus:outline-none focus:ring-2 focus:ring-[#c9a84c]/30 focus:border-[#c9a84c]"
          >
            <option value="90">1h30</option>
            <option value="120">2h (recommandé)</option>
            <option value="150">2h30</option>
            <option value="180">3h</option>
          </select>
        </div>

        {/* Notes de préparation */}
        <div>
          <label className="block text-xs font-semibold text-[#888884] uppercase tracking-wide mb-2">
            Notes de préparation
          </label>
          <textarea
            value={form.notes_prep}
            onChange={e => setForm(f => ({ ...f, notes_prep: e.target.value }))}
            rows={3}
            placeholder="Contexte particulier, points d'attention, objectifs spécifiques..."
            className="w-full border border-[#e8e7e4] rounded-lg px-3 py-2.5 text-sm text-[#111110] placeholder-[#c8c7c3] focus:outline-none focus:ring-2 focus:ring-[#c9a84c]/30 focus:border-[#c9a84c] resize-none"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-[#111110] hover:bg-[#1a1a18] disabled:opacity-50 text-[#f5f4f0] font-medium rounded-lg py-2.5 text-sm transition-colors"
          >
            {loading ? 'Création...' : 'Créer la session'}
          </button>
          <Link
            href="/sessions"
            className="px-4 py-2.5 border border-[#e8e7e4] rounded-lg text-sm text-[#888884] hover:text-[#111110] hover:border-[#d0cfcc] transition-colors"
          >
            Annuler
          </Link>
        </div>
      </form>
    </div>
  )
}
