import { Link, router, useLocalSearchParams } from 'expo-router'
import {
  Alert,
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { Screen } from '@/components/Screen'
import { StatusBadge } from '@/components/StatusBadge'
import {
  useArchiveInventoryItem,
  useInventoryItem,
  useInventoryMovements,
} from '@/features/inventory/hooks'
import { colors } from '@/theme'

export default function InventoryItemDetails() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const itemQuery = useInventoryItem(id ?? '')
  const movementsQuery = useInventoryMovements(id ?? '')
  const archive = useArchiveInventoryItem()
  const item = itemQuery.data?.item

  async function archiveItem() {
    if (!item) return
    Alert.alert(
      'Archive product?',
      'It will leave active inventory but its movement history will remain.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          style: 'destructive',
          onPress: async () => {
            await archive.mutateAsync(item.id)
            router.back()
          },
        },
      ],
    )
  }

  if (itemQuery.isLoading)
    return (
      <Screen>
        <ActivityIndicator color={colors.green} style={styles.loader} />
      </Screen>
    )
  if (!item)
    return (
      <Screen>
        <Text style={styles.error}>Product could not be found.</Text>
      </Screen>
    )

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>‹ Inventory</Text>
        </Pressable>
        <View style={styles.header}>
          <View style={styles.mark}>
            <Text style={styles.markText}>{item.name.slice(0, 1).toUpperCase()}</Text>
          </View>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>{item.name}</Text>
            <Text style={styles.meta}>
              {item.sku ?? 'No SKU'} · {item.category ?? 'Uncategorized'}
            </Text>
          </View>
        </View>
        <View style={styles.balance}>
          <View>
            <Text style={styles.balanceLabel}>Current stock</Text>
            <Text style={styles.balanceValue}>
              {item.currentQuantity} <Text style={styles.balanceUnit}>{item.unit}</Text>
            </Text>
          </View>
          <StatusBadge quantity={item.currentQuantity} minimum={item.minimumQuantity} />
        </View>
        <View style={styles.actionRow}>
          <Link
            href={{ pathname: '/(tabs)/inventory/movement', params: { itemId: item.id } }}
            asChild
          >
            <Pressable style={styles.primaryAction}>
              <Text style={styles.primaryText}>Record movement</Text>
            </Pressable>
          </Link>
          <Link
            href={{ pathname: '/(tabs)/inventory/reconcile', params: { itemId: item.id } }}
            asChild
          >
            <Pressable style={styles.secondaryAction}>
              <Text style={styles.secondaryText}>Reconcile</Text>
            </Pressable>
          </Link>
        </View>
        <View style={styles.actionRow}>
          <Link href={{ pathname: '/(tabs)/inventory/edit/[id]', params: { id: item.id } }} asChild>
            <Pressable style={styles.secondaryAction}>
              <Text style={styles.secondaryText}>Edit details</Text>
            </Pressable>
          </Link>
          <Pressable onPress={archiveItem} style={styles.secondaryAction}>
            <Text style={styles.dangerText}>Archive</Text>
          </Pressable>
        </View>
        <View style={styles.details}>
          <Detail label="Minimum stock" value={`${item.minimumQuantity} ${item.unit}`} />
          <Detail label="Batch" value={item.batchNumber ?? 'Not recorded'} />
          <Detail
            label="Expiry"
            value={
              item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'Not recorded'
            }
          />
        </View>
        <Text style={styles.sectionTitle}>Movement history</Text>
        {movementsQuery.isLoading ? (
          <ActivityIndicator color={colors.green} style={styles.loader} />
        ) : null}
        {movementsQuery.data?.movements.map((movement) => (
          <View key={movement.id} style={styles.movement}>
            <View>
              <Text style={styles.movementType}>{movement.movementType}</Text>
              <Text style={styles.movementReason}>{movement.reason}</Text>
              <Text style={styles.movementDate}>
                {new Date(movement.createdAt).toLocaleString()}
              </Text>
            </View>
            <Text
              style={[
                styles.delta,
                { color: movement.quantityDelta >= 0 ? colors.green : colors.red },
              ]}
            >
              {movement.quantityDelta >= 0 ? '+' : ''}
              {movement.quantityDelta}
            </Text>
          </View>
        ))}
        {movementsQuery.data?.movements.length === 0 ? (
          <Text style={styles.empty}>No movement history yet.</Text>
        ) : null}
      </ScrollView>
    </Screen>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detail}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  content: { paddingBottom: 40 },
  back: { color: colors.green, fontSize: 15, fontWeight: '900', marginBottom: 24 },
  loader: { marginTop: 30 },
  error: { color: colors.red, fontSize: 16 },
  header: { alignItems: 'center', flexDirection: 'row' },
  mark: {
    alignItems: 'center',
    backgroundColor: '#E9F7EF',
    borderRadius: 18,
    height: 58,
    justifyContent: 'center',
    width: 58,
  },
  markText: { color: colors.green, fontSize: 24, fontWeight: '900' },
  headerCopy: { flex: 1, marginLeft: 14 },
  title: { color: colors.ink, fontSize: 25, fontWeight: '900' },
  meta: { color: colors.muted, fontSize: 13, marginTop: 5 },
  balance: {
    alignItems: 'flex-end',
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 22,
    padding: 18,
  },
  balanceLabel: { color: colors.muted, fontSize: 13, fontWeight: '800' },
  balanceValue: { color: colors.ink, fontSize: 30, fontWeight: '900', marginTop: 4 },
  balanceUnit: { color: colors.muted, fontSize: 13, fontWeight: '700' },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  primaryAction: {
    alignItems: 'center',
    backgroundColor: colors.green,
    borderRadius: 14,
    flex: 1,
    padding: 14,
  },
  primaryText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  secondaryAction: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    padding: 14,
  },
  secondaryText: { color: colors.green, fontSize: 13, fontWeight: '900' },
  dangerText: { color: colors.red, fontSize: 13, fontWeight: '900' },
  details: { backgroundColor: '#E9F7EF', borderRadius: 18, marginTop: 20, padding: 16 },
  detail: { borderBottomColor: '#CAE9D7', borderBottomWidth: 1, paddingVertical: 10 },
  detailLabel: { color: colors.muted, fontSize: 12 },
  detailValue: { color: colors.ink, fontSize: 15, fontWeight: '800', marginTop: 3 },
  sectionTitle: { color: colors.ink, fontSize: 19, fontWeight: '900', marginTop: 26 },
  movement: {
    alignItems: 'center',
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  movementType: { color: colors.ink, fontSize: 14, fontWeight: '900', textTransform: 'capitalize' },
  movementReason: { color: colors.muted, fontSize: 13, marginTop: 3 },
  movementDate: { color: colors.muted, fontSize: 11, marginTop: 4 },
  delta: { fontSize: 20, fontWeight: '900' },
  empty: { color: colors.muted, marginTop: 14 },
})
