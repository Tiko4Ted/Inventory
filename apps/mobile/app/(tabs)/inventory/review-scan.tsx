import { useLocalSearchParams, router } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Screen } from '@/components/Screen'
import { api, uploadShelfPhoto } from '@/lib/api-client'
import { colors } from '@/theme'

type ScanLine = {
  id: string
  productLabel: string
  quantity: number
  unit: string | null
  confidence: number
}

type ReviewDecision = 'accepted' | 'rejected'

export default function ReviewScan() {
  const { imageUri } = useLocalSearchParams<{ imageUri?: string }>()
  const [scanId, setScanId] = useState<string>()
  const [lines, setLines] = useState<ScanLine[]>([])
  const [decisions, setDecisions] = useState<Record<string, ReviewDecision>>({})
  const [status, setStatus] = useState<'ready' | 'processing' | 'saving' | 'complete'>('ready')

  async function analyzePhoto() {
    if (!imageUri) return Alert.alert('No image selected', 'Go back and capture the shelf again.')

    try {
      setStatus('processing')
      const imageUrl = await uploadShelfPhoto(imageUri)
      const result = await api<{ scanId: string; lines: ScanLine[] }>('/api/inventory/shelf-scans', {
        method: 'POST',
        body: JSON.stringify({ imageUrl }),
      })
      setScanId(result.scanId)
      setLines(result.lines)
      setDecisions({})
      setStatus('ready')
    } catch (error) {
      setStatus('ready')
      Alert.alert('Could not analyze shelf', error instanceof Error ? error.message : 'Try again.')
    }
  }

  function choose(lineId: string, decision: ReviewDecision) {
    setDecisions((current) => ({ ...current, [lineId]: decision }))
  }

  async function saveReview() {
    if (!scanId) return Alert.alert('Analyze the photo first', 'The system needs the AI suggestions before they can be reviewed.')
    if (lines.some((line) => !decisions[line.id])) return Alert.alert('Review every line', 'Choose Keep or Reject for each detected product.')

    try {
      setStatus('saving')
      await api(`/api/inventory/shelf-scans/${scanId}/review`, {
        method: 'POST',
        body: JSON.stringify({ decisions: lines.map((line) => ({ lineId: line.id, status: decisions[line.id] })) }),
      })
      setStatus('complete')
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
        <Text style={styles.copy}>The AI suggests what it can see. Keep or reject every line before anything changes your official stock.</Text>
        {imageUri ? <Image accessibilityLabel="Captured pharmacy shelf" source={{ uri: imageUri }} style={styles.preview} /> : null}

        {!scanId && status !== 'processing' ? <Pressable disabled={!imageUri} onPress={analyzePhoto} style={styles.primaryButton}><Text style={styles.primaryText}>Upload and analyze photo</Text></Pressable> : null}
        {status === 'processing' ? <View style={styles.progress}><ActivityIndicator color={colors.green} /><Text style={styles.progressText}>Uploading photo and reading shelf…</Text></View> : null}

        {scanId && status !== 'processing' ? <View style={styles.resultHeader}><View><Text style={styles.resultTitle}>Detected products</Text><Text style={styles.resultCopy}>{lines.length} suggestion{lines.length === 1 ? '' : 's'} found</Text></View><Text style={styles.reviewRequired}>Review required</Text></View> : null}

        {scanId && lines.length === 0 ? <View style={styles.notice}><Text style={styles.noticeTitle}>No readable products found</Text><Text style={styles.noticeText}>Try a closer photo with better light, or use manual entry.</Text></View> : null}

        {lines.map((line) => {
          const decision = decisions[line.id]
          return <View key={line.id} style={[styles.lineCard, decision === 'accepted' ? styles.accepted : decision === 'rejected' ? styles.rejected : null]}>
            <View style={styles.lineTop}><View style={styles.lineMark}><Text style={styles.lineMarkText}>{line.productLabel.slice(0, 1).toUpperCase()}</Text></View><View style={styles.lineCopy}><Text style={styles.productName}>{line.productLabel}</Text><Text style={styles.productMeta}>{line.quantity} {line.unit ?? 'units'} · {Math.round(line.confidence / 100)}% confidence</Text></View></View>
            <View style={styles.lineActions}><Pressable accessibilityRole="button" onPress={() => choose(line.id, 'accepted')} style={[styles.decisionButton, decision === 'accepted' ? styles.keepButton : null]}><Text style={[styles.decisionText, decision === 'accepted' ? styles.keepText : null]}>Keep</Text></Pressable><Pressable accessibilityRole="button" onPress={() => choose(line.id, 'rejected')} style={[styles.decisionButton, decision === 'rejected' ? styles.rejectButton : null]}><Text style={[styles.decisionText, decision === 'rejected' ? styles.rejectText : null]}>Reject</Text></Pressable></View>
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
  resultHeader: { alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'space-between', marginTop: 26 },
  resultTitle: { color: colors.ink, fontSize: 20, fontWeight: '900' },
  resultCopy: { color: colors.muted, fontSize: 13, marginTop: 4 },
  reviewRequired: { backgroundColor: '#FFF1D9', borderRadius: 999, color: colors.amber, fontSize: 11, fontWeight: '900', paddingHorizontal: 9, paddingVertical: 6 },
  notice: { backgroundColor: '#FFF7E8', borderRadius: 18, marginTop: 16, padding: 16 },
  noticeTitle: { color: colors.amber, fontWeight: '900' },
  noticeText: { color: colors.muted, lineHeight: 21, marginTop: 5 },
  lineCard: { backgroundColor: colors.card, borderColor: colors.line, borderRadius: 18, borderWidth: 1, marginTop: 12, padding: 14 },
  accepted: { borderColor: colors.green, borderWidth: 2 },
  rejected: { borderColor: colors.red, borderWidth: 2, opacity: 0.72 },
  lineTop: { alignItems: 'center', flexDirection: 'row' },
  lineMark: { alignItems: 'center', backgroundColor: '#E9F7EF', borderRadius: 13, height: 40, justifyContent: 'center', width: 40 },
  lineMarkText: { color: colors.green, fontSize: 17, fontWeight: '900' },
  lineCopy: { flex: 1, marginLeft: 11 },
  productName: { color: colors.ink, fontSize: 15, fontWeight: '900' },
  productMeta: { color: colors.muted, fontSize: 12, marginTop: 4 },
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
