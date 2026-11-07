import { router, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { Screen } from '@/components/Screen'
import { useCreateStockMovement } from '@/features/inventory/hooks'
import { colors } from '@/theme'

const movementOptions = [
  { type: 'received', label: 'Received', sign: 1 },
  { type: 'dispensed', label: 'Dispensed', sign: -1 },
  { type: 'damaged', label: 'Damaged', sign: -1 },
  { type: 'expired', label: 'Expired', sign: -1 },
] as const

export default function RecordMovement() {
  const { itemId } = useLocalSearchParams<{ itemId: string }>()
  const createMovement = useCreateStockMovement()
  const [movementType, setMovementType] =
    useState<(typeof movementOptions)[number]['type']>('received')
  const [quantity, setQuantity] = useState('')
  const [reason, setReason] = useState('')
  const selected =
    movementOptions.find((option) => option.type === movementType) ?? movementOptions[0]

  async function submit() {
    const amount = Number(quantity)
    if (!itemId || !amount || amount < 1)
      return Alert.alert('Quantity required', 'Enter a quantity greater than zero.')
    if (!reason.trim())
      return Alert.alert('Reason required', 'Add a short reason for this movement.')
    try {
      await createMovement.mutateAsync({
        itemId,
        movementType,
        quantityDelta: amount * selected.sign,
        reason,
      })
      Alert.alert('Movement recorded', 'Inventory has been updated.', [
        { text: 'Done', onPress: () => router.back() },
      ])
    } catch (error) {
      Alert.alert(
        'Could not record movement',
        error instanceof Error ? error.message : 'Try again.',
      )
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>Stock movement</Text>
        <Text style={styles.title}>Record a movement</Text>
        <Text style={styles.copy}>Every change creates an immutable movement history entry.</Text>
        <Text style={styles.label}>Movement type</Text>
        <View style={styles.options}>
          {movementOptions.map((option) => (
            <Pressable
              key={option.type}
              onPress={() => setMovementType(option.type)}
              style={[styles.option, movementType === option.type ? styles.selected : null]}
            >
              <Text
                style={[
                  styles.optionText,
                  movementType === option.type ? styles.selectedText : null,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.label}>Quantity</Text>
        <TextInput
          keyboardType="number-pad"
          onChangeText={setQuantity}
          placeholder="0"
          placeholderTextColor="#8BA099"
          style={styles.input}
          value={quantity}
        />
        <Text style={styles.label}>Reason</Text>
        <TextInput
          onChangeText={setReason}
          placeholder="e.g. Received from supplier"
          placeholderTextColor="#8BA099"
          style={styles.input}
          value={reason}
        />
        <Pressable disabled={createMovement.isPending} onPress={submit} style={styles.button}>
          <Text style={styles.buttonText}>
            {createMovement.isPending ? 'Saving...' : 'Save movement'}
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
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: {
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  selected: { backgroundColor: '#E9F7EF', borderColor: colors.green },
  optionText: { color: colors.muted, fontSize: 13, fontWeight: '800' },
  selectedText: { color: colors.green },
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
