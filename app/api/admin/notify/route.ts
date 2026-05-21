// app/api/admin/notify/route.ts
// Sends a push notification via OneSignal to a specific user
// Called when admin updates order status

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID!
const ONESIGNAL_API_KEY = process.env.ONESIGNAL_REST_API_KEY!
const ADMIN_IDS = (process.env.ADMIN_CLERK_USER_IDS ?? '').split(',').map(s => s.trim())

export async function POST(req: NextRequest) {
  // Auth guard
  const { userId } = await auth()
  if (!userId || !ADMIN_IDS.includes(userId)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { userId: targetUserId, title, message, data } = await req.json()

  if (!title || !message) {
    return NextResponse.json({ error: 'title and message required' }, { status: 400 })
  }

  // OneSignal API — target by external_id (your user_id / clerk_id)
  const payload = {
    app_id: ONESIGNAL_APP_ID,
    headings: { en: title },
    contents: { en: message },
    // Filter by external_user_id which you set when users log in:
    // OneSignal.login(clerkUserId) in your frontend
    ...(targetUserId
      ? { include_aliases: { external_id: [targetUserId] }, target_channel: 'push' }
      : { included_segments: ['All'] }
    ),
    data: data ?? {},
    web_url: `https://mediora.fit/orders`,
    chrome_web_icon: 'https://mediora.fit/icons/icon-192x192.png',
    firefox_icon: 'https://mediora.fit/icons/icon-192x192.png',
  }

  try {
    const res = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${ONESIGNAL_API_KEY}`,
      },
      body: JSON.stringify(payload),
    })
    const result = await res.json()
    if (!res.ok) throw new Error(result.errors?.join(', ') ?? 'OneSignal error')
    return NextResponse.json({ success: true, id: result.id })
  } catch (err) {
    console.error('OneSignal error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
