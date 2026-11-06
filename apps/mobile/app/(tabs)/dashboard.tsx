import { Link } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Screen } from '@/components/Screen'
import { colors } from '@/theme'

export default function Dashboard() {
  return (
    <Screen>
      <Text style={styles.eyebrow}>Pharmacy operations</Text>
      <Text style={styles.title}>Good morning, team.</Text>
      <Text style={styles.subtitle}>Keep every shelf visible, countable, and ready for the next patient.</Text>
      <View style={styles.hero}>
        <Text style={styles.heroLabel}>FIRST WORKFLOW</Text>
        <Text style={styles.heroTitle}>Inventory that staff can trust.</Text>
        <Text style={styles.heroCopy}>Capture stock manually or photograph a shelf for a reviewable AI suggestion.</Text>
      </View>
      <Link href="/(tabs)/inventory" asChild>
        <Pressable style={styles.primaryButton}><Text style={styles.primaryText}>Open inventory</Text></Pressable>
      </Link>
    </Screen>
  )
}

const styles = StyleSheet.create({
  eyebrow: { color: colors.green, fontSize: 12, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' },
  title: { color: colors.ink, fontSize: 34, fontWeight: '900', marginTop: 12 },
  subtitle: { color: colors.muted, fontSize: 16, lineHeight: 24, marginTop: 10 },
  hero: { backgroundColor: colors.green, borderRadius: 24, marginTop: 28, padding: 24 },
  heroLabel: { color: colors.mint, fontSize: 11, fontWeight: '900', letterSpacing: 2 },
  heroTitle: { color: '#FFFFFF', fontSize: 25, fontWeight: '900', marginTop: 12 },
  heroCopy: { color: '#D8F3E5', fontSize: 15, lineHeight: 23, marginTop: 10 },
  primaryButton: { alignItems: 'center', backgroundColor: colors.mint, borderRadius: 16, marginTop: 18, padding: 16 },
  primaryText: { color: colors.green, fontSize: 16, fontWeight: '900' },
})
