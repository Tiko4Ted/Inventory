import * as ImagePicker from 'expo-image-picker'
import { Link, router } from 'expo-router'
import { useMemo, useState } from 'react'
import { useEffect } from 'react'
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { Screen } from '@/components/Screen'
import { StatusBadge } from '@/components/StatusBadge'
import { useInventoryItems } from '@/features/inventory/hooks'
import type { InventoryItem } from '@/features/inventory/types'
import { getPhotoQueueSummary, listReadyScans } from '@/lib/photo-queue'
import { colors } from '@/theme'

export default function InventoryScreen() {
  const inventory = useInventoryItems()
  const [actionsOpen, setActionsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [queueSummary, setQueueSummary] = useState({ pendingCount: 0, readyCount: 0 })

  useEffect(() => {
    const refresh = () => void getPhotoQueueSummary().then(setQueueSummary)
    refresh()
    const timer = setInterval(refresh, 5000)
    return () => clearInterval(timer)
  }, [])

  const items = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return inventory.data?.items ?? []
    return (inventory.data?.items ?? []).filter((item) =>
      [item.name, item.sku, item.category].some((value) => value?.toLowerCase().includes(query)),
    )
  }, [inventory.data?.items, search])

  async function takePhoto() {
    setActionsOpen(false)
    const permission = await ImagePicker.requestCameraPermissionsAsync()
    if (!permission.granted) {
      Alert.alert('Camera permission needed', 'Allow camera access to capture a pharmacy shelf.')
      return
    }

    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 })
    if (!result.canceled && result.assets[0]) {
      router.push({ pathname: '/(tabs)/inventory/review-scan', params: { imageUri: result.assets[0].uri } })
    }
  }

  function typeManually() {
    setActionsOpen(false)
    router.push('/(tabs)/inventory/new')
  }

  return (
    <Screen>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>Stock room</Text>
          <Text style={styles.title}>Inventory</Text>
        </View>
        <View style={styles.liveDot}><View style={styles.dot} /><Text style={styles.liveText}>Live</Text></View>
      </View>

      <View style={styles.summaryRow}>
        <SummaryCard label="Total items" value={String(inventory.data?.items.length ?? 0)} />
        <SummaryCard label="Low stock" value={String((inventory.data?.items ?? []).filter((item) => item.currentQuantity <= item.minimumQuantity).length)} tone="amber" />
        <SummaryCard label="Out" value={String((inventory.data?.items ?? []).filter((item) => item.currentQuantity === 0).length)} tone="red" />
      </View>

      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput accessibilityLabel="Search inventory" onChangeText={setSearch} placeholder="Search products, SKU, or category" placeholderTextColor="#8BA099" style={styles.searchInput} value={search} />
      </View>

      {queueSummary.readyCount > 0 || queueSummary.pendingCount > 0 ? <Pressable accessibilityRole="button" onPress={async () => {
        const ready = await listReadyScans()
        if (ready[0]) router.push({ pathname: '/(tabs)/inventory/review-scan', params: { scanId: ready[0].scanId } })
      }} style={styles.queueBanner}>
        <View style={styles.queueBadge}><Text style={styles.queueBadgeText}>{queueSummary.readyCount + queueSummary.pendingCount}</Text></View>
        <View style={styles.queueCopy}><Text style={styles.queueTitle}>{queueSummary.readyCount > 0 ? 'Shelf captures ready for review' : 'Shelf photo saved offline'}</Text><Text style={styles.queueSubtitle}>{queueSummary.readyCount > 0 ? 'Tap to review the next verified AI result.' : 'It will upload automatically when the connection returns.'}</Text></View>
        <Text style={styles.queueChevron}>›</Text>
      </Pressable> : null}

      <View style={styles.sectionHeader}>
        <View><Text style={styles.sectionTitle}>All stock</Text><Text style={styles.sectionSubtitle}>Tap a product to view its movement history.</Text></View>
        <Link href="/(tabs)/inventory/new" asChild><Pressable accessibilityRole="button" style={styles.smallAddButton}><Text style={styles.smallAddText}>+ Add</Text></Pressable></Link>
      </View>

      {inventory.isError ? <View style={styles.notice}><Text style={styles.noticeTitle}>Inventory is not connected yet</Text><Text style={styles.noticeCopy}>{inventory.error.message}</Text></View> : null}

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {items.map((item) => <InventoryCard item={item} key={item.id} />)}
        {!inventory.isLoading && items.length === 0 ? <View style={styles.emptyState}><Text style={styles.emptyEmoji}>✦</Text><Text style={styles.emptyTitle}>{search ? 'No matching products' : 'Your inventory is empty'}</Text><Text style={styles.emptyCopy}>{search ? 'Try a different search term.' : 'Use Actions below to add stock by photo or by typing.'}</Text></View> : null}
      </ScrollView>

      <Pressable accessibilityLabel="Open inventory actions" accessibilityRole="button" onPress={() => setActionsOpen(true)} style={styles.actionsButton}>
        <Text style={styles.actionsPlus}>+</Text><Text style={styles.actionsText}>Actions</Text>
      </Pressable>

      <Modal animationType="slide" onRequestClose={() => setActionsOpen(false)} transparent visible={actionsOpen}>
        <Pressable style={styles.modalBackdrop} onPress={() => setActionsOpen(false)}>
          <Pressable style={styles.actionSheet} onPress={(event) => event.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetEyebrow}>Add a record</Text>
            <Text style={styles.sheetTitle}>How would you like to add stock?</Text>
            <Text style={styles.sheetCopy}>Choose a quick capture method. You can always correct the record before it is saved.</Text>
            <Pressable accessibilityRole="button" onPress={takePhoto} style={styles.actionOption}>
              <View style={[styles.actionIcon, styles.photoIcon]}><Text style={styles.actionIconText}>◉</Text></View>
              <View style={styles.actionOptionCopy}><Text style={styles.actionOptionTitle}>Take photo</Text><Text style={styles.actionOptionSubtitle}>Let AI read the shelf, then verify every suggestion.</Text></View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={typeManually} style={styles.actionOption}>
              <View style={[styles.actionIcon, styles.typeIcon]}><Text style={styles.actionIconText}>✎</Text></View>
              <View style={styles.actionOptionCopy}><Text style={styles.actionOptionTitle}>Type manually</Text><Text style={styles.actionOptionSubtitle}>Enter a product, quantity, batch, and expiry date.</Text></View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => setActionsOpen(false)} style={styles.cancelButton}><Text style={styles.cancelText}>Cancel</Text></Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  )
}

