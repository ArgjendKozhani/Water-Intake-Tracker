import { WaterIntakeModal } from '@/components/WaterIntakeModal';
import { scheduleWaterReminders } from '@/lib/notificationService';
import waterService, { WaterEntry } from '@/lib/waterService';
import { supabase } from '@/supabase';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';

export default function HomeScreen() {
  const router = useRouter();

  const [entries, setEntries] = useState<WaterEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

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

  const handleAdd = async (data: {
    cups: number;
    bottles: number;
    startTime: Date;
    endTime: Date;
  }) => {
    if (data.cups <= 0 && data.bottles <= 0) {
      Alert.alert('Invalid', 'Please enter a positive number of cups or bottles');
      return;
    }
    setLoading(true);
    try {
      const created = await waterService.addEntry({
        cups: data.cups,
        bottles: data.bottles,
        start_time: data.startTime.toISOString(),
        end_time: data.endTime.toISOString(),
      });
      if (created) {
        setEntries((p) => [created, ...p]);
        // Schedule notifications
        await scheduleWaterReminders(data.startTime, data.endTime);
        setModalVisible(false);
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

  const handleUpdate = async (id: string, type: 'cups' | 'bottles', change: number) => {
    setLoading(true);
    const entry = entries.find(e => e.id === id);
    if (!entry) {
      Alert.alert('Error', 'Entry not found');
      setLoading(false);
      return;
    }

    const updates = {
      [type]: Math.max(0, entry[type] + change)
    };

    const updated = await waterService.updateEntry(id, updates);
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

      <TouchableOpacity 
        style={[styles.button, styles.addButton]} 
        onPress={() => setModalVisible(true)}
        disabled={loading}
      >
        <ThemedText style={styles.buttonText}>Add Water Intake</ThemedText>
      </TouchableOpacity>

      <WaterIntakeModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleAdd}
      />

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
              <ThemedText style={styles.itemText}>
                {item.cups > 0 ? `${item.cups} cup(s)` : ''} 
                {item.bottles > 0 ? `${item.cups > 0 ? ' + ' : ''}${item.bottles} bottle(s)` : ''}
              </ThemedText>
              <ThemedText style={styles.itemSub}>
                {new Date(item.start_time).toLocaleTimeString()} - {new Date(item.end_time).toLocaleTimeString()}
              </ThemedText>
              <ThemedText style={styles.itemSub}>{new Date(item.date).toLocaleDateString()}</ThemedText>
            </View>

            <View style={styles.controls}>
              <View style={styles.controlGroup}>
                <ThemedText style={styles.controlLabel}>Cups</ThemedText>
                <View style={styles.buttonGroup}>
                  <TouchableOpacity
                    style={styles.smallButton}
                    onPress={() => handleUpdate(item.id, 'cups', 1)}
                  >
                    <ThemedText>＋</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.smallButton}
                    onPress={() => handleUpdate(item.id, 'cups', -1)}
                  >
                    <ThemedText>－</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.controlGroup}>
                <ThemedText style={styles.controlLabel}>Bottles</ThemedText>
                <View style={styles.buttonGroup}>
                  <TouchableOpacity
                    style={styles.smallButton}
                    onPress={() => handleUpdate(item.id, 'bottles', 1)}
                  >
                    <ThemedText>＋</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.smallButton}
                    onPress={() => handleUpdate(item.id, 'bottles', -1)}
                  >
                    <ThemedText>－</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>

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
  addButton: {
    backgroundColor: '#4CAF50',
    width: '100%',
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
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
    justifyContent: 'space-between',
    gap: 8,
  },
  controlGroup: {
    alignItems: 'center',
  },
  controlLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  buttonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
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
