'use client'

import React, { useState } from 'react'
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import {
  generateEphemeralKeyPair,
  buildOAuthLoginUrl,
  decodeJwt,
  getUserSalt,
  generateSuiAddress,
  requestZkProof,
  assembleZkLoginSignature,
} from '@/utils/zkLogin';
import { SuiClient } from '@mysten/sui/client';
import { SignUpForm } from '@/components/register-form';


const page = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [jwt,setJwt] = useState<any|null>(null)
    const [salt,setSalt] = useState<any|null>(null)
    const [decoded, setDecoded] = useState<any | null>(null);

    useEffect(() => {

    const idToken = searchParams?.get('id_token');
    if (idToken) {
      setJwt(idToken);
      getUserSalt(idToken).then(setSalt);
      const decodedJwt = decodeJwt(idToken);
      setDecoded(decodedJwt);
    }
    },[searchParams,router]);

    const handleZkLogin = async () => {

    const suiClient = new SuiClient({ url: 'https://fullnode.testnet.sui.io' });
 
    const { ephemeralKeyPair, nonce, maxEpoch } = await generateEphemeralKeyPair();
    
    const oauthUrl = buildOAuthLoginUrl('1073061011224-er7dfcqpri84rq2mjno3u33a69im02h5.apps.googleusercontent.com', 'http://localhost:3000/auth/[id]/sign-up', nonce);
    window.location.href = oauthUrl;
    const suiAddress = generateSuiAddress(decoded, salt);
    console.log(suiAddress);

    // 6. Request ZK proof
    const zkProof = await requestZkProof(jwt, salt, ephemeralKeyPair.getPublicKey().toBase64());
    const zkLoginSignature = assembleZkLoginSignature(
        salt,
        { sub: decoded.sub, aud: decoded.aud },
        zkProof,
        ephemeralKeyPair.getPublicKey().toBase64(),
        maxEpoch
      );
      console.log(zkLoginSignature);
  };

  return (
    <SignUpForm handleZkLogin={handleZkLogin}/>
  )
}

export default page