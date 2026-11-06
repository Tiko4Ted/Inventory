import { Tabs } from 'expo-router'

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#196B4A',
        tabBarInactiveTintColor: '#7C9188',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        tabBarStyle: { borderTopColor: '#D9E6DF', height: 70, paddingBottom: 10, paddingTop: 8 },
      }}
    >
      <Tabs.Screen name="dashboard" options={{ title: 'Home' }} />
      <Tabs.Screen name="inventory/index" options={{ title: 'Inventory' }} />
      <Tabs.Screen name="clients/index" options={{ title: 'Clients' }} />
      <Tabs.Screen name="settings/index" options={{ title: 'More' }} />
    </Tabs>
  )
}
