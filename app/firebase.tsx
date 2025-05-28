import { initializeApp } from "firebase/app"
import { getFirestore, collection, getDocs } from "firebase/firestore"
import { getAnalytics } from "firebase/analytics"
import type { Team, Grant } from "./types"

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCGfXY4qRGh1yS9oxSOolGarM0sEp0z7_w",
  authDomain: "flash-5565e.firebaseapp.com",
  projectId: "flash-5565e",
  storageBucket: "flash-5565e.firebasestorage.app",
  messagingSenderId: "40641862368",
  appId: "1:40641862368:web:e968939b286f1dec26ce85",
  measurementId: "G-2QGL13SVS8",
}

// Initialize Firebase
export const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const analytics = getAnalytics(app)

// Fetch teams from Firebase
export async function fetchTeams(): Promise<Team[]> {
  try {
    const teamsSnapshot = await getDocs(collection(db, "teams"))
    return teamsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Team)
  } catch (error) {
    console.error("Error fetching teams:", error)
    return []
  }
}

// Fetch grants from Firebase
export async function fetchGrants(): Promise<Grant[]> {
  try {
    const grantsSnapshot = await getDocs(collection(db, "grants"))
    return grantsSnapshot.docs.map(doc => ({ id:\
