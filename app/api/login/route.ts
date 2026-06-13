import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { password } = body as { password?: string };

  const expectedPassword = process.env.PASSWORD;

  if (!password || !expectedPassword || password !== expectedPassword) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cookieStore = cookies();
  cookieStore.set('luna_auth', password, {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    // 30 days
    maxAge: 60 * 60 * 24 * 30,
  });

  return NextResponse.json({ ok: true });
}
