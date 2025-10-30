import { supabase } from '@/supabase';
import { useRouter } from 'expo-router';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';

export default function HomeScreen() {
  const router = useRouter();

  const signOut = async () => {
    await supabase.auth.signOut();
    router.replace('/auth/login');
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Home</ThemedText>
      <TouchableOpacity style={styles.button} onPress={signOut}>
        <ThemedText style={styles.buttonText}>Sign Out</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  button: {
    marginTop: 20,
    backgroundColor: '#d9534f',
    padding: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
});
