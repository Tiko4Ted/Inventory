import * as ImagePicker from 'expo-image-picker'
import { router } from 'expo-router'
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native'
import { Screen } from '@/components/Screen'
import { colors } from '@/theme'

export default function ScanShelf() {
  async function capture() {
    const permission = await ImagePicker.requestCameraPermissionsAsync()
    if (!permission.granted) return Alert.alert('Camera permission needed', 'Allow camera access to capture a shelf.')

    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 })
    if (!result.canceled && result.assets[0]) {
      router.push({ pathname: '/(tabs)/inventory/review-scan', params: { imageUri: result.assets[0].uri } })
    }
  }

  return (
    <Screen>
      <Text style={styles.eyebrow}>AI-assisted capture</Text>
      <Text style={styles.title}>Photograph the shelf.</Text>
      <Text style={styles.copy}>Frame one shelf clearly. The AI will suggest products and quantities, but staff must verify every line before saving.</Text>
      <View style={styles.guide}><Text style={styles.guideTitle}>Capture tips</Text><Text style={styles.guideCopy}>Use good light · Keep labels facing the camera · Avoid overlapping boxes · Capture one shelf at a time</Text></View>
      <Pressable onPress={capture} style={styles.button}><Text style={styles.buttonText}>Open camera</Text></Pressable>
      <Pressable onPress={() => router.push('/(tabs)/inventory/new')} style={styles.linkButton}><Text style={styles.linkText}>Enter manually instead</Text></Pressable>
    </Screen>
  )
}

const styles = StyleSheet.create({
  eyebrow: { color: colors.green, fontSize: 12, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' },
  title: { color: colors.ink, fontSize: 34, fontWeight: '900', marginTop: 10 },
  copy: { color: colors.muted, fontSize: 16, lineHeight: 24, marginTop: 12 },
  guide: { backgroundColor: '#E9F7EF', borderRadius: 20, marginTop: 28, padding: 20 },
  guideTitle: { color: colors.green, fontSize: 16, fontWeight: '900' },
  guideCopy: { color: colors.muted, fontSize: 15, lineHeight: 23, marginTop: 8 },
  button: { alignItems: 'center', backgroundColor: colors.green, borderRadius: 16, marginTop: 26, padding: 16 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  linkButton: { alignItems: 'center', padding: 16 },
  linkText: { color: colors.green, fontWeight: '900' },
})