function SummaryCard({ label, value, tone = 'green' }: { label: string; value: string; tone?: 'green' | 'amber' | 'red' }) {
  const toneColor = tone === 'red' ? colors.red : tone === 'amber' ? colors.amber : colors.green
  return <View style={styles.summaryCard}><Text style={[styles.summaryValue, { color: toneColor }]}>{value}</Text><Text style={styles.summaryLabel}>{label}</Text></View>
}

function InventoryCard({ item }: { item: InventoryItem }) {
  return <Pressable accessibilityRole="button" style={styles.card}>
    <View style={styles.cardTop}><View style={styles.productMark}><Text style={styles.productMarkText}>{item.name.slice(0, 1).toUpperCase()}</Text></View><View style={styles.productCopy}><Text style={styles.itemName}>{item.name}</Text><Text style={styles.itemMeta}>{item.sku ?? 'No SKU'} · {item.category ?? 'Uncategorized'}</Text></View><Text style={styles.cardChevron}>›</Text></View>
    <View style={styles.cardBottom}><View><Text style={styles.quantity}>{item.currentQuantity} <Text style={styles.quantityUnit}>{item.unit}</Text></Text><Text style={styles.itemMeta}>Minimum {item.minimumQuantity} {item.unit}</Text></View><StatusBadge quantity={item.currentQuantity} minimum={item.minimumQuantity} /></View>
  </Pressable>
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  eyebrow: { color: colors.green, fontSize: 11, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' },
  title: { color: colors.ink, fontSize: 35, fontWeight: '900', marginTop: 6 },
  liveDot: { alignItems: 'center', backgroundColor: '#E9F7EF', borderRadius: 999, flexDirection: 'row', gap: 7, paddingHorizontal: 11, paddingVertical: 8 },
  dot: { backgroundColor: colors.green, borderRadius: 99, height: 7, width: 7 },
  liveText: { color: colors.green, fontSize: 12, fontWeight: '900' },
  summaryRow: { flexDirection: 'row', gap: 9, marginTop: 22 },
  summaryCard: { backgroundColor: colors.card, borderColor: colors.line, borderRadius: 16, borderWidth: 1, flex: 1, padding: 13 },
  summaryValue: { fontSize: 24, fontWeight: '900' },
  summaryLabel: { color: colors.muted, fontSize: 11, fontWeight: '700', marginTop: 3 },
  searchBox: { alignItems: 'center', backgroundColor: colors.card, borderColor: colors.line, borderRadius: 15, borderWidth: 1, flexDirection: 'row', marginTop: 18, paddingHorizontal: 14 },
  searchIcon: { color: colors.muted, fontSize: 25, marginRight: 8 },
  searchInput: { color: colors.ink, flex: 1, fontSize: 14, paddingVertical: 14 },
  sectionHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 24 },
  sectionTitle: { color: colors.ink, fontSize: 19, fontWeight: '900' },
  sectionSubtitle: { color: colors.muted, fontSize: 12, marginTop: 4 },
  smallAddButton: { backgroundColor: '#E9F7EF', borderRadius: 11, paddingHorizontal: 11, paddingVertical: 8 },
  smallAddText: { color: colors.green, fontSize: 12, fontWeight: '900' },
  notice: { backgroundColor: '#FFF7E8', borderRadius: 18, marginTop: 16, padding: 14 },
  noticeTitle: { color: colors.amber, fontWeight: '900' },
  noticeCopy: { color: colors.muted, lineHeight: 19, marginTop: 4 },
  list: { gap: 11, paddingBottom: 120, paddingTop: 16 },
  card: { backgroundColor: colors.card, borderColor: colors.line, borderRadius: 19, borderWidth: 1, padding: 15 },
  cardTop: { alignItems: 'center', flexDirection: 'row' },
  productMark: { alignItems: 'center', backgroundColor: '#E9F7EF', borderRadius: 14, height: 42, justifyContent: 'center', width: 42 },
  productMarkText: { color: colors.green, fontSize: 18, fontWeight: '900' },
  productCopy: { flex: 1, marginLeft: 11 },
  itemName: { color: colors.ink, fontSize: 15, fontWeight: '900' },
  itemMeta: { color: colors.muted, fontSize: 12, marginTop: 4 },
  cardChevron: { color: colors.muted, fontSize: 25, paddingLeft: 8 },
  cardBottom: { alignItems: 'flex-end', borderTopColor: colors.line, borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-between', marginTop: 14, paddingTop: 12 },
  quantity: { color: colors.ink, fontSize: 21, fontWeight: '900' },
  quantityUnit: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingHorizontal: 20, paddingVertical: 48 },
  emptyEmoji: { color: colors.green, fontSize: 34 },
  emptyTitle: { color: colors.ink, fontSize: 18, fontWeight: '900', marginTop: 12 },
  emptyCopy: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: 6, textAlign: 'center' },
  queueBanner: { alignItems: 'center', backgroundColor: '#FFF7E8', borderRadius: 17, flexDirection: 'row', marginTop: 14, padding: 13 },
  queueBadge: { alignItems: 'center', backgroundColor: colors.amber, borderRadius: 12, height: 36, justifyContent: 'center', width: 36 },
  queueBadgeText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  queueCopy: { flex: 1, marginLeft: 11 },
  queueTitle: { color: colors.amber, fontSize: 13, fontWeight: '900' },
  queueSubtitle: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 3 },
  queueChevron: { color: colors.amber, fontSize: 26, marginLeft: 8 },
  actionsButton: { alignItems: 'center', alignSelf: 'center', backgroundColor: colors.green, borderRadius: 18, bottom: 18, flexDirection: 'row', elevation: 5, gap: 8, paddingHorizontal: 22, paddingVertical: 14, position: 'absolute', shadowColor: '#123B2C', shadowOffset: { height: 5, width: 0 }, shadowOpacity: 0.22, shadowRadius: 9 },
  actionsPlus: { color: colors.mint, fontSize: 22, fontWeight: '500', lineHeight: 22 },
  actionsText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  modalBackdrop: { backgroundColor: 'rgba(16, 42, 42, 0.38)', flex: 1, justifyContent: 'flex-end' },
  actionSheet: { backgroundColor: colors.paper, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22, paddingBottom: 34 },
  sheetHandle: { alignSelf: 'center', backgroundColor: '#B8C9C0', borderRadius: 999, height: 5, marginBottom: 24, width: 42 },
  sheetEyebrow: { color: colors.green, fontSize: 11, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' },
  sheetTitle: { color: colors.ink, fontSize: 25, fontWeight: '900', marginTop: 8 },
  sheetCopy: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: 8 },
  actionOption: { alignItems: 'center', backgroundColor: colors.card, borderColor: colors.line, borderRadius: 18, borderWidth: 1, flexDirection: 'row', marginTop: 12, padding: 14 },
  actionIcon: { alignItems: 'center', borderRadius: 14, height: 46, justifyContent: 'center', width: 46 },
  photoIcon: { backgroundColor: '#E9F7EF' },
  typeIcon: { backgroundColor: '#FFF1D9' },
  actionIconText: { color: colors.green, fontSize: 22, fontWeight: '900' },
  actionOptionCopy: { flex: 1, marginLeft: 12 },
  actionOptionTitle: { color: colors.ink, fontSize: 16, fontWeight: '900' },
  actionOptionSubtitle: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 3 },
  chevron: { color: colors.muted, fontSize: 27, marginLeft: 7 },
  cancelButton: { alignItems: 'center', padding: 16 },
  cancelText: { color: colors.muted, fontSize: 15, fontWeight: '900' },
})
