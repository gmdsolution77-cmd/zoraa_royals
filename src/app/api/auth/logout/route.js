import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('zorra_session');
    cookieStore.delete('vegas_session');
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
