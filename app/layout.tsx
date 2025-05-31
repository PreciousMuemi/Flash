

import type { Metadata } from 'next'
import './globals.css'
import WalletProviderWrapper from '@/components/WalletProvider'
import SwyptProviderWrapper from '@/components/SwyptProvider'


export const metadata: Metadata = {
  title: 'v0 App',
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
          <WalletProviderWrapper>
              {children}
          </WalletProviderWrapper>
          
        </body>
    </html>
    </SwyptProviderWrapper>
    
  )
}
