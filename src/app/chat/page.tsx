'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Message = { role: 'user' | 'assistant'; content: string }
type State = 'crisis' | 'spiral' | 'fog' | 'normal'
type UserMemory = { narrative: string | null; pattern_summary: string | null }
type UserProfile = { name: string; studying: string; life_goal: string; bad_week: string; crash_time: string }
type SessionStat = { emotional_state: string; check_in_hour: number; created_at: string }

const STATE_CONFIG: Record<State, { label: string; color: string; dot: string }> = {
  crisis:  { label: 'here for you',          color: '#f87171', dot: '#f87171' },
  spiral:  { label: 'noticing a spiral',      color: '#fb923c', dot: '#fb923c' },
  fog:     { label: 'cutting through fog',    color: '#60a5fa', dot: '#60a5fa' },
  normal:  { label: 'listening',              color: '#8a7f74', dot: '#c9a96e' },
}

export default function ChatPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [userName, setUserName] = useState('')
  const [currentState, setCurrentState] = useState<State>('normal')
  const [showMenu, setShowMenu] = useState(false)
  const [showPanel, setShowPanel] = useState(false)
  const [ready, setReady] = useState(false)
  const [memory, setMemory] = useState<UserMemory | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [sessions, setSessions] = useState<SessionStat[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/auth/login'); return }
      setUserId(session.user.id)
      setUserName(session.user.user_metadata?.name || session.user.email?.split('@')[0] || '')
      setMessages([{ role: 'assistant', content: "Hey. What's going on?" }])
      setReady(true)

      const { data: p } = await supabase.from('users').select('name,studying,life_goal,bad_week,crash_time').eq('id', session.user.id).single()
      if (p) setProfile(p)
      const { data: m } = await supabase.from('memory').select('narrative,pattern_summary').eq('user_id', session.user.id).single()
      if (m) setMemory(m)
      const { data: s } = await supabase.from('sessions').select('emotional_state,check_in_hour,created_at').eq('user_id', session.user.id).order('created_at', { ascending: false }).limit(20)
      if (s) setSessions(s)
    }
    init()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) router.replace('/auth/login')
    })
    return () => subscription.unsubscribe()
  }, [router])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])
  useEffect(() => { if (!loading && ready) inputRef.current?.focus() }, [loading, ready])

  async function sendMessage() {
    if (!input.trim() || loading || !userId) return
    const userMessage: Message = { role: 'user', content: input.trim() }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, userId })
      })
      const data = await res.json()
      if (data.reply) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
        if (data.state) setCurrentState(data.state as State)
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: "Something went wrong. Try again." }])
    } finally { setLoading(false) }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const spiralCount = sessions.filter(s => s.emotional_state === 'spiral').length
  const lateNightCount = sessions.filter(s => s.check_in_hour >= 22 || s.check_in_hour <= 4).length
  const avgHour = sessions.length > 0 ? Math.round(sessions.reduce((a, s) => a + (s.check_in_hour || 0), 0) / sessions.length) : null
  function formatHour(h: number) { if (h === 0) return '12 AM'; if (h < 12) return `${h} AM`; if (h === 12) return '12 PM'; return `${h-12} PM` }
  function stateEmoji(s: string) { return s === 'crisis' ? '🔴' : s === 'spiral' ? '🟠' : s === 'fog' ? '🔵' : '🟢' }

  if (!ready) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="text-sm font-mono" style={{ color: 'var(--accent)' }}>loading...</div>
    </div>
  )

  const stateConf = STATE_CONFIG[currentState]

  return (
    <div className="min-h-screen flex flex-col relative" style={{ background: 'var(--bg)' }}>

      {/* Grain */}
      <div className="fixed inset-0 opacity-[0.025] pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        backgroundSize: '128px'
      }} />

      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between relative z-10" style={{ borderBottom: '1px solid var(--border)' }}>
        <button onClick={() => setShowPanel(true)} className="flex items-center gap-3 group">
          <div className="relative w-8 h-8 rounded-lg flex items-center justify-center transition-all" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <span className="text-xs font-bold" style={{ color: 'var(--accent)', fontFamily: 'DM Mono, monospace' }}>D</span>
            {/* State dot */}
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2" style={{ background: stateConf.dot, borderColor: 'var(--bg)' }} />
          </div>
          <div className="text-left">
            <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Duster</div>
            <div className="text-xs" style={{ color: stateConf.color, fontFamily: 'DM Mono, monospace' }}>{stateConf.label}</div>
          </div>
        </button>

        <div className="flex items-center gap-3">
          <button onClick={() => setShowPanel(true)} className="text-xs transition-colors hidden sm:block" style={{ color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>
            patterns →
          </button>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all"
              style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
            >
              {userName}
              <span style={{ color: 'var(--text-muted)' }}>▾</span>
            </button>
            {showMenu && (
              <div className="absolute right-0 top-10 rounded-xl overflow-hidden z-20 min-w-40" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <button onClick={() => { setShowPanel(true); setShowMenu(false) }} className="block w-full text-left px-4 py-3 text-sm transition-colors" style={{ color: 'var(--text-secondary)' }}>
                  My patterns
                </button>
                <div style={{ height: '1px', background: 'var(--border)' }} />
                <button onClick={async () => { await supabase.auth.signOut(); router.replace('/auth/login') }} className="block w-full text-left px-4 py-3 text-sm transition-colors" style={{ color: 'var(--text-secondary)' }}>
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-lg mx-auto w-full">
        <div className="space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-5 h-5 rounded flex items-center justify-center mr-2 mt-1 flex-shrink-0" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '9px', color: 'var(--accent)', fontFamily: 'DM Mono, monospace', fontWeight: 700 }}>D</span>
                </div>
              )}
              <div
                className="max-w-xs lg:max-w-sm px-4 py-3 text-sm leading-relaxed"
                style={msg.role === 'assistant' ? {
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  borderRadius: '4px 16px 16px 16px',
                  fontFamily: 'DM Mono, monospace',
                  fontSize: '13px',
                  lineHeight: '1.7'
                } : {
                  background: 'var(--accent)',
                  color: 'var(--bg)',
                  borderRadius: '16px 4px 16px 16px',
                  fontWeight: 500
                }}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="w-5 h-5 rounded flex items-center justify-center mr-2 mt-1" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '9px', color: 'var(--accent)', fontFamily: 'DM Mono, monospace', fontWeight: 700 }}>D</span>
              </div>
              <div className="px-4 py-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '4px 16px 16px 16px' }}>
                <div className="flex gap-1.5 items-center h-4">
                  {[0, 150, 300].map(delay => (
                    <div key={delay} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--accent-dim)', animationDelay: `${delay}ms` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        <div ref={bottomRef} />
      </div>

      {currentState === 'crisis' && (
        <div className="px-4 py-2 text-center" style={{ background: '#1a0a0a', borderTop: '1px solid #3a1515' }}>
          <p className="text-xs" style={{ color: '#f87171' }}>If you are in real distress, please reach out to someone you trust or a counsellor.</p>
        </div>
      )}

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
            placeholder="What's going on..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            rows={1}
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="rounded-xl px-4 py-3 text-sm font-medium transition-all disabled:opacity-30"
            style={{ background: 'var(--accent)', color: 'var(--bg)', minWidth: '48px' }}
          >
            →
          </button>
        </div>
        <p className="text-xs mt-2 text-center" style={{ color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>enter to send · shift+enter for new line</p>
      </div>

      {/* Knows You Panel */}
      {showPanel && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={() => setShowPanel(false)} />
          <div className="w-80 overflow-y-auto flex flex-col" style={{ background: 'var(--bg-card)', borderLeft: '1px solid var(--border)' }}>
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
              <div>
                <h2 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>What Duster knows</h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>built from your sessions</p>
              </div>
              <button onClick={() => setShowPanel(false)} className="text-xl leading-none" style={{ color: 'var(--text-muted)' }}>×</button>
            </div>

            <div className="flex-1 px-5 py-5 space-y-6">
              {profile && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>who you are</p>
                  <div className="rounded-xl p-4 space-y-2" style={{ background: 'var(--bg-input)', border: '1px solid var(--border)' }}>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{profile.name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{profile.studying}</p>
                    {profile.life_goal && <p className="text-xs italic" style={{ color: 'var(--accent)' }}>"{profile.life_goal}"</p>}
                  </div>
                </div>
              )}

              {sessions.length > 0 && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>your numbers</p>
                  <div className="space-y-2">
                    {[
                      avgHour !== null && { label: 'usually checks in at', value: formatHour(avgHour), color: 'var(--text-primary)' },
                      lateNightCount > 0 && { label: 'late night sessions', value: `${lateNightCount}×`, color: '#fb923c' },
                      spiralCount > 0 && { label: 'spiral episodes', value: `${spiralCount}×`, color: '#f97316' },
                      { label: 'total check-ins', value: `${sessions.length}`, color: 'var(--text-primary)' },
                    ].filter(Boolean).map((item: any, i) => (
                      <div key={i} className="flex items-center justify-between rounded-lg px-3 py-2.5" style={{ background: 'var(--bg-input)', border: '1px solid var(--border)' }}>
                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                        <span className="text-xs font-medium" style={{ color: item.color, fontFamily: 'DM Mono, monospace' }}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {memory?.narrative && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>what i've noticed</p>
                  <div className="rounded-xl p-4" style={{ background: '#1a1530', border: '1px solid #2d2660' }}>
                    <p className="text-xs leading-relaxed" style={{ color: '#a599f5', fontFamily: 'DM Mono, monospace' }}>{memory.narrative}</p>
                  </div>
                </div>
              )}

              {sessions.length > 0 && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>recent check-ins</p>
                  <div className="space-y-2">
                    {sessions.slice(0, 7).map((s, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-xs">{stateEmoji(s.emotional_state)}</span>
                        <span className="text-xs capitalize" style={{ color: 'var(--text-secondary)' }}>{s.emotional_state}</span>
                        <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>
                          {new Date(s.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {profile?.bad_week && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>your spiral triggers</p>
                  <div className="rounded-xl p-4" style={{ background: 'var(--bg-input)', border: '1px solid var(--border)' }}>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{profile.bad_week}</p>
                  </div>
                </div>
              )}

              {sessions.length === 0 && !memory && (
                <div className="text-center py-8">
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Nothing yet.</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Talk to Duster a few times and this fills up.</p>
                </div>
              )}
            </div>

            <div className="px-5 py-4" style={{ borderTop: '1px solid var(--border)' }}>
              <p className="text-xs text-center" style={{ color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>only visible to you</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
