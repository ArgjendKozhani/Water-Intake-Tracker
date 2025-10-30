import waterService, { WaterEntry } from '@/lib/waterService';
import { supabase } from '@/supabase';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';

export default function HomeScreen() {
  const router = useRouter();

  const [entries, setEntries] = useState<WaterEntry[]>([]);
  const [newCups, setNewCups] = useState<string>('1');
  const [loading, setLoading] = useState(false);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.replace('/auth/login');
  };

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    setLoading(true);
    const data = await waterService.getEntries();
    setEntries(data);
    setLoading(false);
  };

  const handleAdd = async () => {
    const cups = Math.max(0, Number(newCups) || 0);
    if (cups <= 0) {
      Alert.alert('Invalid', 'Please enter a positive number of cups');
      return;
    }
    setLoading(true);
    try {
      const created = await waterService.addEntry(cups);
      if (created) {
        setEntries((p) => [created, ...p]);
        setNewCups('1');
      } else {
        Alert.alert(
          'Error',
          'Could not add entry. Please make sure you are signed in and try again.'
        );
      }
    } catch (err) {
      Alert.alert('Error', `Could not add entry: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id: string, cups: number) => {
    setLoading(true);
    const updated = await waterService.updateEntry(id, cups);
    if (updated) {
      setEntries((prev) => prev.map((e) => (e.id === id ? updated : e)));
    } else {
      Alert.alert('Error', 'Could not update entry');
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    Alert.alert('Delete', 'Are you sure you want to delete this entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          const ok = await waterService.deleteEntry(id);
          if (ok) setEntries((p) => p.filter((e) => e.id !== id));
          else Alert.alert('Error', 'Could not delete entry');
          setLoading(false);
        },
      },
    ]);
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Home</ThemedText>

      <View style={styles.addRow}>
        <TextInput
          value={newCups}
          onChangeText={setNewCups}
          keyboardType="numeric"
          style={styles.input}
          placeholder="Cups"
        />
        <TouchableOpacity style={[styles.button, { marginLeft: 8 }]} onPress={handleAdd} disabled={loading}>
          <ThemedText style={styles.buttonText}>Add</ThemedText>
        </TouchableOpacity>
      </View>

      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        refreshing={loading}
        onRefresh={loadEntries}
        style={{ width: '100%', marginTop: 16 }}
        ListEmptyComponent={() => (
          <ThemedText style={{ textAlign: 'center', marginTop: 20 }}>No entries yet</ThemedText>
        )}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.itemText}>{item.cups} cup(s)</ThemedText>
              <ThemedText style={styles.itemSub}>{new Date(item.date).toLocaleDateString()}</ThemedText>
            </View>

            <View style={styles.controls}>
              <TouchableOpacity
                style={styles.smallButton}
                onPress={() => handleUpdate(item.id, item.cups + 1)}
              >
                <ThemedText>＋</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.smallButton}
                onPress={() => handleUpdate(item.id, Math.max(0, item.cups - 1))}
              >
                <ThemedText>－</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item.id)}>
                <ThemedText style={{ color: 'white' }}>Del</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <TouchableOpacity style={[styles.button, { marginTop: 12 }]} onPress={signOut}>
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
  addRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  input: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: 'white',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'black',
    marginBottom: 10,
  },
  itemText: {
    fontSize: 16,
    fontWeight: '600',
  },
  itemSub: {
    fontSize: 12,
    color: '#666',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  smallButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'black',
    marginHorizontal: 4,
  },
  deleteButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#d9534f',
    marginLeft: 8,
  },
});
