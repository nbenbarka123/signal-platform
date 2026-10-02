'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function NewCompanyPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    nom: '',
    secteur: '',
    ville: '',
    effectif: '',
    ca_estime: '',
    nom_dirigeant: '',
    poste_dirigeant: 'CEO',
    email_dirigeant: '',
    notes: '',
  })
  const router = useRouter()
  const supabase = createClient()

  function update(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nom) { setError('Le nom est obligatoire'); return }
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data, error: err } = await supabase
      .from('companies')
      .insert({
        consultant_id: user.id,
        nom: form.nom,
        secteur: form.secteur || null,
        ville: form.ville || null,
        effectif: form.effectif ? parseInt(form.effectif) : null,
        ca_estime: form.ca_estime || null,
        nom_dirigeant: form.nom_dirigeant || null,
        poste_dirigeant: form.poste_dirigeant || null,
        email_dirigeant: form.email_dirigeant || null,
        notes: form.notes || null,
      })
      .select()
      .single()

    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    router.push(`/companies/${data.id}`)
  }

  const inputClass = "w-full border border-[#e8e7e4] rounded-lg px-3 py-2.5 text-sm text-[#111110] placeholder-[#c8c7c3] focus:outline-none focus:ring-2 focus:ring-[#c9a84c]/30 focus:border-[#c9a84c]"
  const labelClass = "block text-xs font-semibold text-[#888884] uppercase tracking-wide mb-2"

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/companies" className="text-[#888884] hover:text-[#111110]">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-[#111110]">Nouvelle entreprise</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Infos principales */}
        <div className="bg-white border border-[#e8e7e4] rounded-xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-[#111110]">Informations générales</h2>

          <div>
            <label className={labelClass}>Nom de l'entreprise *</label>
            <input
              type="text"
              value={form.nom}
              onChange={e => update('nom', e.target.value)}
              placeholder="Acme Corp"
              className={inputClass}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Secteur</label>
              <input
                type="text"
                value={form.secteur}
                onChange={e => update('secteur', e.target.value)}
                placeholder="Distribution, Industrie..."
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Ville</label>
              <input
                type="text"
                value={form.ville}
                onChange={e => update('ville', e.target.value)}
                placeholder="Abidjan"
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Effectif</label>
              <input
                type="number"
                value={form.effectif}
                onChange={e => update('effectif', e.target.value)}
                placeholder="250"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>CA estimé</label>
              <input
                type="text"
                value={form.ca_estime}
                onChange={e => update('ca_estime', e.target.value)}
                placeholder="50M€"
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Dirigeant */}
        <div className="bg-white border border-[#e8e7e4] rounded-xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-[#111110]">Contact dirigeant</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Nom du dirigeant</label>
              <input
                type="text"
                value={form.nom_dirigeant}
                onChange={e => update('nom_dirigeant', e.target.value)}
                placeholder="Jean Dupont"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Poste</label>
              <input
                type="text"
                value={form.poste_dirigeant}
                onChange={e => update('poste_dirigeant', e.target.value)}
                placeholder="CEO"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Email</label>
            <input
              type="email"
              value={form.email_dirigeant}
              onChange={e => update('email_dirigeant', e.target.value)}
              placeholder="ceo@entreprise.com"
              className={inputClass}
            />
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white border border-[#e8e7e4] rounded-xl p-6">
          <label className={labelClass}>Notes</label>
          <textarea
            value={form.notes}
            onChange={e => update('notes', e.target.value)}
            rows={3}
            placeholder="Contexte, historique, informations utiles..."
            className={`${inputClass} resize-none`}
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-[#111110] hover:bg-[#1a1a18] disabled:opacity-50 text-[#f5f4f0] font-medium rounded-lg py-2.5 text-sm transition-colors"
          >
            {loading ? 'Création...' : 'Créer l\'entreprise'}
          </button>
          <Link
            href="/companies"
            className="px-4 py-2.5 border border-[#e8e7e4] rounded-lg text-sm text-[#888884] hover:text-[#111110] hover:border-[#d0cfcc] transition-colors"
          >
            Annuler
          </Link>
        </div>
      </form>
    </div>
  )
}
