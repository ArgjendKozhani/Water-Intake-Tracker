import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { supabase } from '@/supabase';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handle = async () => {
      try {
        const url = await Linking.getInitialURL();
        if (!url) {
          router.replace('/auth/login');
          return;
        }
        const { queryParams } = Linking.parse(url);
        const code = (queryParams?.code as string) || '';
        const next = (queryParams?.next as string) || '/(tabs)';

        if (!code) {
          router.replace('/auth/login');
          return;
        }
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          console.error('exchangeCodeForSession error:', error.message);
          router.replace('/auth/login');
          return;
        }
        if (data.session) {
          router.replace(next);
        } else {
          router.replace('/auth/login');
        }
      } catch (e) {
        console.error('Auth callback failed:', e);
        router.replace('/auth/login');
      }
    };
    handle();
  }, [router]);

  return (
    <ThemedView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ThemedText>Completing sign-in…</ThemedText>
    </ThemedView>
  );
}