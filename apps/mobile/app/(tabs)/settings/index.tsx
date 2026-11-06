import { StyleSheet, Text } from 'react-native'
import { Screen } from '@/components/Screen'
import { colors } from '@/theme'

export default function Settings() {
  return (
    <Screen>
      <Text style={styles.eyebrow}>Workspace</Text>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.copy}>Authentication, pharmacy roles, audit exports, and SMS preferences will be enabled after the production services are connected.</Text>
    </Screen>
  )
}

const styles = StyleSheet.create({
  eyebrow: { color: colors.green, fontSize: 12, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' },
  title: { color: colors.ink, fontSize: 34, fontWeight: '900', marginTop: 10 },
  copy: { color: colors.muted, fontSize: 16, lineHeight: 24, marginTop: 12 },
})
