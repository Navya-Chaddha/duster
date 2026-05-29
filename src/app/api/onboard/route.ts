import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, studying, life_goal, bad_week, tried_before, crash_time, good_tomorrow, userId } = body

    if (!name || !studying || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Use upsert so re-onboarding never breaks
    const { data, error } = await supabase
      .from('users')
      .upsert({
        id: userId,
        name,
        studying,
        life_goal,
        bad_week,
        tried_before,
        crash_time,
        good_tomorrow
      }, { onConflict: 'id' })
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ userId: data.id })

  } catch (err) {
    console.error('Onboarding error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
