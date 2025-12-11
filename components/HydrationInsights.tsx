import { useColorScheme } from '@/hooks/use-color-scheme';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from './themed-text';

interface HydrationInsightsProps {
  hydrationScore: {
    grade: string;
    color: string;
    score: number;
  };
  insights: string[];
  weeklyData: {
    days: Array<{ date: string; dayName: string; ml: number; goalMet: boolean }>;
    weekTotal: number;
    weekAverage: number;
    completionRate: number;
  };
}

export function HydrationInsights({ hydrationScore, insights, weeklyData }: HydrationInsightsProps) {
  const colorScheme = useColorScheme();

  return (
    <View style={styles.container}>
      {/* Hydration Grade Badge */}
      <View style={[styles.gradeBadge, { backgroundColor: hydrationScore.color }]}>
        <ThemedText style={styles.gradeText}>{hydrationScore.grade}</ThemedText>
        <ThemedText style={styles.gradeLabel}>Hydration Score</ThemedText>
      </View>

      {/* Smart Insights Card */}
      {insights.length > 0 && (
        <View style={[styles.insightsCard, styles.glassEffect]}>
          <LinearGradient
            colors={colorScheme === 'dark'
              ? ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']
              : ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)']}
            style={styles.gradientOverlay}
          />
          <View style={styles.cardContent}>
            <ThemedText style={styles.insightsTitle}>💡 Smart Insights</ThemedText>
            {insights.map((insight, index) => (
              <ThemedText key={index} style={styles.insightText}>• {insight}</ThemedText>
            ))}
          </View>
        </View>
      )}

      {/* Weekly Progress Chart */}
      <View style={[styles.chartCard, styles.glassEffect]}>
        <LinearGradient
          colors={colorScheme === 'dark'
            ? ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']
            : ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)']}
          style={styles.gradientOverlay}
        />
        <View style={styles.cardContent}>
          <ThemedText style={styles.chartTitle}>📊 Last 7 Days</ThemedText>
          
          {/* Bar Chart */}
          <View style={styles.chartContainer}>
            {weeklyData.days.map((day, index) => {
              const heightPercentage = Math.min((day.ml / 2000) * 100, 100);
              return (
                <View key={index} style={styles.barWrapper}>
                  <View style={styles.barContainer}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: `${heightPercentage}%`,
                          backgroundColor: day.goalMet ? '#4CAF50' : '#2196F3',
                        },
                      ]}
                    />
                  </View>
                  <ThemedText style={styles.dayLabel}>{day.dayName}</ThemedText>
                </View>
              );
            })}
          </View>

          {/* Stats Summary */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <ThemedText style={styles.statValue}>
                {(weeklyData.weekTotal / 1000).toFixed(1)}L
              </ThemedText>
              <ThemedText style={styles.statLabel}>Week Total</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText style={styles.statValue}>
                {Math.round(weeklyData.weekAverage)}ml
              </ThemedText>
              <ThemedText style={styles.statLabel}>Daily Avg</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText style={styles.statValue}>
                {weeklyData.completionRate}%
              </ThemedText>
              <ThemedText style={styles.statLabel}>Success Rate</ThemedText>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
  },
  gradeBadge: {
    alignSelf: 'center',
    minWidth: 90,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  gradeText: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#fff',
    letterSpacing: -0.5,
  },
  gradeLabel: {
    fontSize: 12,
    textAlign: 'center',
    color: '#fff',
    marginTop: 4,
  },
  insightsCard: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  chartCard: {
    marginBottom: 16,
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
  cardContent: {
    padding: 20,
  },
  insightsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  insightText: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 6,
    opacity: 0.9,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 150,
    marginBottom: 16,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  barContainer: {
    flex: 1,
    width: '80%',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    minHeight: 4,
  },
  dayLabel: {
    fontSize: 10,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.3)',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2196F3',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.7,
  },
});
