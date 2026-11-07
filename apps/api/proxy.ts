import { clerkMiddleware } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { isLocalDevAuthEnabled } from '@/lib/env'

const clerk = clerkMiddleware()

export default (...args: Parameters<typeof clerk>) => {
  if (isLocalDevAuthEnabled()) return NextResponse.next()
  return clerk(...args)
}

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)', '/(api|trpc)(.*)'],
}
