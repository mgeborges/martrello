import { BoardProvider } from '@/context/BoardContext'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Martrello - Organize Your Work Beautifully',
  description: 'A beautiful Trello clone for managing your projects with kanban boards, lists, and cards.',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <BoardProvider>
          {children}
        </BoardProvider>
      </body>
    </html>
  )
}
