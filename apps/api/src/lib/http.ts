import { NextResponse } from 'next/server'

export function errorResponse(error: unknown) {
  if (error instanceof Error && error.message === 'UNAUTHORIZED') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (error instanceof Error && error.message === 'STOCK_CONFLICT') {
    return NextResponse.json(
      { error: 'Stock changed or would become negative. Refresh and try again.' },
      { status: 409 },
    )
  }

  const message = error instanceof Error ? error.message : 'Unexpected server error'
  console.error(error)
  return NextResponse.json({ error: message }, { status: 500 })
}
