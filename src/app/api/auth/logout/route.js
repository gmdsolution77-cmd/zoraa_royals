import { cookies } from 'next/headers';

export async function POST(req) {
  try {
    let body = {};
    try {
      body = await req.json();
    } catch (_) {}

    const referer = req.headers.get('referer') || '';
    const { searchParams } = new URL(req.url);
    const isAdmin = body.isAdminLogout || searchParams.get('admin') === 'true' || referer.includes('/admin');

    const cookieStore = await cookies();
    if (isAdmin) {
      cookieStore.delete('admin_session');
    } else {
      cookieStore.delete('zorra_session');
      cookieStore.delete('vegas_session');
    }
    return Response.json({ success: true, isAdminLoggedOut: isAdmin });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}

