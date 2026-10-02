import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SIGNAL — Plateforme de sessions CEO',
  description: 'La méthode pour transformer l\'IA en résultats concrets.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
