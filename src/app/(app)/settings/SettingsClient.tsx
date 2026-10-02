'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'

interface Props {
  user: { id: string; email: string }
  profile: Profile | null
  isGoogleConnected: boolean
}

export default function SettingsClient({ user, profile, isGoogleConnected }: Props) {
  const [name, setName] = useState([profile?.prenom, profile?.nom].filter(Boolean).join(' '))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [savingPwd, setSavingPwd] = useState(false)
  const [pwd, setPwd] = useState({ current: '', new: '', confirm: '' })
  const [pwdError, setPwdError] = useState<string | null>(null)
  const [pwdOk, setPwdOk] = useState(false)
  const supabase = createClient()

  async function handleSaveProfile() {
    setSaving(true)
    const parts = name.trim().split(' ')
    const prenom = parts[0] ?? ''
    const nom = parts.slice(1).join(' ')
    await supabase
      .from('profiles')
      .update({ prenom, nom: nom || null })
      .eq('id', user.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleChangePassword() {
    setPwdError(null)
    if (pwd.new !== pwd.confirm) { setPwdError('Les mots de passe ne correspondent pas'); return }
    if (pwd.new.length < 8) { setPwdError('Minimum 8 caractères'); return }
    setSavingPwd(true)
    const { error } = await supabase.auth.updateUser({ password: pwd.new })
    setSavingPwd(false)
    if (error) { setPwdError(error.message); return }
    setPwdOk(true)
    setPwd({ current: '', new: '', confirm: '' })
    setTimeout(() => setPwdOk(false), 3000)
  }

  const inputClass = "w-full border border-[#e8e7e4] rounded-lg px-3 py-2.5 text-sm text-[#111110] focus:outline-none focus:ring-2 focus:ring-[#c9a84c]/30 focus:border-[#c9a84c]"
  const labelClass = "block text-xs font-semibold text-[#888884] uppercase tracking-wide mb-2"

  return (
    <div className="space-y-6">
      {/* Profil */}
      <section className="bg-white border border-[#e8e7e4] rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-[#111110]">Profil</h2>

        <div>
          <label className={labelClass}>Nom complet</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Nabil Djin"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Email</label>
          <input
            type="email"
            value={user.email}
            disabled
            className={`${inputClass} bg-[#f5f4f0] text-[#888884]`}
          />
          <p className="text-xs text-[#888884] mt-1">L'email ne peut pas être modifié</p>
        </div>

        <button
          onClick={handleSaveProfile}
          disabled={saving}
          className="bg-[#111110] hover:bg-[#1a1a18] disabled:opacity-50 text-[#f5f4f0] text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          {saving ? 'Enregistrement...' : saved ? 'Enregistré ✓' : 'Sauvegarder'}
        </button>
      </section>

      {/* Mot de passe */}
      <section className="bg-white border border-[#e8e7e4] rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-[#111110]">Mot de passe</h2>

        <div>
          <label className={labelClass}>Nouveau mot de passe</label>
          <input
            type="password"
            value={pwd.new}
            onChange={e => setPwd(p => ({ ...p, new: e.target.value }))}
            className={inputClass}
            placeholder="••••••••"
          />
        </div>
        <div>
          <label className={labelClass}>Confirmer</label>
          <input
            type="password"
            value={pwd.confirm}
            onChange={e => setPwd(p => ({ ...p, confirm: e.target.value }))}
            className={inputClass}
            placeholder="••••••••"
          />
        </div>

        {pwdError && (
          <p className="text-red-600 text-sm">{pwdError}</p>
        )}
        {pwdOk && (
          <p className="text-green-600 text-sm">Mot de passe mis à jour ✓</p>
        )}

        <button
          onClick={handleChangePassword}
          disabled={savingPwd || !pwd.new}
          className="bg-[#111110] hover:bg-[#1a1a18] disabled:opacity-50 text-[#f5f4f0] text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          {savingPwd ? 'Mise à jour...' : 'Changer le mot de passe'}
        </button>
      </section>

      {/* Google Calendar */}
      <section className="bg-white border border-[#e8e7e4] rounded-xl p-6">
        <h2 className="text-sm font-semibold text-[#111110] mb-1">Google Calendar</h2>
        <p className="text-xs text-[#888884] mb-4">
          Connectez votre Google Calendar pour synchroniser vos sessions et recevoir des rappels.
        </p>

        {isGoogleConnected ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-green-700">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              Compte Google connecté
            </div>
            <button
              onClick={async () => {
                await fetch('/api/auth/google/disconnect', { method: 'POST' })
                window.location.reload()
              }}
              className="text-xs text-[#888884] hover:text-red-600 transition-colors"
            >
              Déconnecter
            </button>
          </div>
        ) : (
          <a
            href="/api/auth/google"
            className="inline-flex items-center gap-2 border border-[#e8e7e4] hover:border-[#c9a84c] text-[#888884] hover:text-[#111110] px-4 py-2 rounded-lg text-sm transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/>
            </svg>
            Connecter Google Calendar
          </a>
        )}
      </section>

      {/* Zone danger */}
      <section className="bg-white border border-red-100 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-red-700 mb-1">Zone de danger</h2>
        <p className="text-xs text-[#888884] mb-4">
          Ces actions sont irréversibles.
        </p>
        <button
          onClick={async () => {
            if (!confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) return
            await createClient().auth.signOut()
            window.location.href = '/login'
          }}
          className="text-sm text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 px-4 py-2 rounded-lg transition-colors"
        >
          Se déconnecter
        </button>
      </section>
    </div>
  )
}
