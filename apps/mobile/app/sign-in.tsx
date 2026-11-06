import { useSignIn } from '@clerk/clerk-expo'
import { router } from 'expo-router'
import { useState } from 'react'
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { colors } from '@/theme'

export default function SignIn() {
  const { isLoaded, signIn, setActive } = useSignIn()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit() {
    if (!isLoaded) return
    try {
      setSubmitting(true)
      const result = await signIn.create({ identifier: email.trim(), password })
      if (result.createdSessionId) {
        await setActive({ session: result.createdSessionId })
        router.replace('/(tabs)/dashboard')
      }
    } catch (error) {
      Alert.alert('Could not sign in', error instanceof Error ? error.message : 'Check your details and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return <View style={styles.screen}>
    <Text style={styles.eyebrow}>Pharmacy operations</Text>
    <Text style={styles.title}>Welcome back.</Text>
    <Text style={styles.copy}>Sign in to access your pharmacy inventory.</Text>
    <Text style={styles.label}>Email</Text>
    <TextInput autoCapitalize="none" autoComplete="email" keyboardType="email-address" onChangeText={setEmail} placeholder="you@pharmacy.com" placeholderTextColor="#8BA099" style={styles.input} value={email} />
    <Text style={styles.label}>Password</Text>
    <TextInput secureTextEntry onChangeText={setPassword} placeholder="Your password" placeholderTextColor="#8BA099" style={styles.input} value={password} />
    <Pressable disabled={submitting || !isLoaded} onPress={submit} style={styles.button}><Text style={styles.buttonText}>{submitting ? 'Signing in…' : 'Sign in'}</Text></Pressable>
  </View>
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.paper, flex: 1, justifyContent: 'center', padding: 24 },
  eyebrow: { color: colors.green, fontSize: 12, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' },
  title: { color: colors.ink, fontSize: 36, fontWeight: '900', marginTop: 10 },
  copy: { color: colors.muted, fontSize: 16, lineHeight: 24, marginTop: 8 },
  label: { color: colors.ink, fontSize: 13, fontWeight: '900', marginBottom: 7, marginTop: 22 },
  input: { backgroundColor: colors.card, borderColor: colors.line, borderRadius: 14, borderWidth: 1, color: colors.ink, fontSize: 16, padding: 14 },
  button: { alignItems: 'center', backgroundColor: colors.green, borderRadius: 16, marginTop: 28, padding: 16 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
})
