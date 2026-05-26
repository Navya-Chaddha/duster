'use client'

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white">
      <div className="max-w-md w-full px-6 py-8 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl text-center">
        <h1 className="text-2xl font-bold mb-2 text-violet-400">Welcome to Duster</h1>
        <p className="text-zinc-400 text-sm mb-6">Let's set up your profile to get started.</p>
        
        {/* Your onboarding form or buttons will go here */}
        <button className="w-full py-2.5 px-4 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-lg transition-colors text-sm">
          Get Started
        </button>
      </div>
    </div>
  )
}