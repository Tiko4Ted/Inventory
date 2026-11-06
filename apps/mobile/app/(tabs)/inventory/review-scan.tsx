import { useLocalSearchParams, router } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { Screen } from '@/components/Screen'
import { api, OfflineQueuedError, processShelfPhoto } from '@/lib/api-client'
import { removeReadyScan } from '@/lib/photo-queue'
import { colors } from '@/theme'

type ScanLine = { id: string; productLabel: string; quantity: number; unit: string | null; batchNumber: string | null; expiryDate: string | null; confidence: number }
type ReviewDecision = 'accepted' | 'rejected'

export default function ReviewScan() {
  const { imageUri, scanId: queuedScanId } = useLocalSearchParams<{ imageUri?: string; scanId?: string }>()
  const [scanId, setScanId] = useState<string>(queuedScanId ?? '')
  const [lines, setLines] = useState<ScanLine[]>([])
  const [decisions, setDecisions] = useState<Record<string, ReviewDecision>>({})
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<'ready' | 'loading' | 'processing' | 'queued' | 'saving' | 'failed'>('ready')

  useEffect(() => {
    if (!queuedScanId) return
    setStatus('loading')
    void api<{ scan: { status: string }; lines: ScanLine[] }>(`/api/inventory/shelf-scans/${queuedScanId}`)
      .then((result) => { setLines(result.lines); setStatus(result.scan.status === 'failed' ? 'failed' : 'ready') })
      .catch((error) => Alert.alert('Could not load queued scan', error instanceof Error ? error.message : 'Try again.'))
      .finally(() => setStatus('ready'))
  }, [queuedScanId])

  async function analyzePhoto() {
    if (!imageUri) return Alert.alert('No image selected', 'Go back and capture the shelf again.')

    try {
      setStatus('processing')
      setProgress(0)
      const result = await processShelfPhoto(imageUri, setProgress)
      setScanId(result.scanId)
      setLines(result.lines)
      setDecisions({})
      setStatus('ready')
    } catch (error) {
      if (error instanceof OfflineQueuedError) {
        setStatus('queued')
        Alert.alert('Saved for later', 'This photo is queued on the device and will be uploaded automatically when the connection returns.')
        return
      }
      setStatus('ready')
      Alert.alert('Could not analyze shelf', error instanceof Error ? error.message : 'Try again.')
    }
  }

  async function retryAnalysis() {
    if (!scanId) return
    try {
      setStatus('processing')
      const result = await api<{ lines: ScanLine[] }>(`/api/inventory/shelf-scans/${scanId}/retry`, { method: 'POST' })
      setLines(result.lines)
      setDecisions({})
      setStatus('ready')
    } catch (error) {
      setStatus('failed')
      Alert.alert('Retry failed', error instanceof Error ? error.message : 'Try again later.')
    }
  }

  function updateLine(id: string, update: Partial<ScanLine>) {
    setLines((current) => current.map((line) => line.id === id ? { ...line, ...update } : line))
  }

  async function saveReview() {
    if (!scanId) return Alert.alert('Analyze the photo first', 'The system needs the AI suggestions before they can be reviewed.')
    if (lines.some((line) => !decisions[line.id])) return Alert.alert('Review every line', 'Choose Keep or Reject for each detected product.')

    try {
      setStatus('saving')
      await api(`/api/inventory/shelf-scans/${scanId}/review`, {
        method: 'POST',
        body: JSON.stringify({ decisions: lines.map((line) => ({ lineId: line.id, status: decisions[line.id], productLabel: line.productLabel, quantity: line.quantity, unit: line.unit, batchNumber: line.batchNumber || undefined, expiryDate: line.expiryDate || undefined })) }),
      })
      await removeReadyScan(scanId)
      Alert.alert('Inventory updated', 'The verified shelf records are now reflected in inventory.', [{ text: 'Done', onPress: () => router.replace('/(tabs)/inventory') }])
    } catch (error) {
      setStatus('ready')
      Alert.alert('Could not save review', error instanceof Error ? error.message : 'Try again.')
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>AI capture</Text>
        <Text style={styles.title}>Review shelf records.</Text>
        <Text style={styles.copy}>The AI suggests what it can see. Edit the details, then keep or reject every line before anything changes official stock.</Text>
        {imageUri ? <Image accessibilityLabel="Captured pharmacy shelf" source={{ uri: imageUri }} style={styles.preview} /> : null}

        {!scanId && status !== 'processing' && status !== 'queued' ? <Pressable disabled={!imageUri} onPress={analyzePhoto} style={styles.primaryButton}><Text style={styles.primaryText}>Upload and analyze photo</Text></Pressable> : null}
        {status === 'processing' ? <View style={styles.progress}><ActivityIndicator color={colors.green} /><Text style={styles.progressText}>Uploading and analyzing… {Math.round(progress)}%</Text></View> : null}
        {status === 'queued' ? <View style={styles.queued}><Text style={styles.queuedTitle}>Photo saved offline</Text><Text style={styles.queuedCopy}>It will be processed automatically when the device reconnects.</Text></View> : null}

        {scanId && status !== 'loading' ? <View style={styles.resultHeader}><View><Text style={styles.resultTitle}>Detected products</Text><Text style={styles.resultCopy}>{lines.length} suggestion{lines.length === 1 ? '' : 's'} found</Text></View><Text style={styles.reviewRequired}>Review required</Text></View> : null}
        {status === 'loading' ? <ActivityIndicator color={colors.green} style={styles.loader} /> : null}
        {status === 'failed' ? <View style={styles.notice}><Text style={styles.noticeTitle}>AI analysis failed</Text><Text style={styles.noticeText}>The photo is still stored safely. You can retry the analysis or enter the stock manually.</Text><Pressable onPress={retryAnalysis} style={styles.retryButton}><Text style={styles.retryText}>Retry analysis</Text></Pressable></View> : null}
        {scanId && lines.length === 0 && status !== 'loading' && status !== 'failed' ? <View style={styles.notice}><Text style={styles.noticeTitle}>No readable products found</Text><Text style={styles.noticeText}>Try a closer photo with better light, or use manual entry.</Text></View> : null}

        {lines.map((line) => {
          const decision = decisions[line.id]
          return <View key={line.id} style={[styles.lineCard, decision === 'accepted' ? styles.accepted : decision === 'rejected' ? styles.rejected : null]}>
            <View style={styles.lineTop}><View style={styles.lineMark}><Text style={styles.lineMarkText}>{line.productLabel.slice(0, 1).toUpperCase()}</Text></View><View style={styles.lineCopy}><TextInput accessibilityLabel="Detected product name" onChangeText={(value) => updateLine(line.id, { productLabel: value })} style={styles.editInput} value={line.productLabel} /><Text style={styles.productMeta}>{Math.round(line.confidence / 100)}% confidence</Text></View></View>
            <View style={styles.editRow}><TextInput accessibilityLabel="Detected quantity" keyboardType="number-pad" onChangeText={(value) => updateLine(line.id, { quantity: Number(value) || 0 })} style={styles.smallInput} value={String(line.quantity)} /><TextInput accessibilityLabel="Detected unit" onChangeText={(value) => updateLine(line.id, { unit: value })} placeholder="unit" placeholderTextColor="#8BA099" style={styles.unitInput} value={line.unit ?? ''} /></View>
            <View style={styles.editRow}><TextInput accessibilityLabel="Detected batch number" onChangeText={(value) => updateLine(line.id, { batchNumber: value })} placeholder="Batch number" placeholderTextColor="#8BA099" style={styles.unitInput} value={line.batchNumber ?? ''} /><TextInput accessibilityLabel="Detected expiry date" onChangeText={(value) => updateLine(line.id, { expiryDate: value })} placeholder="Expiry YYYY-MM-DD" placeholderTextColor="#8BA099" style={styles.unitInput} value={line.expiryDate ?? ''} /></View>
            <View style={styles.lineActions}><Pressable accessibilityRole="button" onPress={() => setDecisions((current) => ({ ...current, [line.id]: 'accepted' }))} style={[styles.decisionButton, decision === 'accepted' ? styles.keepButton : null]}><Text style={[styles.decisionText, decision === 'accepted' ? styles.keepText : null]}>Keep</Text></Pressable><Pressable accessibilityRole="button" onPress={() => setDecisions((current) => ({ ...current, [line.id]: 'rejected' }))} style={[styles.decisionButton, decision === 'rejected' ? styles.rejectButton : null]}><Text style={[styles.decisionText, decision === 'rejected' ? styles.rejectText : null]}>Reject</Text></Pressable></View>
          </View>
        })}

        {scanId && lines.length > 0 ? <Pressable disabled={status === 'saving'} onPress={saveReview} style={styles.primaryButton}><Text style={styles.primaryText}>{status === 'saving' ? 'Saving verified stock…' : 'Save verified stock'}</Text></Pressable> : null}
        <Pressable onPress={() => router.back()} style={styles.backButton}><Text style={styles.backText}>Back to inventory</Text></Pressable>
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  content: { paddingBottom: 34 },
  eyebrow: { color: colors.green, fontSize: 12, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' },
  title: { color: colors.ink, fontSize: 32, fontWeight: '900', marginTop: 10 },
  copy: { color: colors.muted, fontSize: 15, lineHeight: 23, marginTop: 10 },
  preview: { backgroundColor: colors.line, borderRadius: 18, height: 220, marginTop: 22, width: '100%' },
  primaryButton: { alignItems: 'center', backgroundColor: colors.green, borderRadius: 16, marginTop: 22, padding: 16 },
  primaryText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  progress: { alignItems: 'center', backgroundColor: '#E9F7EF', borderRadius: 16, flexDirection: 'row', gap: 10, marginTop: 22, padding: 16 },
  progressText: { color: colors.green, fontSize: 14, fontWeight: '800' },
  queued: { backgroundColor: '#FFF7E8', borderRadius: 16, marginTop: 22, padding: 16 },
  queuedTitle: { color: colors.amber, fontWeight: '900' },
  queuedCopy: { color: colors.muted, lineHeight: 21, marginTop: 5 },
  loader: { marginTop: 28 },
  resultHeader: { alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'space-between', marginTop: 26 },
  resultTitle: { color: colors.ink, fontSize: 20, fontWeight: '900' },
  resultCopy: { color: colors.muted, fontSize: 13, marginTop: 4 },
  reviewRequired: { backgroundColor: '#FFF1D9', borderRadius: 999, color: colors.amber, fontSize: 11, fontWeight: '900', paddingHorizontal: 9, paddingVertical: 6 },
  notice: { backgroundColor: '#FFF7E8', borderRadius: 18, marginTop: 16, padding: 16 },
  noticeTitle: { color: colors.amber, fontWeight: '900' },
  noticeText: { color: colors.muted, lineHeight: 21, marginTop: 5 },
  retryButton: { alignSelf: 'flex-start', backgroundColor: '#FFFFFF', borderColor: colors.amber, borderRadius: 10, borderWidth: 1, marginTop: 12, paddingHorizontal: 12, paddingVertical: 9 },
  retryText: { color: colors.amber, fontSize: 13, fontWeight: '900' },
  lineCard: { backgroundColor: colors.card, borderColor: colors.line, borderRadius: 18, borderWidth: 1, marginTop: 12, padding: 14 },
  accepted: { borderColor: colors.green, borderWidth: 2 },
  rejected: { borderColor: colors.red, borderWidth: 2, opacity: 0.72 },
  lineTop: { alignItems: 'center', flexDirection: 'row' },
  lineMark: { alignItems: 'center', backgroundColor: '#E9F7EF', borderRadius: 13, height: 40, justifyContent: 'center', width: 40 },
  lineMarkText: { color: colors.green, fontSize: 17, fontWeight: '900' },
  lineCopy: { flex: 1, marginLeft: 11 },
  editInput: { borderBottomColor: colors.line, borderBottomWidth: 1, color: colors.ink, fontSize: 15, fontWeight: '900', paddingVertical: 3 },
  productMeta: { color: colors.muted, fontSize: 12, marginTop: 4 },
  editRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  smallInput: { borderColor: colors.line, borderRadius: 10, borderWidth: 1, color: colors.ink, flex: 1, fontSize: 14, padding: 10 },
  unitInput: { borderColor: colors.line, borderRadius: 10, borderWidth: 1, color: colors.ink, flex: 2, fontSize: 14, padding: 10 },
  lineActions: { flexDirection: 'row', gap: 10, marginTop: 13 },
  decisionButton: { alignItems: 'center', borderColor: colors.line, borderRadius: 12, borderWidth: 1, flex: 1, padding: 11 },
  decisionText: { color: colors.muted, fontSize: 13, fontWeight: '900' },
  keepButton: { backgroundColor: '#E9F7EF', borderColor: colors.green },
  keepText: { color: colors.green },
  rejectButton: { backgroundColor: '#FCEBEC', borderColor: colors.red },
  rejectText: { color: colors.red },
  backButton: { alignItems: 'center', padding: 16 },
  backText: { color: colors.green, fontWeight: '900' },
})
