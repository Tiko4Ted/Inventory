import { StyleSheet, Text } from 'react-native'
import { colors } from '@/theme'

export function StatusBadge({ quantity, minimum }: { quantity: number; minimum: number }) {
  const status = quantity <= 0 ? 'Out of stock' : quantity <= minimum ? 'Low stock' : 'In stock'
  const color = quantity <= 0 ? colors.red : quantity <= minimum ? colors.amber : colors.green

  return <Text style={[styles.badge, { color, backgroundColor: `${color}18` }]}>{status}</Text>
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', borderRadius: 999, fontSize: 12, fontWeight: '800', paddingHorizontal: 10, paddingVertical: 6 },
})
