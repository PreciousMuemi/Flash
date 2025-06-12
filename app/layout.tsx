import type { Metadata } from 'next'
import './globals.css'
import SwyptProviderWrapper from '@/components/SwyptProvider'


export const metadata: Metadata = {
  title: 'Flash Grants',
  description: 'Created with v0',
  generator: 'v0.dev',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <SwyptProviderWrapper>
      <html lang="en">
        <body>
              {children}
        </body>
    </html>
    </SwyptProviderWrapper>
    
  )
}
