import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useState } from 'react'
import NetInfo from '@react-native-community/netinfo'
import { useEffect } from 'react'
import { AuthShell } from '@/auth/AuthShell'
import { flushPendingPhotos } from '@/lib/photo-processor'

function PhotoQueueProcessor() {
  useEffect(() => {
    void flushPendingPhotos()
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected) void flushPendingPhotos()
    })
    return unsubscribe
  }, [])

  return null
}

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <AuthShell>
        <PhotoQueueProcessor />
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }} />
      </AuthShell>
    </QueryClientProvider>
  )
}
