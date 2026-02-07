"use client"

import React, {ReactNode, useMemo} from 'react'
import {WalletAdapterNetwork} from "@solana/wallet-adapter-base" 
import {ConnectionProvider,WalletProvider} from "@solana/wallet-adapter-react"
import {WalletMultiButton, WalletModalProvider} from "@solana/wallet-adapter-react-ui"
import {PhantomWalletAdapter} from "@solana/wallet-adapter-wallets"
import { clusterApiUrl } from '@solana/web3.js'
import '@solana/wallet-adapter-react-ui/styles.css'

const WalletContextProvider = ({children}:{children:ReactNode}) => {
    const network = WalletAdapterNetwork.Devnet;
    const endpoint = useMemo(()=>clusterApiUrl(network),[network]);
    const wallets = useMemo(()=>[new PhantomWalletAdapter()],[])

    return (
    <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect={true}>
            <WalletModalProvider>
                <div className="min-h-screen bg-gray-100">
                    <div className='flex justify-between items-center bg-white shadow-sm px-5 py-5 border-b border-gray-300'>
                        <h1 className='text-4xl font-bold text-gray-800'>Soham's Notes DApp</h1>
                        <WalletMultiButton />
                    </div>
                    <main className='p-5'>{children}</main>
                </div>
            </WalletModalProvider>
        </WalletProvider>
    </ConnectionProvider>
  )
}

export default WalletContextProvider
