import { auth } from '@clerk/nextjs/server'
import { isLocalDevAuthEnabled } from './env'

export async function getActorId() {
  if (isLocalDevAuthEnabled()) return 'local-development-user'

  const { userId } = await auth()
  if (!userId) throw new Error('UNAUTHORIZED')
  return userId
}
