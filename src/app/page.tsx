'EOF'
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const userId = localStorage.getItem('duster_user_id')
    if (userId) {
      router.push('/chat')
    } else {
      router.push('/onboarding')
    }
  }, [router])

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="text-violet-400 text-sm">Loading...</div>
    </div>
  )
}