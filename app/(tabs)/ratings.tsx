import { supabase } from '@/supabase';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { ThemedText } from '../../components/themed-text';

export default function RatingsScreen() {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    loadUserEmail();
  }, []);

  const loadUserEmail = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserEmail(user.email || '');
    }
  };

  const categories = [
    { id: 'ui', label: 'Design & UI', icon: 'color-palette' },
    { id: 'features', label: 'Features', icon: 'bulb' },
    { id: 'performance', label: 'Performance', icon: 'speedometer' },
    { id: 'usability', label: 'Ease of Use', icon: 'hand-left' },
    { id: 'overall', label: 'Overall', icon: 'star' },
  ];

  const handleStarPress = (value: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRating(value);
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a star rating before submitting.');
      return;
    }

    if (!category) {
      Alert.alert('Category Required', 'Please select a category for your rating.');
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        Alert.alert('Error', 'You must be logged in to submit a rating.');
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from('app_ratings')
        .insert({
          user_id: user.id,
          rating: rating,
          category: category,
          feedback: feedback.trim() || null,
          created_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Rating submission error:', error);
        Alert.alert('Error', 'Failed to submit rating. Please try again.');
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setSubmitted(true);
        Alert.alert(
          'Thank You! 🎉',
          'Your rating has been submitted successfully. We appreciate your feedback!',
          [
            {
              text: 'Submit Another',
              onPress: () => {
                setRating(0);
                setFeedback('');
                setCategory('');
                setSubmitted(false);
              },
            },
            { text: 'OK', style: 'cancel' },
          ]
        );
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getRatingLabel = (stars: number) => {
    switch (stars) {
      case 1: return 'Poor';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Very Good';
      case 5: return 'Excellent';
      default: return 'Tap to rate';
    }
  };

  return (
    <LinearGradient
      colors={['#1E3A8A', '#2563EB', '#3B82F6']}
      style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="star" size={50} color="#FFFFFF" />
          </View>
          <ThemedText style={styles.title}>Rate Our App</ThemedText>
          <ThemedText style={styles.subtitle}>
            Your feedback helps us improve! 💧
          </ThemedText>
        </View>

        {/* Main Card */}
        <View style={styles.card}>
          {/* Star Rating */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>How would you rate us?</ThemedText>
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => handleStarPress(star)}
                  style={styles.starButton}
                  disabled={submitted}>
                  <Ionicons
                    name={star <= (hoveredRating || rating) ? 'star' : 'star-outline'}
                    size={50}
                    color={star <= (hoveredRating || rating) ? '#FFD700' : '#CBD5E1'}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <ThemedText style={styles.ratingLabel}>
              {getRatingLabel(rating)}
            </ThemedText>
          </View>

          {/* Category Selection */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>What are you rating?</ThemedText>
            <View style={styles.categoriesContainer}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryButton,
                    category === cat.id && styles.categoryButtonActive,
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setCategory(cat.id);
                  }}
                  disabled={submitted}>
                  <Ionicons
                    name={cat.icon as any}
                    size={24}
                    color={category === cat.id ? '#FFFFFF' : '#2196F3'}
                  />
                  <ThemedText
                    style={[
                      styles.categoryText,
                      category === cat.id && styles.categoryTextActive,
                    ]}>
                    {cat.label}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Feedback Text */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>
              Additional Feedback (Optional)
            </ThemedText>
            <View style={styles.inputWrapper}>
              <Ionicons name="chatbox-outline" size={20} color="#2196F3" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Tell us what you think..."
                placeholderTextColor="#94A3B8"
                value={feedback}
                onChangeText={setFeedback}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                editable={!submitted}
              />
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, (loading || submitted) && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading || submitted}>
            <LinearGradient
              colors={submitted ? ['#10B981', '#059669'] : ['#2196F3', '#1976D2', '#1565C0']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitGradient}>
              <Ionicons
                name={submitted ? 'checkmark-circle' : loading ? 'hourglass' : 'send'}
                size={20}
                color="#FFFFFF"
                style={{ marginRight: 8 }}
              />
              <ThemedText style={styles.submitText}>
                {loading ? 'Submitting...' : submitted ? 'Submitted!' : 'Submit Rating'}
              </ThemedText>
            </LinearGradient>
          </TouchableOpacity>

          {/* Info Text */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={18} color="#3B82F6" />
            <ThemedText style={styles.infoText}>
              Your rating is anonymous and helps us improve the app experience.
            </ThemedText>
          </View>
        </View>

        {/* Stats Card */}
        <View style={styles.statsCard}>
          <ThemedText style={styles.statsTitle}>Why Your Rating Matters</ThemedText>
          <View style={styles.statRow}>
            <Ionicons name="people" size={24} color="#3B82F6" />
            <ThemedText style={styles.statText}>
              Helps us understand user satisfaction
            </ThemedText>
          </View>
          <View style={styles.statRow}>
            <Ionicons name="trending-up" size={24} color="#3B82F6" />
            <ThemedText style={styles.statText}>
              Guides future feature development
            </ThemedText>
          </View>
          <View style={styles.statRow}>
            <Ionicons name="construct" size={24} color="#3B82F6" />
            <ThemedText style={styles.statText}>
              Identifies areas for improvement
            </ThemedText>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  iconContainer: {
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
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  starButton: {
    padding: 4,
  },
  ratingLabel: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 8,
  },
  categoriesContainer: {
    gap: 10,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    gap: 12,
  },
  categoryButtonActive: {
    backgroundColor: '#2196F3',
    borderColor: '#1976D2',
  },
  categoryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  inputWrapper: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    minHeight: 120,
  },
  inputIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#1976D2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 16,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 12,
    borderRadius: 10,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#FFFFFF',
    lineHeight: 18,
  },
  statsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    gap: 12,
  },
  statText: {
    flex: 1,
    fontSize: 15,
    color: '#1E293B',
    fontWeight: '500',
  },
});
