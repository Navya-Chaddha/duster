import { NextRequest, NextResponse } from 'next/server'
import { groq } from '@/lib/groq'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json()
    const { data: sessions } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)
    if (!sessions || sessions.length < 2) {
      return NextResponse.json({ message: 'Not enough sessions yet' })
    }
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    const checkInHours = sessions.map((s: {check_in_hour: number}) => s.check_in_hour).filter(Boolean)
    const avgHour = Math.round(checkInHours.reduce((a: number, b: number) => a + b, 0) / checkInHours.length)
    const states = sessions.map((s: {emotional_state: string}) => s.emotional_state)
    const spiralCount = states.filter((s: string) => s === 'spiral').length
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: `Write a 4-5 sentence mentor briefing about ${user?.name}, studying ${user?.studying}, goal: ${user?.life_goal}. Patterns: avg check-in at ${avgHour}:00, ${spiralCount} spiral episodes in last 10 sessions, states: ${states.join(', ')}. Be specific, not generic.` }],
      max_tokens: 200,
      temperature: 0.5,
    })
    const narrative = completion.choices[0]?.message?.content || ''
    await supabase.from('memory').upsert({
      user_id: userId,
      narrative,
      pattern_summary: `Avg check-in: ${avgHour}:00 | Spirals: ${spiralCount}/10`,
      last_updated: new Date().toISOString()
    }, { onConflict: 'user_id' })
    return NextResponse.json({ narrative })
  } catch (err) {
    console.error('Memory error:', err)
    return NextResponse.json({ error: 'Memory update failed' }, { status: 500 })
  }
}
