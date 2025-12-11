import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

interface WaterIntakeModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: {
    cups: number;
    bottles: number;
    startTime: Date;
    endTime: Date;
  }) => void;
}

export function WaterIntakeModal({ visible, onClose, onSubmit }: WaterIntakeModalProps) {
  const [cups, setCups] = useState('1');
  const [bottles, setBottles] = useState('1');
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date(Date.now() + 8 * 60 * 60 * 1000)); // 8 hours from now
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const handleSubmit = () => {
    onSubmit({
      cups: Number(cups) || 0,
      bottles: Number(bottles) || 0,
      startTime,
      endTime,
    });
    // Reset form
    setCups('1');
    setBottles('1');
    setStartTime(new Date());
    setEndTime(new Date(Date.now() + 8 * 60 * 60 * 1000));
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.centeredView}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
          >
            <ThemedView style={styles.modalView}>
          <ThemedText type="subtitle" style={styles.modalTitle}>
            Add Water Intake
          </ThemedText>

          <View style={styles.inputContainer}>
            <ThemedText>Cups:</ThemedText>
            <TextInput
              style={styles.input}
              value={cups}
              onChangeText={setCups}
              keyboardType="numeric"
              placeholder="Number of cups"
            />
          </View>

          <View style={styles.inputContainer}>
            <ThemedText>Bottles:</ThemedText>
            <TextInput
              style={styles.input}
              value={bottles}
              onChangeText={setBottles}
              keyboardType="numeric"
              placeholder="Number of bottles"
            />
          </View>

          <View style={styles.inputContainer}>
            <ThemedText>Start Time:</ThemedText>
            <TouchableOpacity
              style={styles.timeButton}
              onPress={() => setShowStartPicker(true)}>
              <ThemedText>{formatTime(startTime)}</ThemedText>
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <ThemedText>End Time:</ThemedText>
            <TouchableOpacity
              style={styles.timeButton}
              onPress={() => setShowEndPicker(true)}>
              <ThemedText>{formatTime(endTime)}</ThemedText>
            </TouchableOpacity>
          </View>

          {(showStartPicker || showEndPicker) && Platform.OS !== 'web' && (
            <DateTimePicker
              value={showStartPicker ? startTime : endTime}
              mode="time"
              is24Hour={false}
              onChange={(event, date) => {
                if (showStartPicker) {
                  setShowStartPicker(false);
                  if (date) setStartTime(date);
                } else {
                  setShowEndPicker(false);
                  if (date) setEndTime(date);
                }
              }}
            />
          )}

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onClose}>
              <ThemedText style={styles.buttonText}>Cancel</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.submitButton]} onPress={handleSubmit}>
              <ThemedText style={styles.buttonText}>Submit</ThemedText>
            </TouchableOpacity>
          </View>
            </ThemedView>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalView: {
    width: '90%',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    marginBottom: 20,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  input: {
    width: '70%',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: 'white',
  },
  timeButton: {
    width: '70%',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: 'white',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    width: '45%',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButton: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});