import { StyleSheet, Text, View } from 'react-native'
import { Screen } from '@/components/Screen'
import { colors } from '@/theme'

export default function ClientsScreen() {
  return (
    <Screen>
      <Text style={styles.eyebrow}>Follow-up care</Text>
      <Text style={styles.title}>Clients</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Family-planning tracking is next.</Text>
        <Text style={styles.copy}>This space will hold consent-aware client records, return dates, and SMS reminders after the inventory workflow is validated.</Text>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  eyebrow: { color: colors.green, fontSize: 12, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' },
  title: { color: colors.ink, fontSize: 34, fontWeight: '900', marginTop: 10 },
  card: { backgroundColor: colors.card, borderColor: colors.line, borderRadius: 20, borderWidth: 1, marginTop: 24, padding: 18 },
  cardTitle: { color: colors.ink, fontSize: 17, fontWeight: '900' },
  copy: { color: colors.muted, fontSize: 15, lineHeight: 23, marginTop: 8 },
})
