import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { getSessionUser } from '@/lib/auth';
import { notifyStaff } from '@/lib/notify';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Please sign in to request a payment method.' }, { status: 401 });
    }

    const body = await req.json();
    const methodName = String(body.methodName || body.name || '').trim();
    const details = String(body.details || body.note || '').trim();

    if (!methodName || methodName.length < 2) {
      return NextResponse.json({ success: false, error: 'Please enter the payment method you want to use (e.g. Cash App, Zelle).' }, { status: 400 });
    }

    const db = await getDb();
    const doc = {
      userId: session.id || session.userId,
      username: session.username,
      userEmail: (session.email || '').toLowerCase().trim(),
      methodName,
      details: details || '',
      status: 'pending',
      createdAt: new Date(),
    };

    await db.collection('payment_method_requests').insertOne(doc);

    notifyStaff({
      title: '💳 Player payment method request',
      message: `@${session.username || 'player'} (${session.email}) asked to add or use: ${methodName}${details ? `. Note: ${details}` : ''}`,
      type: 'payment_method_request',
      data: { url: '/admin' },
    });

    return NextResponse.json({
      success: true,
      message: 'Request sent. Support will review and add your preferred method when possible.',
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
