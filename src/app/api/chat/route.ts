import { NextRequest, NextResponse } from 'next/server'
import { groq, buildSystemPrompt, detectEmotionalState, isLateNight } from '@/lib/groq'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { messages, userId } = await req.json()
    if (!userId || !messages?.length) {
      return NextResponse.json({ error: 'Missing userId or messages' }, { status: 400 })
    }
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    const { data: memory } = await supabase
      .from('memory')
      .select('narrative, pattern_summary')
      .eq('user_id', userId)
      .single()
    const latestMessage = messages[messages.length - 1]?.content || ''
    const state = detectEmotionalState(latestMessage)
    const lateNight = isLateNight()
    let systemPrompt = buildSystemPrompt(user, memory?.narrative)
    if (lateNight) systemPrompt += '\n\nIMPORTANT: It is past 1 AM. Do NOT suggest any work tasks. Help them wind down without guilt.'
    if (state === 'crisis') systemPrompt += '\n\nIMPORTANT: This person is in real distress. Do not pivot to productivity. Gently mention talking to someone they trust.'
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      max_tokens: 300,
      temperature: 0.75,
    })
    const reply = completion.choices[0]?.message?.content || "I am here. Tell me what is going on."
    const hour = new Date().getHours()
    supabase.from('sessions').insert({
      user_id: userId,
      messages,
      emotional_state: state,
      action_suggested: reply.slice(0, 200),
      check_in_hour: hour
    }).then(() => {})
    return NextResponse.json({ reply, state, lateNight })
  } catch (err) {
    console.error('Chat error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
