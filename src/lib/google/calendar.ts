const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_CALENDAR_API = 'https://www.googleapis.com/calendar/v3'

export function getGoogleAuthUrl(userId: string) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly',
    access_type: 'offline',
    prompt: 'consent',
    state: userId,
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`
}

export async function exchangeCodeForTokens(code: string) {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
      grant_type: 'authorization_code',
    }),
  })
  return res.json() as Promise<{
    access_token: string
    refresh_token: string
    expires_in: number
    token_type: string
    error?: string
  }>
}

export async function refreshAccessToken(refreshToken: string) {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: 'refresh_token',
    }),
  })
  const data = await res.json()
  return data.access_token as string
}

export async function createCalendarEvent(
  accessToken: string,
  {
    title,
    description,
    startDatetime,
    durationMinutes,
    location,
    attendeeEmail,
  }: {
    title: string
    description?: string
    startDatetime: string
    durationMinutes: number
    location?: string
    attendeeEmail?: string
  }
) {
  const start = new Date(startDatetime)
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000)

  const body: Record<string, unknown> = {
    summary: title,
    description: description ?? '',
    start: { dateTime: start.toISOString() },
    end: { dateTime: end.toISOString() },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 60 },
        { method: 'email', minutes: 1440 },
      ],
    },
  }

  if (location) body.location = location
  if (attendeeEmail) {
    body.attendees = [{ email: attendeeEmail }]
  }

  const res = await fetch(`${GOOGLE_CALENDAR_API}/calendars/primary/events`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.message ?? 'Google Calendar error')
  }

  return res.json() as Promise<{ id: string; htmlLink: string }>
}

export async function listUpcomingEvents(accessToken: string, maxResults = 20) {
  const now = new Date().toISOString()
  const params = new URLSearchParams({
    timeMin: now,
    maxResults: String(maxResults),
    singleEvents: 'true',
    orderBy: 'startTime',
  })

  const res = await fetch(`${GOOGLE_CALENDAR_API}/calendars/primary/events?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!res.ok) return []

  const data = await res.json()
  return data.items ?? []
}
