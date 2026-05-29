import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

    // Get user profile
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    // Get memory/narrative
    const { data: memory } = await supabase
      .from('memory')
      .select('*')
      .eq('user_id', userId)
      .single()

    // Get last 20 sessions for pattern analysis
    const { data: sessions } = await supabase
      .from('sessions')
      .select('emotional_state, check_in_hour, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Analyze patterns
    const totalSessions = sessions?.length || 0
    const states = sessions?.map(s => s.emotional_state).filter(Boolean) || []
    const hours = sessions?.map(s => s.check_in_hour).filter(s => s !== null) || []

    const stateCounts = states.reduce((acc: Record<string, number>, s) => {
      acc[s] = (acc[s] || 0) + 1
      return acc
    }, {})

    const avgHour = hours.length
      ? Math.round(hours.reduce((a, b) => a + b, 0) / hours.length)
      : null

    const mostCommonState = Object.entries(stateCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null

    const spiralCount = stateCounts['spiral'] || 0
    const crisisCount = stateCounts['crisis'] || 0
    const fogCount = stateCounts['fog'] || 0

    return NextResponse.json({
      user,
      memory,
      stats: {
        totalSessions,
        avgHour,
        mostCommonState,
        spiralCount,
        crisisCount,
        fogCount,
        stateCounts
      }
    })

  } catch (err) {
    console.error('Profile error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
