import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Linking, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function ExploreScreen() {
  const colorScheme = useColorScheme();

  const openLink = (url: string) => {
    Linking.openURL(url);
  };

  const tips = [
    {
      emoji: '☀️',
      title: 'Start Your Day Right',
      description: 'Drink a glass of water immediately after waking up to kickstart your metabolism and rehydrate after sleep.',
    },
    {
      emoji: '🏃',
      title: 'Exercise Hydration',
      description: 'Drink 500ml 2 hours before exercise, and 150-250ml every 15-20 minutes during activity.',
    },
    {
      emoji: '🍎',
      title: 'Eat Your Water',
      description: 'Foods like watermelon, cucumber, and celery are 90%+ water and count toward your hydration goal.',
    },
    {
      emoji: '⏰',
      title: 'Set Reminders',
      description: 'Use hourly reminders to build a consistent drinking habit throughout the day.',
    },
    {
      emoji: '🌡️',
      title: 'Listen to Your Body',
      description: 'Thirst, dark urine, dry lips, and fatigue are signs you need more water.',
    },
    {
      emoji: '☕',
      title: 'Balance Caffeine',
      description: 'For every cup of coffee or tea, drink an extra glass of water to offset dehydration.',
    },
  ];

  const benefits = [
    { emoji: '🧠', text: 'Improved Focus & Memory' },
    { emoji: '💪', text: 'Better Physical Performance' },
    { emoji: '✨', text: 'Clearer, Healthier Skin' },
    { emoji: '⚡', text: 'Increased Energy Levels' },
    { emoji: '🛡️', text: 'Stronger Immune System' },
    { emoji: '❤️', text: 'Better Heart Health' },
  ];

  const hydrationGoals = [
    { activity: 'Sedentary Adult', amount: '2.0L', description: 'Desk job, minimal activity' },
    { activity: 'Active Adult', amount: '2.5-3L', description: 'Regular exercise 3-5x/week' },
    { activity: 'Athlete', amount: '3.5-4L+', description: 'Intense training or competition' },
    { activity: 'Pregnant Women', amount: '2.5L', description: 'Supporting fetal development' },
    { activity: 'Hot Climate', amount: '+0.5-1L', description: 'Add to base requirement' },
  ];

  const myths = [
    {
      myth: '8 glasses a day for everyone',
      truth: 'Needs vary by body weight, activity level, and climate. 2L is a good baseline.',
    },
    {
      myth: 'Coffee and tea dehydrate you',
      truth: 'While caffeinated, they still contribute to hydration. Just balance with extra water.',
    },
    {
      myth: 'Clear urine means perfect hydration',
      truth: 'Pale yellow is ideal. Too clear might mean overhydration.',
    },
    {
      myth: 'You can\'t drink too much water',
      truth: 'Overhydration is rare but possible. Listen to your body and don\'t force excessive amounts.',
    },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={colorScheme === 'dark'
          ? ['#0a1929', '#1e3a5f', '#2d5f8d']
          : ['#e3f2fd', '#90caf9', '#42a5f5']}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <ThemedText type="title" style={styles.title}>🔍 Discover</ThemedText>
        <ThemedText style={styles.subtitle}>Hydration tips, benefits & insights</ThemedText>

        {/* Benefits Section */}
        <View style={[styles.section, styles.glassEffect]}>
          <LinearGradient
            colors={colorScheme === 'dark'
              ? ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']
              : ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)']}
            style={styles.gradientOverlay}
          />
          <View style={styles.sectionContent}>
            <ThemedText style={styles.sectionTitle}>💎 Benefits of Staying Hydrated</ThemedText>
            <View style={styles.benefitsGrid}>
              {benefits.map((benefit, index) => (
                <View key={index} style={styles.benefitItem}>
                  <ThemedText style={styles.benefitEmoji}>{benefit.emoji}</ThemedText>
                  <ThemedText style={styles.benefitText}>{benefit.text}</ThemedText>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Daily Tips Section */}
        <View style={[styles.section, styles.glassEffect]}>
          <LinearGradient
            colors={colorScheme === 'dark'
              ? ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']
              : ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)']}
            style={styles.gradientOverlay}
          />
          <View style={styles.sectionContent}>
            <ThemedText style={styles.sectionTitle}>💡 Hydration Tips</ThemedText>
            {tips.map((tip, index) => (
              <View key={index} style={styles.tipCard}>
                <ThemedText style={styles.tipEmoji}>{tip.emoji}</ThemedText>
                <View style={styles.tipContent}>
                  <ThemedText style={styles.tipTitle}>{tip.title}</ThemedText>
                  <ThemedText style={styles.tipDescription}>{tip.description}</ThemedText>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Hydration Goals Section */}
        <View style={[styles.section, styles.glassEffect]}>
          <LinearGradient
            colors={colorScheme === 'dark'
              ? ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']
              : ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)']}
            style={styles.gradientOverlay}
          />
          <View style={styles.sectionContent}>
            <ThemedText style={styles.sectionTitle}>🎯 Hydration Goals by Activity</ThemedText>
            {hydrationGoals.map((goal, index) => (
              <View key={index} style={styles.goalCard}>
                <View style={styles.goalHeader}>
                  <ThemedText style={styles.goalActivity}>{goal.activity}</ThemedText>
                  <ThemedText style={styles.goalAmount}>{goal.amount}</ThemedText>
                </View>
                <ThemedText style={styles.goalDescription}>{goal.description}</ThemedText>
              </View>
            ))}
          </View>
        </View>

        {/* Myths & Facts Section */}
        <View style={[styles.section, styles.glassEffect]}>
          <LinearGradient
            colors={colorScheme === 'dark'
              ? ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']
              : ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)']}
            style={styles.gradientOverlay}
          />
          <View style={styles.sectionContent}>
            <ThemedText style={styles.sectionTitle}>❌ Myths vs ✅ Facts</ThemedText>
            {myths.map((item, index) => (
              <View key={index} style={styles.mythCard}>
                <View style={styles.mythRow}>
                  <ThemedText style={styles.mythLabel}>❌ Myth:</ThemedText>
                  <ThemedText style={styles.mythText}>{item.myth}</ThemedText>
                </View>
                <View style={styles.mythRow}>
                  <ThemedText style={styles.truthLabel}>✅ Truth:</ThemedText>
                  <ThemedText style={styles.truthText}>{item.truth}</ThemedText>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Resources Section */}
        <View style={[styles.section, styles.glassEffect]}>
          <LinearGradient
            colors={colorScheme === 'dark'
              ? ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']
              : ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)']}
            style={styles.gradientOverlay}
          />
          <View style={styles.sectionContent}>
            <ThemedText style={styles.sectionTitle}>📚 Learn More</ThemedText>
            <TouchableOpacity 
              style={styles.resourceButton}
              onPress={() => openLink('https://www.mayoclinic.org/healthy-lifestyle/nutrition-and-healthy-eating/in-depth/water/art-20044256')}
            >
              <ThemedText style={styles.resourceButtonText}>Mayo Clinic: Water - How much should you drink?</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.resourceButton}
              onPress={() => openLink('https://www.cdc.gov/healthyweight/healthy_eating/water-and-healthier-drinks.html')}
            >
              <ThemedText style={styles.resourceButtonText}>CDC: Water & Healthier Drinks</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.resourceButton}
              onPress={() => openLink('https://www.who.int/news-room/fact-sheets/detail/drinking-water')}
            >
              <ThemedText style={styles.resourceButtonText}>WHO: Drinking Water Facts</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 100,
  },
  title: {
    marginTop: 0,
    marginBottom: 8,
    textAlign: 'center',
    color: '#fff',
    fontWeight: '700',
    fontSize: 28,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    textAlign: 'center',
    color: '#fff',
    fontSize: 16,
    marginBottom: 24,
    opacity: 0.9,
  },
  section: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  glassEffect: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  gradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  sectionContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  benefitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  benefitItem: {
    width: '48%',
    paddingVertical: 20,
    paddingHorizontal: 12,
    marginBottom: 12,
    backgroundColor: 'rgba(33, 150, 243, 0.15)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  benefitEmoji: {
    fontSize: 36,
    marginBottom: 12,
    lineHeight: 40,
  },
  benefitText: {
    fontSize: 11,
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 16,
  },
  tipCard: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingVertical: 16,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    borderRadius: 12,
    alignItems: 'flex-start',
  },
  tipEmoji: {
    fontSize: 36,
    marginRight: 14,
    marginTop: 2,
    lineHeight: 40,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
    lineHeight: 20,
  },
  tipDescription: {
    fontSize: 13,
    lineHeight: 20,
    opacity: 0.85,
  },
  goalCard: {
    marginBottom: 12,
    padding: 14,
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    borderRadius: 12,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  goalActivity: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  goalAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#4CAF50',
    flexShrink: 0,
  },
  goalDescription: {
    fontSize: 13,
    opacity: 0.8,
  },
  mythCard: {
    marginBottom: 16,
    padding: 14,
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    borderRadius: 12,
  },
  mythRow: {
    marginBottom: 8,
  },
  mythLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f44336',
    marginBottom: 4,
  },
  mythText: {
    fontSize: 13,
    fontStyle: 'italic',
    opacity: 0.9,
    lineHeight: 20,
  },
  truthLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4CAF50',
    marginBottom: 4,
  },
  truthText: {
    fontSize: 13,
    opacity: 0.9,
    lineHeight: 20,
  },
  resourceButton: {
    padding: 14,
    backgroundColor: 'rgba(33, 150, 243, 0.2)',
    borderRadius: 12,
    marginBottom: 12,
  },
  resourceButtonText: {
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
    lineHeight: 20,
  },
});
