import { supabase } from '@/supabase';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
} from 'react-native';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';

export default function LoginScreen() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    email: '',
    password: '',
  });

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
          const { data, error } = await supabase.auth.signUp({
            email: formData.email,
            password: formData.password,
            options: { data: { name: formData.name, surname: formData.surname } },
          });

          if (error) {
            setError(error.message);
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
            // ignore profile errors if table doesn't exist
            console.warn('Profile upsert failed', e);
          }

          // If Supabase requires email confirmation, user may not be immediately signed in.
          // Redirect to tabs anyway; adjust based on your auth settings.
          router.replace('/(tabs)');
        } else {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: formData.email,
            password: formData.password,
          });

          if (error) {
            setError(error.message);
            return;
          }

          // Signed in
          router.replace('/(tabs)');
        }
      } catch (err: any) {
        setError(err?.message ?? 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    })();
  };

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <ThemedText style={styles.title}>
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </ThemedText>

          {isSignUp && (
            <>
              <TextInput
                style={styles.input}
                placeholder="Name"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholderTextColor="#666"
              />
              <TextInput
                style={styles.input}
                placeholder="Surname"
                value={formData.surname}
                onChangeText={(text) => setFormData({ ...formData, surname: text })}
                placeholderTextColor="#666"
              />
            </>
          )}

          <TextInput
            style={styles.input}
            placeholder="Email"
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#666"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={formData.password}
            onChangeText={(text) => setFormData({ ...formData, password: text })}
            secureTextEntry
            placeholderTextColor="#666"
          />

          {error ? (
            <ThemedText style={styles.errorText}>{error}</ThemedText>
          ) : null}

          <TouchableOpacity style={[styles.button, loading ? styles.buttonDisabled : null]} onPress={handleSubmit} disabled={loading}>
            <ThemedText style={styles.buttonText}>
              {loading ? (isSignUp ? 'Signing up...' : 'Signing in...') : isSignUp ? 'Sign Up' : 'Sign In'}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => setIsSignUp(!isSignUp)}>
            <ThemedText style={styles.switchText}>
              {isSignUp
                ? 'Already have an account? Sign In'
                : "Don't have an account? Sign Up"}
            </ThemedText>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchButton: {
    marginTop: 20,
  },
  errorText: {
    color: '#c00',
    textAlign: 'center',
    marginBottom: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  switchText: {
    textAlign: 'center',
    fontSize: 14,
  },
});