'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function DeleteSessionButton({ sessionId }: { sessionId: string }) {
  const [confirm, setConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    setLoading(true)
    const supabase = createClient()
    await supabase.from('session_responses').delete().eq('session_id', sessionId)
    const { error } = await supabase.from('sessions').delete().eq('id', sessionId)
    if (error) {
      alert('Erreur lors de la suppression : ' + error.message)
      setLoading(false)
      return
    }
    router.push('/sessions')
    router.refresh()
  }

  if (confirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-[#888884]">Confirmer ?</span>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="text-xs px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          {loading ? '...' : 'Oui, supprimer'}
        </button>
        <button
          onClick={() => setConfirm(false)}
          className="text-xs px-3 py-1.5 border border-[#e8e7e4] rounded-lg text-[#888884] hover:text-[#111110] transition-colors"
        >
          Annuler
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      className="text-xs px-3 py-1.5 border border-red-200 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
    >
      Supprimer
    </button>
  )
}
