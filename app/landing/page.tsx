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
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-8 relative">
      <div className="absolute top-4 left-4">
        <img 
          src='https://i.ibb.co/tdLHv3C/Minimalist-Hospital-and-Medical-Health-Logo-1.png' 
          alt="MedChain Logo" 
          width={150} 
          height={150}
          className="object-contain"
        />
      </div>
      
      <div className="text-center max-w-4xl">
        <h1 className="text-6xl font-bold mb-8 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
          Welcome to Flash Grants
        </h1>
        
        <div className="mb-12 h-24 flex items-center justify-center">
          <p className="text-2xl max-w-3xl leading-relaxed">
            {displayText}
            <span className="animate-pulse text-green-500 font-bold">|</span>
          </p>
        </div>
        
        <div className="space-y-4">
          <a href="/auth/[id]/sign-up">
            <button className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-4 px-12 rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
              Get Started
            </button>
          </a>
          
          <div className="flex justify-center space-x-8 mt-8 text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Blockchain Secured</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span>Privacy First</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
              <span>Research Ready</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-green-200 rounded-full opacity-10 animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-24 h-24 bg-blue-200 rounded-full opacity-10 animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-1/4 left-1/3 w-20 h-20 bg-purple-200 rounded-full opacity-10 animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>
    </div>
  )
}