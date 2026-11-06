import { ClerkProvider, useAuth } from '@clerk/clerk-expo'
import * as SecureStore from 'expo-secure-store'
import { Redirect, usePathname } from 'expo-router'
import { PropsWithChildren, useEffect } from 'react'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { setTokenGetter } from '@/lib/api-client'
import { colors } from '@/theme'

const tokenCache = {
  async getToken(key: string) {
    return SecureStore.getItemAsync(key)
  },
  async saveToken(key: string, value: string) {
    return SecureStore.setItemAsync(key, value)
  },
}

function TokenBridge() {
  const { getToken } = useAuth()

  useEffect(() => {
    setTokenGetter(() => getToken())
    return () => setTokenGetter(null)
  }, [getToken])

  return null
}

function AuthGate({ children }: PropsWithChildren) {
  const { isLoaded, isSignedIn } = useAuth()
  const pathname = usePathname()

  if (!isLoaded) return <View style={styles.loading}><ActivityIndicator color={colors.green} /><Text style={styles.loadingText}>Loading account…</Text></View>
  if (!isSignedIn && pathname !== '/sign-in') return <Redirect href="/sign-in" />
  return children
}

export function AuthShell({ children }: PropsWithChildren) {
  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY
  if (!publishableKey) return children

  return <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}><TokenBridge /><AuthGate>{children}</AuthGate></ClerkProvider>
}

const styles = StyleSheet.create({
  loading: { alignItems: 'center', backgroundColor: colors.paper, flex: 1, justifyContent: 'center' },
  loadingText: { color: colors.muted, fontSize: 14, marginTop: 10 },
})
