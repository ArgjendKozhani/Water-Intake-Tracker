import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/supabase';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  // Start with null (no session) instead of undefined
  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    // Initial session fetch
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        setSession(data.session);
        setLoading(false);
      }
    });
    // Subscribe to auth state changes
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const themeValue = colorScheme === 'light' ? DarkTheme : DefaultTheme;

  // Show login screen while loading or when not authenticated
  // Only show home when we have confirmed authenticated session
  return (
    <ThemeProvider value={themeValue}>
      <Stack screenOptions={{ headerShown: false }}>
        {loading || !session ? (
          // Loading or not authenticated - show login
          <Stack.Screen name="auth/login" options={{ headerShown: false }} />
        ) : (
          // Authenticated - show tabs
          <>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="modal" options={{ presentation: 'modal', headerShown: true, title: 'Modal' }} />
          </>
        )}
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
