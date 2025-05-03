import { NextResponse } from 'next/server';

// Stub auth callback: redirect to dashboard without Supabase
export async function GET(request: Request) {
  return NextResponse.redirect(new URL('/dashboard', request.url));
}
