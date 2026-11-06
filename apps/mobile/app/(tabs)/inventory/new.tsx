import { router } from 'expo-router'
import { useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput } from 'react-native'
import { Screen } from '@/components/Screen'
import { useCreateInventoryItem } from '@/features/inventory/hooks'
import { colors } from '@/theme'

export default function NewInventoryItem() {
  const createItem = useCreateInventoryItem()
  const [name, setName] = useState('')
  const [unit, setUnit] = useState('packs')
  const [quantity, setQuantity] = useState('0')
  const [minimum, setMinimum] = useState('0')
  const [expiryDate, setExpiryDate] = useState('')

  async function submit() {
    if (!name.trim()) return Alert.alert('Product name required', 'Enter the name printed on the product.')
    try {
      await createItem.mutateAsync({ name, unit, currentQuantity: Number(quantity), minimumQuantity: Number(minimum), ...(expiryDate ? { expiryDate } : {}) })
      Alert.alert('Saved', 'The inventory item has been recorded.', [{ text: 'Done', onPress: () => router.back() }])
    } catch (error) {
      Alert.alert('Could not save', error instanceof Error ? error.message : 'Try again.')
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>Manual capture</Text>
        <Text style={styles.title}>Add inventory item</Text>
        <Text style={styles.subtitle}>Use this form whenever the shelf image is unclear or a new product arrives.</Text>
        <Text style={styles.label}>Product name</Text>
        <TextInput value={name} onChangeText={setName} placeholder="e.g. Depo-Provera 150 mg" style={styles.input} />
        <Text style={styles.label}>Unit</Text>
        <TextInput value={unit} onChangeText={setUnit} placeholder="packs, boxes, vials" style={styles.input} />
        <Text style={styles.label}>Opening quantity</Text>
        <TextInput keyboardType="number-pad" value={quantity} onChangeText={setQuantity} style={styles.input} />
        <Text style={styles.label}>Minimum quantity</Text>
        <TextInput keyboardType="number-pad" value={minimum} onChangeText={setMinimum} style={styles.input} />
        <Text style={styles.label}>Expiry date (YYYY-MM-DD, optional)</Text>
        <TextInput value={expiryDate} onChangeText={setExpiryDate} placeholder="2027-12-31" style={styles.input} />
        <Pressable disabled={createItem.isPending} onPress={submit} style={styles.button}>
          <Text style={styles.buttonText}>{createItem.isPending ? 'Saving…' : 'Save item'}</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  content: { paddingBottom: 30 },
  eyebrow: { color: colors.green, fontSize: 12, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' },
  title: { color: colors.ink, fontSize: 32, fontWeight: '900', marginTop: 10 },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 8 },
  label: { color: colors.ink, fontSize: 13, fontWeight: '800', marginBottom: 7, marginTop: 20 },
  input: { backgroundColor: colors.card, borderColor: colors.line, borderRadius: 14, borderWidth: 1, color: colors.ink, fontSize: 16, padding: 14 },
  button: { alignItems: 'center', backgroundColor: colors.green, borderRadius: 16, marginTop: 28, padding: 16 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
})
