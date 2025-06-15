'use client'

import { useState, useEffect } from "react"

export default function LandingPage() {
  const fullText = "Your fast grant issuing platform"
  const [displayText, setDisplayText] = useState("")
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)

  
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isDeleting && currentIndex < fullText.length) {
        // Typing forward
        setDisplayText(fullText.slice(0, currentIndex + 1))
        setCurrentIndex(currentIndex + 1)
      } else if (!isDeleting && currentIndex === fullText.length) {
        // Pause at end before restarting
        setTimeout(() => {
          setIsDeleting(true)
        }, 2000)
      } else if (isDeleting && currentIndex > 0) {
        // Deleting backward
        setDisplayText(fullText.slice(0, currentIndex - 1))
        setCurrentIndex(currentIndex - 1)
      } else if (isDeleting && currentIndex === 0) {
        // Reset to start typing again
        setIsDeleting(false)
      }
    }, isDeleting ? 30 : 80) // Faster deletion, slower typing

    return () => clearTimeout(timer)
    
  }, [currentIndex, isDeleting, fullText])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-gray-100 p-8 relative overflow-hidden">
      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900"></div>
      
      <div className="absolute top-4 left-4 z-10">
        
      </div>
      
      <div className="text-center max-w-4xl relative z-10">
        <h1 className="text-6xl font-bold mb-8 bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent drop-shadow-lg">
          Welcome to Flash Grants
        </h1>
        
        <div className="mb-12 h-24 flex items-center justify-center">
          <p className="text-2xl max-w-3xl leading-relaxed text-gray-200">
            {displayText}
            <span className="animate-pulse text-emerald-400 font-bold">|</span>
          </p>
        </div>
        
        <div className="space-y-4">
          <a href="/auth/[id]/sign-up">
            <button className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-semibold py-4 px-12 rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-emerald-500/25 border border-emerald-500/20">
              Get Started
            </button>
          </a>
          
          <div className="flex justify-center space-x-8 mt-8 text-sm text-gray-400">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-sm shadow-emerald-400/50"></div>
              <span>Blockchain Secured</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse shadow-sm shadow-cyan-400/50"></div>
              <span>Privacy First</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse shadow-sm shadow-blue-400/50"></div>
              <span>Research Ready</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-emerald-500/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-24 h-24 bg-cyan-500/10 rounded-full blur-xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-1/4 left-1/3 w-20 h-20 bg-blue-500/10 rounded-full blur-xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 right-1/3 w-28 h-28 bg-purple-500/8 rounded-full blur-xl animate-pulse" style={{animationDelay: '1.5s'}}></div>
      </div>
      
      {/* Subtle grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}
      ></div>
    </div>
  )
}