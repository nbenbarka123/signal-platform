import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { exchangeCodeForTokens } from '@/lib/google/calendar'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state') // userId
  const error = searchParams.get('error')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  if (error || !code) {
    return NextResponse.redirect(`${appUrl}/settings?error=google_denied`)
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.id !== state) {
    return NextResponse.redirect(`${appUrl}/settings?error=auth_mismatch`)
  }

  const tokens = await exchangeCodeForTokens(code)

  if (tokens.error) {
    return NextResponse.redirect(`${appUrl}/settings?error=token_exchange`)
  }

  await supabase
    .from('profiles')
    .update({ google_refresh_token: tokens.refresh_token })
    .eq('id', user.id)

  return NextResponse.redirect(`${appUrl}/settings?success=google_connected`)
}
