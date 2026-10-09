import { NextResponse } from 'next/server';

export async function middleware(request) {
  // Pass-through middleware since we use client cookies for Firebase Auth
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
