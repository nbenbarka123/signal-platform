import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import SessionInterview from '@/components/sessions/SessionInterview'
import { BLOC_LABELS } from '@/types'
import Link from 'next/link'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: session }, { data: questions }, { data: responses }] = await Promise.all([
    supabase
      .from('sessions')
      .select('*, company:companies(*)')
      .eq('id', id)
      .single(),
    supabase
      .from('guide_questions')
      .select('*')
      .order('bloc')
      .order('ordre'),
    supabase
      .from('session_responses')
      .select('*')
      .eq('session_id', id),
  ])

  if (!session) notFound()

  // Grouper questions par bloc
  const blocs = ['B1', 'B2', 'B3', 'B4']
  const questionsByBloc = blocs.map(bloc => ({
    bloc,
    label: BLOC_LABELS[bloc],
    questions: questions?.filter(q => q.bloc === bloc) ?? [],
  }))

  // Map réponses par question_id
  const responsesMap = Object.fromEntries(
    (responses ?? []).map(r => [r.question_id, r])
  )

  return (
    <div className="min-h-screen bg-[#f5f4f0]">
      {/* Header */}
      <div className="bg-white border-b border-[#e8e7e4] px-8 py-4">
        <div className="flex items-center justify-between max-w-5xl">
          <div className="flex items-center gap-3">
            <Link href="/sessions" className="text-[#888884] hover:text-[#111110] transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-base font-semibold text-[#111110]">
                {session.company?.nom}
              </h1>
              <p className="text-xs text-[#888884]">
                Session CEO
                {session.date_session && ` · ${format(new Date(session.date_session), 'd MMM yyyy', { locale: fr })}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <SessionStatusSelect sessionId={id} currentStatus={session.statut} />
            {responses && responses.length > 0 && (
              <Link
                href={`/sessions/${id}/process`}
                className="bg-[#c9a84c] hover:bg-[#b8973b] text-[#111110] px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Analyser →
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Interview */}
      <div className="max-w-5xl px-8 py-8">
        <SessionInterview
          sessionId={id}
          questionsByBloc={questionsByBloc}
          responsesMap={responsesMap}
        />
      </div>
    </div>
  )
}

function SessionStatusSelect({ sessionId, currentStatus }: { sessionId: string; currentStatus: string }) {
  const statuses = [
    { value: 'planifiee', label: 'Planifiée', color: 'text-blue-600' },
    { value: 'en_cours', label: 'En cours', color: 'text-amber-600' },
    { value: 'traitee', label: 'Traitée', color: 'text-green-600' },
    { value: 'table_ronde', label: 'Table ronde', color: 'text-purple-600' },
  ]
  const current = statuses.find(s => s.value === currentStatus)
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full bg-[#f0efec] font-medium ${current?.color ?? 'text-gray-500'}`}>
      {current?.label ?? currentStatus}
    </span>
  )
}
