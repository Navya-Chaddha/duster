'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn, signUp } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export default function AuthPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!email || !password) return
    setLoading(true)
    setError('')
    if (mode === 'signup') {
      if (!name.trim()) { setError('What should I call you?'); setLoading(false); return }
      const { data, error } = await signUp(email, password, name)
      if (error) { setError(error.message); setLoading(false); return }
      if (data.user) {
        const { data: existing } = await supabase.from('users').select('id').eq('id', data.user.id).single()
        router.push(existing ? '/chat' : '/onboarding')
      }
    } else {
      const { data, error } = await signIn(email, password)
      if (error) { setError('Wrong email or password.'); setLoading(false); return }
      if (data.user) {
        const { data: existing } = await supabase.from('users').select('id').eq('id', data.user.id).single()
        router.push(existing ? '/chat' : '/onboarding')
      }
    }
    setLoading(false)
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSubmit()
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: 'var(--bg)' }}>
      {/* Grain overlay */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
        backgroundSize: '128px'
      }} />

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: 'var(--accent)' }}>
              <span className="text-xs font-bold" style={{ color: 'var(--bg)', fontFamily: 'DM Mono, monospace' }}>D</span>
            </div>
            <span className="text-sm font-medium tracking-widest uppercase" style={{ color: 'var(--accent)', fontFamily: 'DM Mono, monospace' }}>Duster</span>
          </div>
          <h1 className="text-2xl font-light mb-1" style={{ color: 'var(--text-primary)' }}>
            {mode === 'login' ? 'Welcome back.' : 'Let\'s meet.'}
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {mode === 'login' ? 'Your mentor remembers you.' : 'Your space. Private. Honest.'}
          </p>
        </div>

        {/* Form */}
        <div className="space-y-3">
          {mode === 'signup' && (
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={handleKey}
              className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={handleKey}
            className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
            style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
            }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={handleKey}
            className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
            style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
            }}
          />
          {error && (
            <p className="text-xs px-1" style={{ color: '#f87171' }}>{error}</p>
          )}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full rounded-xl px-4 py-3 text-sm font-medium transition-all disabled:opacity-40"
            style={{ background: 'var(--accent)', color: 'var(--bg)' }}
          >
            {loading ? '...' : mode === 'login' ? 'Log in' : 'Create account'}
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>or</span>
          <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
        </div>

        <p className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>
          {mode === 'login' ? "New here? " : 'Already have an account? '}
          <button
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }}
            className="transition-colors"
            style={{ color: 'var(--accent)' }}
          >
            {mode === 'login' ? 'Sign up' : 'Log in'}
          </button>
        </p>

        <p className="text-center text-xs mt-8 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Not a productivity app.<br />Not a therapist. Something more honest.
        </p>
      </div>
    </div>
  )
}
