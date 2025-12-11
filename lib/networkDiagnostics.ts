// Network diagnostics for debugging connection issues
import { supabase } from '@/supabase';

export async function testSupabaseConnection(): Promise<{
  connected: boolean;
  error?: string;
  url?: string;
}> {
  try {
    console.log('Testing Supabase connection...');
    
    // Try a simple health check via REST API
    const url = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/rest/v1/`;
    console.log('Attempting to reach:', url);
    
    const response = await fetch(url, {
      method: 'HEAD',
      headers: {
        'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
      },
    });
    
    console.log('Health check response status:', response.status);
    
    if (response.ok || response.status === 401) {
      // 401 is OK - means API is reachable but auth is required
      // 2xx is also OK - means API is fully reachable
      console.log('✅ Supabase is reachable');
      return { connected: true, url: process.env.EXPO_PUBLIC_SUPABASE_URL };
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('❌ Supabase connection failed:', errorMsg);
    
    // Provide diagnostic advice
    let advice = '';
    if (errorMsg.includes('Network request failed')) {
      advice = 'Network unreachable - check if phone has internet, firewall blocking HTTPS, or VPN issues';
    } else if (errorMsg.includes('timeout')) {
      advice = 'Request timeout - Supabase server may be slow or unreachable';
    }
    
    return {
      connected: false,
      error: errorMsg,
      url: advice,
    };
  }
}

export async function testAuthConnection(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    console.log('Testing Supabase Auth...');
    const { data, error } = await supabase.auth.getSession();
    
    if (error) throw error;
    console.log('✅ Auth endpoint is reachable');
    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('❌ Auth endpoint failed:', errorMsg);
    return { success: false, error: errorMsg };
  }
}
