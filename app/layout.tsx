import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'

export const metadata: Metadata = {
  title: 'A Billion Testimonies',
  description: 'Share your testimony with the world',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans overflow-x-hidden">
        {children}
        <Toaster />
      </body>
    </html>
  )
}
