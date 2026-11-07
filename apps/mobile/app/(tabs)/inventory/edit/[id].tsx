import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput } from 'react-native'
import { Screen } from '@/components/Screen'
import { useInventoryItem, useUpdateInventoryItem } from '@/features/inventory/hooks'
import { colors } from '@/theme'

export default function EditInventoryItem() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const itemQuery = useInventoryItem(id ?? '')
  const updateItem = useUpdateInventoryItem()
  const [name, setName] = useState('')
  const [sku, setSku] = useState('')
  const [category, setCategory] = useState('')
  const [unit, setUnit] = useState('')
  const [minimum, setMinimum] = useState('0')
  const [batch, setBatch] = useState('')
  const [expiry, setExpiry] = useState('')

  useEffect(() => {
    const item = itemQuery.data?.item
    if (!item) return
    setName(item.name)
    setSku(item.sku ?? '')
    setCategory(item.category ?? '')
    setUnit(item.unit)
    setMinimum(String(item.minimumQuantity))
    setBatch(item.batchNumber ?? '')
    setExpiry(item.expiryDate?.slice(0, 10) ?? '')
  }, [itemQuery.data?.item])

  async function submit() {
    if (!id || !name.trim() || !unit.trim())
      return Alert.alert('Missing details', 'Product name and unit are required.')
    try {
      await updateItem.mutateAsync({
        itemId: id,
        input: {
          name,
          sku: sku || undefined,
          category: category || undefined,
          unit,
          minimumQuantity: Number(minimum),
          batchNumber: batch || undefined,
          expiryDate: expiry || undefined,
        },
      })
      Alert.alert('Saved', 'Product details updated.', [
        { text: 'Done', onPress: () => router.back() },
      ])
    } catch (error) {
      Alert.alert('Could not update item', error instanceof Error ? error.message : 'Try again.')
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>Product details</Text>
        <Text style={styles.title}>Edit inventory item</Text>
        <Field
          label="Product name"
          value={name}
          onChangeText={setName}
          placeholder="Product name"
        />
        <Field label="SKU" value={sku} onChangeText={setSku} placeholder="Optional SKU" />
        <Field
          label="Category"
          value={category}
          onChangeText={setCategory}
          placeholder="Optional category"
        />
        <Field label="Unit" value={unit} onChangeText={setUnit} placeholder="packs, boxes, vials" />
        <Field
          label="Minimum quantity"
          value={minimum}
          onChangeText={setMinimum}
          placeholder="0"
          keyboardType="number-pad"
        />
        <Field
          label="Batch number"
          value={batch}
          onChangeText={setBatch}
          placeholder="Optional batch"
        />
        <Field
          label="Expiry date"
          value={expiry}
          onChangeText={setExpiry}
          placeholder="YYYY-MM-DD"
        />
        <Pressable disabled={updateItem.isPending} onPress={submit} style={styles.button}>
          <Text style={styles.buttonText}>
            {updateItem.isPending ? 'Saving...' : 'Save details'}
          </Text>
        </Pressable>
      </ScrollView>
    </Screen>
  )
}

function Field({
  label,
  ...props
}: {
  label: string
  value: string
  onChangeText: (value: string) => void
  placeholder: string
  keyboardType?: 'default' | 'number-pad'
}) {
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <TextInput placeholderTextColor="#8BA099" style={styles.input} {...props} />
    </>
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
  label: { color: colors.ink, fontSize: 13, fontWeight: '900', marginBottom: 7, marginTop: 20 },
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
