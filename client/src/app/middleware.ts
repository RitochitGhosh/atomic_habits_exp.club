import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const token = req.cookies.get('accessToken')?.value || req.headers.get('authorization')
  const { pathname } = req.nextUrl

  const isAuthPage = pathname === '/' || pathname.startsWith('/auth');
  console.log("Auth page: ", isAuthPage);

  if (!token) {
    // Not logged in, allow only "/" and "/auth/*"
    if (!isAuthPage) {
      return NextResponse.redirect(new URL('/', req.url))
    }
  } else {
    // Logged in, block "/" and "/auth/*"
    if (isAuthPage) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/auth/:path*', '/dashboard/:path*'],
}
