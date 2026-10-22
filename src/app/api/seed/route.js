import { NextResponse } from 'next/navigation';
import { initDb } from '@/lib/db';

export async function GET() {
  try {
    await initDb();
    return Response.json({ success: true, message: 'Zorra Royals database seeded successfully' });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
