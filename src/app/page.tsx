'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    async function check() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/auth/login'); return }
      const { data } = await supabase.from('users').select('id').eq('id', session.user.id).single()
      router.replace(data ? '/chat' : '/onboarding')
    }
    check()
  }, [router])

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="text-violet-400 text-sm">Loading...</div>
    </div>
  )
}
