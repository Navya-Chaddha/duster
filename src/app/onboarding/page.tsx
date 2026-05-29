'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getUser } from '@/lib/auth'

const QUESTIONS = [
  { key: 'name', question: "Hey. What's your name?", placeholder: "Type your name..." },
  { key: 'studying', question: "What are you studying, and what do you want to do with your life?", placeholder: "e.g. CS, want to build something that matters..." },
  { key: 'bad_week', question: "What does a bad week look like for you? Be honest.", placeholder: "e.g. doom scroll till 3 AM, skip everything, feel terrible..." },
  { key: 'tried_before', question: "What have you tried before to fix this — that didn't work?", placeholder: "e.g. Notion, Pomodoro, motivational YouTube..." },
  { key: 'crash_time', question: "When do you usually spiral? What triggers it?", placeholder: "e.g. Sunday nights, after a bad exam, comparison..." },
  { key: 'good_tomorrow', question: "Last one. What would a genuinely good tomorrow look like?", placeholder: "e.g. Wake at 8, finish one real thing, not feel guilty..." }
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [messages, setMessages] = useState([{ from: 'duster', text: "Hey. What's your name?" }])
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getUser().then(user => {
      if (!user) { router.push('/auth/login'); return }
      setUserId(user.id)
    })
  }, [router])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    inputRef.current?.focus()
  }, [messages])

  async function handleSubmit() {
    if (!input.trim() || !userId) return
    const key = QUESTIONS[step].key
    const newAnswers = { ...answers, [key]: input.trim() }
    setAnswers(newAnswers)
    const newMessages = [...messages, { from: 'user', text: input.trim() }]

    if (step < QUESTIONS.length - 1) {
      setMessages([...newMessages, { from: 'duster', text: QUESTIONS[step + 1].question }])
      setStep(step + 1)
      setInput('')
    } else {
      setMessages([...newMessages, { from: 'duster', text: "Got it. That's enough to actually help you. Let's go." }])
      setLoading(true)
      setInput('')
      const res = await fetch('/api/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newAnswers, life_goal: newAnswers.studying, userId })
      })
      const data = await res.json()
      if (data.userId) setTimeout(() => router.push('/chat'), 1000)
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit() }
  }

  const progress = (step / QUESTIONS.length) * 100

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      {/* Progress */}
      <div className="h-px w-full" style={{ background: 'var(--border)' }}>
        <div
          className="h-full transition-all duration-700 ease-out"
          style={{ width: `${progress}%`, background: 'var(--accent)' }}
        />
      </div>

      {/* Header */}
      <div className="px-5 py-4 flex items-center gap-2">
        <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: 'var(--accent)' }}>
          <span className="text-xs font-bold" style={{ color: 'var(--bg)', fontFamily: 'DM Mono, monospace' }}>D</span>
        </div>
        <span className="text-xs font-medium tracking-widest uppercase" style={{ color: 'var(--accent)', fontFamily: 'DM Mono, monospace' }}>Duster</span>
        <span className="ml-auto text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>{step + 1}/{QUESTIONS.length}</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 max-w-lg mx-auto w-full">
        <div className="space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className="max-w-xs px-4 py-3 rounded-2xl text-sm leading-relaxed"
                style={msg.from === 'duster' ? {
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  borderRadius: '4px 18px 18px 18px',
                  fontFamily: 'DM Mono, monospace',
                  fontSize: '13px'
                } : {
                  background: 'var(--accent)',
                  color: 'var(--bg)',
                  borderRadius: '18px 4px 18px 18px',
                }}
              >
                {msg.text}
              </div>
            </div>
          ))}
        </div>
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-4 max-w-lg mx-auto w-full" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex gap-3 items-end">
          <textarea
            ref={inputRef}
            className="flex-1 rounded-xl px-4 py-3 text-sm resize-none outline-none transition-all"
            style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
              minHeight: '44px',
              maxHeight: '120px'
            }}
            placeholder={QUESTIONS[step]?.placeholder}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            rows={1}
            disabled={loading}
          />
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || loading}
            className="rounded-xl px-4 py-3 text-sm font-medium transition-all disabled:opacity-30"
            style={{ background: 'var(--accent)', color: 'var(--bg)', minWidth: '44px' }}
          >
            →
          </button>
        </div>
        <p className="text-xs mt-2 text-center" style={{ color: 'var(--text-muted)' }}>Enter to send</p>
      </div>
    </div>
  )
}
