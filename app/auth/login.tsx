import RuntimeDiagnostics, { DiagnosticsState } from '@/components/RuntimeDiagnostics';
import { testAuthConnection, testSupabaseConnection } from '@/lib/networkDiagnostics';
import { supabase } from '@/supabase';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { ThemedText } from '../../components/themed-text';

export default function LoginScreen() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDiagnostics, setShowDiagnostics] = useState(true);
  const [diagState, setDiagState] = useState<DiagnosticsState>({ reachable: null, authSession: null });
  const [showPassword, setShowPassword] = useState(false);

  const runDiagnostics = () => {
    setDiagState((s) => ({ ...s, reachable: null }));
    Promise.all([testSupabaseConnection(), testAuthConnection(), supabase.auth.getSession()])
      .then(([conn, authConn, session]) => {
        setDiagState({
          reachable: conn.connected,
            authSession: !!session.data.session,
            lastError: !conn.connected ? conn.error : authConn.success ? undefined : authConn.error,
          });
      })
      .catch((e) => {
        setDiagState({ reachable: false, authSession: null, lastError: e instanceof Error ? e.message : String(e) });
      });
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const handleSubmit = () => {
    // basic validation
    if (!formData.email || !formData.password) {
      setError('Please provide email and password.');
      return;
    }

    setError('');
    setLoading(true);

    (async () => {
      try {
        if (isSignUp) {
          // Prefer HTTP fallback for email clients that don't open custom schemes
          const httpOrigin = (Platform.OS === 'web' ? window.location.origin : process.env.EXPO_PUBLIC_WEB_REDIRECT_ORIGIN) || 'http://localhost:8082';
          const redirectUrl = Platform.select({
            web: httpOrigin + '/auth/callback',
            default: 'waterintaketracker://auth/callback',
          });
          const { data, error } = await supabase.auth.signUp({
            email: formData.email,
            password: formData.password,
            options: {
              emailRedirectTo: redirectUrl,
              data: { name: formData.name, surname: formData.surname },
            },
          });

          if (error) {
            console.error('Sign up error:', error);
            if (error.message?.includes('Network request failed')) {
              const diagMsg = 'Network error: Your phone cannot reach Supabase. Check: 1) Internet connection 2) Firewall/VPN 3) Try on WiFi instead of cellular';
              setError(diagMsg);
              Alert.alert('Network Error', diagMsg);
            } else {
              setError(error.message || 'Sign up failed. Check console for details.');
            }
            return;
          }

            // Optionally upsert a profile row if you maintain a separate table.
            try {
              if (data?.user?.id) {
                await supabase.from('profiles').upsert({
                  id: data.user.id,
                  name: formData.name,
                  surname: formData.surname,
                  email: formData.email,
                });
              }
            } catch (e) {
              console.warn('Profile upsert failed', e);
            }

          // If email confirmation is enabled, session may be null here.
          if (!data.session) {
            Alert.alert('Verify Email', 'Check your inbox to confirm your email, then sign in.');
            return; // Stay on login screen
          }
          router.replace('/(tabs)');
        } else {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: formData.email,
            password: formData.password,
          });

          if (error) {
            console.error('Sign in error:', error);
            if (error.message?.includes('Network request failed')) {
              const diagMsg = 'Network error: Your phone cannot reach Supabase. Check: 1) Internet connection 2) Firewall/VPN 3) Try on WiFi instead of cellular';
              setError(diagMsg);
              Alert.alert('Network Error', diagMsg);
            } else {
              setError(error.message);
            }
            return;
          }

          // Signed in if session exists
          if (data.session) {
            router.replace('/(tabs)');
          } else {
            setError('Sign in did not return a session. Try again.');
          }
        }
      } catch (err: any) {
        setError(err?.message ?? 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    })();
  };

  const resendVerification = async () => {
    if (!formData.email) {
      Alert.alert('Enter Email', 'Provide your email before resending verification.');
      return;
    }
    try {
      setLoading(true);
      setError('');
      const httpOrigin = (Platform.OS === 'web' ? window.location.origin : process.env.EXPO_PUBLIC_WEB_REDIRECT_ORIGIN) || 'http://localhost:8082';
      const redirectUrl = Platform.select({
        web: httpOrigin + '/auth/callback',
        default: 'waterintaketracker://auth/callback',
      });
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: formData.email,
        options: { emailRedirectTo: redirectUrl },
      });
      if (error) {
        setError(error.message || 'Failed to resend verification email');
      } else {
        Alert.alert('Email Sent', 'Verification email resent. Check your inbox.');
      }
    } catch (e: any) {
      setError(e?.message || 'Unexpected resend error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#1E3A8A', '#2563EB', '#3B82F6']}
      style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {/* Water Drop Header */}
          <View style={styles.headerContainer}>
            <View style={styles.waterDropIconContainer}>
              <Ionicons name="water" size={60} color="#FFFFFF" />
            </View>
            <ThemedText style={styles.title}>
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              {isSignUp ? 'Start your hydration journey' : 'Continue tracking your water intake'}
            </ThemedText>
          </View>

          {showDiagnostics && (
            <RuntimeDiagnostics
              state={diagState}
              onRefresh={runDiagnostics}
              onDismiss={() => setShowDiagnostics(false)}
            />
          )}

          {/* Form Container with Glass Morphism */}
          <View style={styles.formContainer}>
            {isSignUp && (
              <>
                <View style={styles.inputWrapper}>
                  <Ionicons name="person-outline" size={20} color="#2196F3" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Name"
                    value={formData.name}
                    onChangeText={(text) => setFormData({ ...formData, name: text })}
                    placeholderTextColor="#94A3B8"
                  />
                </View>
                <View style={styles.inputWrapper}>
                  <Ionicons name="person-outline" size={20} color="#2196F3" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Surname"
                    value={formData.surname}
                    onChangeText={(text) => setFormData({ ...formData, surname: text })}
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              </>
            )}

            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color="#2196F3" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color="#2196F3" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Password"
                value={formData.password}
                onChangeText={(text) => setFormData({ ...formData, password: text })}
                secureTextEntry={!showPassword}
                placeholderTextColor="#94A3B8"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}>
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color="#2196F3"
                />
              </TouchableOpacity>
            </View>

            {error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={18} color="#EF4444" />
                <ThemedText style={styles.errorText}>{error}</ThemedText>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.button, loading ? styles.buttonDisabled : null]}
              onPress={handleSubmit}
              disabled={loading}>
              <LinearGradient
                colors={['#2196F3', '#1976D2', '#1565C0']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}>
                <Ionicons
                  name={loading ? 'hourglass-outline' : isSignUp ? 'person-add' : 'log-in-outline'}
                  size={20}
                  color="#FFFFFF"
                  style={{ marginRight: 8 }}
                />
                <ThemedText style={styles.buttonText}>
                  {loading ? (isSignUp ? 'Signing up...' : 'Signing in...') : isSignUp ? 'Sign Up' : 'Sign In'}
                </ThemedText>
              </LinearGradient>
            </TouchableOpacity>

            {isSignUp && !loading && (
              <TouchableOpacity style={styles.secondaryButton} onPress={resendVerification}>
                <Ionicons name="mail" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <ThemedText style={styles.secondaryButtonText}>Resend Verification Email</ThemedText>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => setIsSignUp(!isSignUp)}>
              <ThemedText style={styles.switchText}>
                {isSignUp
                  ? 'Already have an account? '
                  : "Don't have an account? "}
                <ThemedText style={styles.switchTextBold}>
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </ThemedText>
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    paddingTop: 80,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
    paddingTop: 20,
  },
  waterDropIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'visible',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    paddingHorizontal: 20,
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 10,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 15,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    padding: 15,
    fontSize: 16,
    color: '#1E293B',
  },
  passwordInput: {
    paddingRight: 45,
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
    padding: 5,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  button: {
    borderRadius: 12,
    marginTop: 8,
    overflow: 'hidden',
    shadowColor: '#1976D2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 14,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  switchButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  switchText: {
    textAlign: 'center',
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  switchTextBold: {
    fontWeight: 'bold',
    color: '#FFFFFF',
    textDecorationLine: 'underline',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});