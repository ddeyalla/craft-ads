import { NextResponse } from 'next/server';

// Stub signout route: redirect to dashboard without auth logic
export async function GET(request: Request) {
  return NextResponse.redirect(new URL('/dashboard', request.url));
}
