import { NextResponse } from 'next/server'

export function errorResponse(error: unknown) {
  if (error instanceof Error && error.message === 'UNAUTHORIZED') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const message = error instanceof Error ? error.message : 'Unexpected server error'
  console.error(error)
  return NextResponse.json({ error: message }, { status: 500 })
}
