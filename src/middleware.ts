import { NextResponse } from 'next/server';

export async function middleware() {
  const res = NextResponse.next();
  // Supabase client does not support cookies in middleware easily; you may need to handle auth manually here if needed.
  // For now, this is left as a placeholder for custom logic.
  return res;
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
