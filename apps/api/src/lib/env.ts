export function requireEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is required`)
  return value
}

export function isLocalDevAuthEnabled() {
  return process.env.ALLOW_LOCAL_DEV_AUTH === 'true' && (process.env.NODE_ENV !== 'production' || process.env.VERCEL_ENV === 'preview')
}
