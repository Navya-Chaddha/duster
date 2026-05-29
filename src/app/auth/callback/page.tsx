'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AuthCallback() {
  const router = useRouter()
  useEffect(() => { router.replace('/') }, [router])
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="text-violet-400 text-sm">Loading...</div>
    </div>
  )
}
