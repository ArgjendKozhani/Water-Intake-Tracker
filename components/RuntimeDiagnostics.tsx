import React, { useCallback } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

export type DiagnosticsState = {
  reachable: boolean | null; // null = unknown/loading
  authSession: boolean | null; // null = unknown/loading
  lastError?: string;
};

type Props = {
  state: DiagnosticsState;
  onRefresh: () => void;
  onDismiss?: () => void;
};

export function RuntimeDiagnostics({ state, onRefresh, onDismiss }: Props) {
  const statusColor = state.reachable === false || state.lastError ? '#d9534f' : '#4CAF50';

  const message = (() => {
    if (state.lastError) return state.lastError;
    if (state.reachable === null) return 'Checking Supabase connectivity…';
    if (state.reachable === false) return 'Supabase unreachable';
    if (state.authSession === false) return 'Not signed in';
    if (state.authSession) return 'Signed in & API reachable';
    return 'Ready';
  })();

  const handleRefresh = useCallback(() => {
    onRefresh();
  }, [onRefresh]);

  return (
    <ThemedView style={[styles.container, { borderColor: statusColor }]}>
      <View style={{ flex: 1 }}>
        <ThemedText style={[styles.message, { color: statusColor }]}>{message}</ThemedText>
      </View>
      <TouchableOpacity style={styles.button} onPress={handleRefresh} accessibilityRole="button">
        <ThemedText style={styles.buttonText}>Refresh</ThemedText>
      </TouchableOpacity>
      {onDismiss && (
        <TouchableOpacity style={[styles.button, styles.dismiss]} onPress={onDismiss} accessibilityRole="button">
          <ThemedText style={styles.buttonText}>×</ThemedText>
        </TouchableOpacity>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 12,
  },
  message: {
    fontSize: 12,
    fontWeight: '600',
  },
  button: {
    marginLeft: 8,
    backgroundColor: '#007AFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  dismiss: {
    backgroundColor: '#555',
  },
  buttonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default RuntimeDiagnostics;