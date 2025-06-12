// zkloginUtils.ts
import { SuiClient } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { genAddressSeed, generateNonce, generateRandomness, getZkLoginSignature } from '@mysten/sui/zklogin';

import {jwtDecode} from 'jwt-decode';
import { jwtToAddress } from '@mysten/sui/zklogin';


// 1. Generate ephemeral key pair
export async function generateEphemeralKeyPair() {
  
    const FULLNODE_URL = 'https://fullnode.testnet.sui.io'; // replace with the RPC URL you want to use
    const suiClient = new SuiClient({ url: FULLNODE_URL });
    const { epoch } = await suiClient.getLatestSuiSystemState();

    const maxEpoch = Number(epoch) + 2; // this means the ephemeral key will be active for 2 epochs from now.
    const ephemeralKeyPair= new Ed25519Keypair();
    const randomness = generateRandomness();
    const nonce = generateNonce(ephemeralKeyPair.getPublicKey(), maxEpoch, randomness);

    return {ephemeralKeyPair,nonce,maxEpoch,randomness};

}

// 2. Build OAuth login URL
export function buildOAuthLoginUrl(clientId: string, redirectUrl: string, nonce: string) {
  const params = new URLSearchParams({
    client_id:clientId,
    redirect_uri:redirectUrl,
    response_type:'id_token',
    scope:'openid',
    nonce:nonce,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

// 3. Decode JWT
export function decodeJwt(jwt: string) {
  const decodedJwt = jwtDecode(jwt) as JwtPayload;
  return decodedJwt;

}

export interface JwtPayload {
	iss?: string;
	sub?: string; //Subject ID
	aud?: string[] | string;
	exp?: number;
	nbf?: number;
	iat?: number;
	jti?: string;
}
// 4. Generate or retrieve user salt
export async function getUserSalt(jwt:string):Promise<string> {
  const response = await fetch('https://salt.api.mystenlabs.com/get_salt',{
    method:'POST',
    headers:{'Content-Type':"application/json"},
    body:JSON.stringify({token:jwt})
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch salt: ${response.statusText}`);
  }

  const salt = await response.json();
  return salt;

}

// 5. Generate Sui address
export function generateSuiAddress(jwt: string, salt: string) {
  return jwtToAddress(jwt,salt);

}

// 6. Request ZK proof
export async function requestZkProof(jwt: string, salt: string, publicKey: string) {
    const response = await fetch('https://prover.api.mystenlabs.com/v1/prove',{
      method:'POST',
      headers:{'Content-Type':"application/json"},
      body:JSON.stringify({
        jwt,
        salt,
        epehemeralPublicKey:publicKey
    }),
    });

    if (!response.ok) {
    throw new Error(`Failed to fetch ZK proof: ${response.statusText}`);
    }

    const proof = await response.json();
    return proof; 
}


// 7. Assemble zkLogin signature
export function assembleZkLoginSignature( 
    salt: string, 
    decodedJwt:{sub:string,aud:string}, 
    maxEpoch:number, 
    userSignature:string,
    partialZkLoginSignature:any) {
  const addressSeed = genAddressSeed(
    BigInt(salt),
    'sub',
    decodedJwt.sub,
    decodedJwt.aud,
  ).toString();

  return getZkLoginSignature({
    inputs:{
        ...partialZkLoginSignature,
        addressSeed,
    },
    maxEpoch,
    userSignature,
  });
}

