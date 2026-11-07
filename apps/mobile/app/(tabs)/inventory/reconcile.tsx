import { router, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput } from 'react-native'
import { Screen } from '@/components/Screen'
import { useInventoryItem, useReconcileStock } from '@/features/inventory/hooks'
import { colors } from '@/theme'

export default function ReconcileStock() {
  const { itemId } = useLocalSearchParams<{ itemId: string }>()
  const itemQuery = useInventoryItem(itemId ?? '')
  const reconcile = useReconcileStock()
  const [counted, setCounted] = useState('')
  const [reason, setReason] = useState('')

  async function submit() {
    const countedQuantity = Number(counted)
    if (!itemId || !Number.isInteger(countedQuantity) || countedQuantity < 0)
      return Alert.alert('Count required', 'Enter a whole number of physically counted units.')
    if (!reason.trim())
      return Alert.alert('Reason required', 'Explain why the physical count differs.')
    try {
      await reconcile.mutateAsync({ itemId, countedQuantity, reason })
      Alert.alert('Stock reconciled', 'The adjustment has been recorded.', [
        { text: 'Done', onPress: () => router.back() },
      ])
    } catch (error) {
      Alert.alert(
        'Could not reconcile stock',
        error instanceof Error ? error.message : 'Try again.',
      )
    }
  }

  const expected = itemQuery.data?.item.currentQuantity
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>Physical count</Text>
        <Text style={styles.title}>Reconcile stock</Text>
        <Text style={styles.copy}>
          Expected stock is {expected ?? 'loading'} units. Enter the physical count and explain any
          difference.
        </Text>
        <Text style={styles.label}>Physical count</Text>
        <TextInput
          keyboardType="number-pad"
          onChangeText={setCounted}
          placeholder="0"
          placeholderTextColor="#8BA099"
          style={styles.input}
          value={counted}
        />
        <Text style={styles.label}>Reason</Text>
        <TextInput
          onChangeText={setReason}
          placeholder="e.g. Shelf count after closing"
          placeholderTextColor="#8BA099"
          style={styles.input}
          value={reason}
        />
        <Pressable disabled={reconcile.isPending} onPress={submit} style={styles.button}>
          <Text style={styles.buttonText}>
            {reconcile.isPending ? 'Saving...' : 'Save reconciliation'}
          </Text>
        </Pressable>
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  content: { paddingBottom: 30 },
  eyebrow: {
    color: colors.green,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  title: { color: colors.ink, fontSize: 32, fontWeight: '900', marginTop: 10 },
  copy: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 8 },
  label: { color: colors.ink, fontSize: 13, fontWeight: '900', marginBottom: 8, marginTop: 22 },
  input: {
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 16,
    padding: 14,
  },
  button: {
    alignItems: 'center',
    backgroundColor: colors.green,
    borderRadius: 16,
    marginTop: 28,
    padding: 16,
  },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
})
