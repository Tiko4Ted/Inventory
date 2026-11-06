import type { PropsWithChildren } from 'react'
import { SafeAreaView, StyleSheet, View } from 'react-native'
import { colors } from '@/theme'

export function Screen({ children }: PropsWithChildren) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>{children}</View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.paper },
  container: { flex: 1, padding: 20 },
})
