// supabaseClient.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
// Load the URL polyfill if available. Use a try/catch so the app doesn't hard-fail
// during development if packages haven't been installed yet.
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('react-native-url-polyfill/auto');
} catch (e) {
  // Will occur if the package isn't installed; log a friendly warning.
  // The runtime will still work on web where this polyfill isn't needed.
  // Install the package with: npm install react-native-url-polyfill
  // or run: npx expo install react-native-url-polyfill
  // if you want the expo-managed compatible flow.
  // We intentionally don't throw here so the dev server can continue.
  // eslint-disable-next-line no-console
  console.warn('react-native-url-polyfill is not installed; URL polyfills may be missing.');
}

// -------------------------------------------------------------------
// 1. Supabase credentials (Expo env variables)
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

// -------------------------------------------------------------------
// 2. Storage that satisfies Supabase's `Storage` interface
// The exact type for Supabase's storage is different between versions; use a
// minimal `any`-typed shape here to avoid strict type issues while keeping
// runtime behavior.
type SupabaseStorage = any;

const nativeStorage: SupabaseStorage = AsyncStorage;

// Web storage – only accessed when `Platform.OS === 'web'`
const webStorage: SupabaseStorage = {
  getItem: (key: any) => {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(key);
  },
  setItem: (key: any, value: any) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
    }
  },
  removeItem: (key: any) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
    }
  },
};

// -------------------------------------------------------------------
// 3. Choose the right storage at runtime
const storage: SupabaseStorage = Platform.OS === 'web' ? webStorage : nativeStorage;

// -------------------------------------------------------------------
// 4. Create the client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web', // OAuth redirects only on web
  },
});