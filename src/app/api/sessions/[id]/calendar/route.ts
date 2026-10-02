import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { refreshAccessToken, createCalendarEvent } from '@/lib/google/calendar'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Charger session + entreprise
  const { data: session } = await supabase
    .from('sessions')
    .select('*, company:companies(nom, email_dirigeant)')
    .eq('id', sessionId)
    .eq('consultant_id', user.id)
    .single()

  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

  if (!session.date_session) {
    return NextResponse.json({ error: 'Session has no date' }, { status: 400 })
  }

  // Charger le token Google
  const { data: profile } = await supabase
    .from('profiles')
    .select('google_refresh_token')
    .eq('id', user.id)
    .single()

  if (!profile?.google_refresh_token) {
    return NextResponse.json({ error: 'Google Calendar not connected' }, { status: 400 })
  }

  try {
    const accessToken = await refreshAccessToken(profile.google_refresh_token)

    const event = await createCalendarEvent(accessToken, {
      title: `Session CEO — ${session.company?.nom ?? 'Entreprise'}`,
      description: `Session SIGNAL par Djin\n\nEntreprise : ${session.company?.nom}\n${session.notes_prep ? `\nNotes : ${session.notes_prep}` : ''}`,
      startDatetime: session.date_session,
      durationMinutes: session.duree_minutes ?? 120,
      attendeeEmail: session.company?.email_dirigeant ?? undefined,
    })

    // Sauvegarder le lien Google Calendar dans agenda_events
    await supabase.from('agenda_events').upsert({
      session_id: sessionId,
      consultant_id: user.id,
      google_event_id: event.id,
      titre: `Session CEO — ${session.company?.nom}`,
      description: event.htmlLink, // store link in description field
      date_debut: session.date_session,
      date_fin: new Date(
        new Date(session.date_session).getTime() + (session.duree_minutes ?? 120) * 60000
      ).toISOString(),
    }, { onConflict: 'session_id' })

    return NextResponse.json({ success: true, eventLink: event.htmlLink })
  } catch (err) {
    console.error('Google Calendar error:', err)
    return NextResponse.json({ error: 'Failed to create calendar event' }, { status: 500 })
  }
}
