'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { GuideQuestion, SessionResponse } from '@/types'

interface BlocGroup {
  bloc: string
  label: string
  questions: GuideQuestion[]
}

interface Props {
  sessionId: string
  questionsByBloc: BlocGroup[]
  responsesMap: Record<string, SessionResponse>
}

export default function SessionInterview({ sessionId, questionsByBloc, responsesMap }: Props) {
  const [responses, setResponses] = useState<Record<string, string>>(
    Object.fromEntries(
      Object.entries(responsesMap).map(([qid, r]) => [qid, r.reponse_verbatim ?? ''])
    )
  )
  const [notes, setNotes] = useState<Record<string, string>>(
    Object.fromEntries(
      Object.entries(responsesMap).map(([qid, r]) => [qid, r.notes_consultant ?? ''])
    )
  )
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})
  const [activeBloc, setActiveBloc] = useState('B1')
  const supabase = createClient()

  const saveResponse = useCallback(async (questionId: string) => {
    setSaving(s => ({ ...s, [questionId]: true }))
    const reponse = responses[questionId] ?? ''
    const note = notes[questionId] ?? ''

    await supabase
      .from('session_responses')
      .upsert({
        session_id: sessionId,
        question_id: questionId,
        reponse_verbatim: reponse,
        notes_consultant: note,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'session_id,question_id' })

    setSaving(s => ({ ...s, [questionId]: false }))
    setSaved(s => ({ ...s, [questionId]: true }))
    setTimeout(() => setSaved(s => ({ ...s, [questionId]: false })), 2000)
  }, [responses, notes, sessionId, supabase])

  const totalQuestions = questionsByBloc.reduce((n, b) => n + b.questions.length, 0)
  const answeredQuestions = Object.values(responses).filter(r => r.trim().length > 0).length

  return (
    <div className="flex gap-6">
      {/* Nav blocs */}
      <div className="w-48 shrink-0">
        <div className="sticky top-6 space-y-1">
          <div className="text-xs text-[#888884] mb-3 px-2">
            {answeredQuestions}/{totalQuestions} réponses
          </div>
          <div className="w-full bg-[#dadad8] rounded-full h-1 mb-4">
            <div
              className="bg-[#c9a84c] h-1 rounded-full transition-all"
              style={{ width: `${(answeredQuestions / totalQuestions) * 100}%` }}
            />
          </div>
          {questionsByBloc.map(({ bloc, label, questions }) => {
            const answered = questions.filter(q => (responses[q.id] ?? '').trim().length > 0).length
            return (
              <button
                key={bloc}
                onClick={() => setActiveBloc(bloc)}
                className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors ${
                  activeBloc === bloc
                    ? 'bg-[#111110] text-[#f5f4f0]'
                    : 'text-[#888884] hover:bg-white hover:text-[#111110]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">{bloc}</span>
                  <span className={`text-xs ${answered === questions.length ? 'text-[#c9a84c]' : ''}`}>
                    {answered}/{questions.length}
                  </span>
                </div>
                <div className="text-[10px] mt-0.5 leading-tight opacity-70">{label}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Questions */}
      <div className="flex-1 space-y-4">
        {questionsByBloc
          .filter(b => b.bloc === activeBloc)
          .map(({ bloc, label, questions }) => (
            <div key={bloc}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-6 bg-[#c9a84c]" />
                <div>
                  <h2 className="font-semibold text-[#111110]">{bloc} — {label}</h2>
                </div>
              </div>

              <div className="space-y-4">
                {questions.map((q) => {
                  const hasResponse = (responses[q.id] ?? '').trim().length > 0
                  return (
                    <div
                      key={q.id}
                      className={`bg-white rounded-xl border transition-colors ${
                        hasResponse ? 'border-[#e8e7e4]' : 'border-[#e8e7e4]'
                      }`}
                    >
                      <div className="px-5 pt-5 pb-3">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="text-xs font-bold text-[#c9a84c] bg-[#c9a84c]/10 px-1.5 py-0.5 rounded">
                                {q.id}
                              </span>
                              {hasResponse && (
                                <span className="text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                                  ✓ Répondu
                                </span>
                              )}
                            </div>
                            <p className="text-[#111110] font-medium text-sm leading-relaxed">
                              {q.question}
                            </p>
                            {q.description && (
                              <p className="text-[#888884] text-xs mt-1">{q.description}</p>
                            )}
                          </div>
                        </div>

                        <textarea
                          value={responses[q.id] ?? ''}
                          onChange={(e) => setResponses(r => ({ ...r, [q.id]: e.target.value }))}
                          onBlur={() => (responses[q.id] ?? '').trim() && saveResponse(q.id)}
                          rows={4}
                          placeholder="Réponse du CEO..."
                          className="w-full bg-[#f5f4f0] border border-[#e8e7e4] focus:border-[#c9a84c] text-[#111110] text-sm rounded-lg px-3 py-2.5 resize-none transition-colors focus:outline-none placeholder:text-[#c8c8c6]"
                        />

                        {q.signal_attendu && (
                          <div className="mt-2 flex items-start gap-2">
                            <span className="text-[10px] text-[#888884] mt-0.5">→</span>
                            <p className="text-[10px] text-[#888884] italic">{q.signal_attendu}</p>
                          </div>
                        )}
                      </div>

                      {/* Notes consultant */}
                      <div className="border-t border-[#f0efec] px-5 py-3">
                        <input
                          value={notes[q.id] ?? ''}
                          onChange={(e) => setNotes(n => ({ ...n, [q.id]: e.target.value }))}
                          onBlur={() => saveResponse(q.id)}
                          placeholder="Notes consultant (contexte, ton, hésitations...)"
                          className="w-full bg-transparent text-[#888884] text-xs placeholder:text-[#c8c8c6] focus:outline-none"
                        />
                      </div>

                      {/* Footer */}
                      <div className="border-t border-[#f0efec] px-5 py-2.5 flex items-center justify-end gap-3">
                        {saved[q.id] && (
                          <span className="text-xs text-green-600">Enregistré ✓</span>
                        )}
                        <button
                          onClick={() => saveResponse(q.id)}
                          disabled={saving[q.id]}
                          className="text-xs text-[#888884] hover:text-[#111110] transition-colors disabled:opacity-50"
                        >
                          {saving[q.id] ? 'Enregistrement...' : 'Enregistrer'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

        {/* Navigation blocs */}
        <div className="flex justify-between pt-4">
          {activeBloc !== 'B1' && (
            <button
              onClick={() => setActiveBloc(prev => String.fromCharCode(prev.charCodeAt(0), parseInt(prev[1]) - 1 + 48).replace(/\d/, String(parseInt(prev[1]) - 1)))}
              className="text-sm text-[#888884] hover:text-[#111110] transition-colors flex items-center gap-1"
            >
              ← Bloc précédent
            </button>
          )}
          <div className="flex-1" />
          {activeBloc !== 'B4' && (
            <button
              onClick={() => setActiveBloc(`B${parseInt(activeBloc[1]) + 1}`)}
              className="text-sm text-[#111110] hover:text-[#c9a84c] transition-colors flex items-center gap-1 font-medium"
            >
              Bloc suivant →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
