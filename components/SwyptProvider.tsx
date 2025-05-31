'use client'

import { CryptoProvider } from "swypt-checkout";

export default function SwyptProviderWrapper({ children }: { children: React.ReactNode }) {
    return(
        <CryptoProvider>
            {children}
        </CryptoProvider>
    )
}