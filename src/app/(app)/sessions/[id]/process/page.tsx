'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function ProcessPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const params = useParams()
  const sessionId = params.id as string

  async function handleAnalyze() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/sessions/${sessionId}/analyze`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur inconnue')
      router.push(`/sessions/${sessionId}/outputs`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f4f0] flex items-center justify-center p-8">
      <div className="max-w-md w-full">
        <div className="bg-white border border-[#e8e7e4] rounded-2xl p-8 text-center">
          {loading ? (
            <>
              <div className="w-12 h-12 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin mx-auto mb-6" />
              <h2 className="text-lg font-semibold text-[#111110] mb-2">Analyse en cours...</h2>
              <p className="text-[#888884] text-sm">
                Claude lit les réponses, extrait les signaux et génère les recommandations.
                <br />Cela prend 15 à 30 secondes.
              </p>
            </>
          ) : (
            <>
              <div className="w-12 h-12 bg-[#c9a84c]/10 rounded-xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-6 h-6 text-[#c9a84c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-[#111110] mb-2">Lancer l'analyse IA</h2>
              <p className="text-[#888884] text-sm mb-6">
                Claude va analyser les réponses CEO, extraire les signaux, mapper les agents IA
                et générer le compte rendu, les recommandations et le brief table ronde.
              </p>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-4 text-left">
                  {error}
                </div>
              )}

              <button
                onClick={handleAnalyze}
                className="w-full bg-[#c9a84c] hover:bg-[#b8973b] text-[#111110] font-semibold rounded-xl py-3 transition-colors"
              >
                Analyser la session →
              </button>
              <Link
                href={`/sessions/${sessionId}`}
                className="block mt-3 text-sm text-[#888884] hover:text-[#111110] transition-colors"
              >
                ← Retour à l'interview
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
