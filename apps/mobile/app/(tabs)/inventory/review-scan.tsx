import { useLocalSearchParams, router } from 'expo-router'
import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { Screen } from '@/components/Screen'
import { colors } from '@/theme'

export default function ReviewScan() {
  const { imageUri } = useLocalSearchParams<{ imageUri?: string }>()

  return (
    <Screen>
      <Text style={styles.eyebrow}>Human verification required</Text>
      <Text style={styles.title}>Review shelf capture.</Text>
      <Text style={styles.copy}>The image is ready for private upload and AI analysis. Suggestions will appear here for acceptance, editing, or rejection before they affect stock.</Text>
      {imageUri ? <Image accessibilityLabel="Captured pharmacy shelf" source={{ uri: imageUri }} style={styles.preview} /> : <View style={styles.placeholder}><Text style={styles.placeholderText}>No image selected</Text></View>}
      <View style={styles.notice}><Text style={styles.noticeTitle}>Integration checkpoint</Text><Text style={styles.noticeText}>Connect Blob storage and the AI Gateway environment variables before submitting this image to the production review pipeline.</Text></View>
      <Pressable onPress={() => router.back()} style={styles.button}><Text style={styles.buttonText}>Back to inventory</Text></Pressable>
    </Screen>
  )
}

const styles = StyleSheet.create({
  eyebrow: { color: colors.green, fontSize: 12, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' },
  title: { color: colors.ink, fontSize: 32, fontWeight: '900', marginTop: 10 },
  copy: { color: colors.muted, fontSize: 15, lineHeight: 23, marginTop: 10 },
  preview: { backgroundColor: colors.line, borderRadius: 18, height: 240, marginTop: 22, width: '100%' },
  placeholder: { alignItems: 'center', backgroundColor: colors.line, borderRadius: 18, height: 180, justifyContent: 'center', marginTop: 22 },
  placeholderText: { color: colors.muted, fontWeight: '800' },
  notice: { backgroundColor: '#FFF7E8', borderRadius: 18, marginTop: 18, padding: 16 },
  noticeTitle: { color: colors.amber, fontWeight: '900' },
  noticeText: { color: colors.muted, lineHeight: 21, marginTop: 6 },
  button: { alignItems: 'center', backgroundColor: colors.green, borderRadius: 16, marginTop: 24, padding: 16 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
})
