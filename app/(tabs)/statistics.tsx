import { HydrationInsights } from '@/components/HydrationInsights';
import { useColorScheme } from '@/hooks/use-color-scheme';
import waterService, { WaterEntry } from '@/lib/waterService';
import { supabase } from '@/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ThemedText } from '../../components/themed-text';

export default function StatisticsScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [entries, setEntries] = useState<WaterEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [badges, setBadges] = useState<string[]>([]);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/auth/login');
        return;
      }
      const fetchedEntries = await waterService.getEntries();
      setEntries(fetchedEntries);
    } catch (error) {
      console.error('Error loading entries:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate daily stats
  const dailyStats = useMemo(() => {
    const today = new Date().toDateString();
    const todayEntries = entries.filter(e => new Date(e.date).toDateString() === today);
    const todayTotal = todayEntries.reduce((sum, e) => sum + (e.cups * 250) + (e.bottles * 500), 0);
    
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    const yesterdayEntries = entries.filter(e => new Date(e.date).toDateString() === yesterday);
    const yesterdayTotal = yesterdayEntries.reduce((sum, e) => sum + (e.cups * 250) + (e.bottles * 500), 0);

    return {
      today: todayTotal,
      yesterday: yesterdayTotal,
      difference: todayTotal - yesterdayTotal,
      progress: Math.min((todayTotal / 2000) * 100, 100),
      goalMet: todayTotal >= 2000,
    };
  }, [entries]);

  // Calculate weekly data
  const weeklyData = useMemo(() => {
    const last7Days = [];
    const now = Date.now();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now - i * 86400000);
      const dateStr = date.toDateString();
      const dayEntries = entries.filter(e => new Date(e.date).toDateString() === dateStr);
      const ml = dayEntries.reduce((sum, e) => sum + (e.cups * 250) + (e.bottles * 500), 0);
      
      last7Days.push({
        date: dateStr,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        ml,
        goalMet: ml >= 2000,
      });
    }

    const weekTotal = last7Days.reduce((sum, day) => sum + day.ml, 0);
    const weekAverage = weekTotal / 7;
    const daysWithData = last7Days.filter(day => day.ml > 0).length;
    const daysMetGoal = last7Days.filter(day => day.goalMet).length;
    const completionRate = daysWithData > 0 ? Math.round((daysMetGoal / daysWithData) * 100) : 0;

    return {
      last7Days,
      weekTotal,
      weekAverage,
      completionRate,
    };
  }, [entries]);

  // Calculate hydration score
  const hydrationScore = useMemo(() => {
    const goalAchievement = dailyStats.goalMet ? 40 : (dailyStats.today / 2000) * 40;
    
    const daysWithData = weeklyData.last7Days.filter(d => d.ml > 0).length;
    const consistency = daysWithData > 0 ? (daysWithData / 7) * 30 : 0;
    
    const avgVsGoal = weeklyData.weekAverage / 2000;
    const averageScore = Math.min(avgVsGoal, 1) * 20;
    
    const todayEntries = entries.filter(e => new Date(e.date).toDateString() === new Date().toDateString());
    const hasVariety = todayEntries.length >= 3;
    const distributionScore = hasVariety ? 10 : (todayEntries.length / 3) * 10;
    
    const totalScore = goalAchievement + consistency + averageScore + distributionScore;
    
    let grade = 'F';
    let gradeColor = '#f44336';
    
    if (totalScore >= 90) { grade = 'A+'; gradeColor = '#4CAF50'; }
    else if (totalScore >= 85) { grade = 'A'; gradeColor = '#66BB6A'; }
    else if (totalScore >= 80) { grade = 'A-'; gradeColor = '#81C784'; }
    else if (totalScore >= 75) { grade = 'B+'; gradeColor = '#9CCC65'; }
    else if (totalScore >= 70) { grade = 'B'; gradeColor = '#AED581'; }
    else if (totalScore >= 65) { grade = 'B-'; gradeColor = '#C5E1A5'; }
    else if (totalScore >= 60) { grade = 'C+'; gradeColor = '#FFF176'; }
    else if (totalScore >= 55) { grade = 'C'; gradeColor = '#FFD54F'; }
    else if (totalScore >= 50) { grade = 'C-'; gradeColor = '#FFCA28'; }
    else if (totalScore >= 45) { grade = 'D+'; gradeColor = '#FFB74D'; }
    else if (totalScore >= 40) { grade = 'D'; gradeColor = '#FFA726'; }
    else if (totalScore >= 35) { grade = 'D-'; gradeColor = '#FF9800'; }
    
    return {
      score: Math.round(totalScore),
      grade,
      gradeColor,
    };
  }, [dailyStats, weeklyData, entries]);

  // Generate insights
  const insights = useMemo(() => {
    const tips: string[] = [];
    const todayEntries = entries.filter(e => new Date(e.date).toDateString() === new Date().toDateString());
    
    const morningDrinks = todayEntries.filter(e => {
      const hour = new Date(e.start_time).getHours();
      return hour >= 6 && hour < 12;
    }).length;
    
    const afternoonDrinks = todayEntries.filter(e => {
      const hour = new Date(e.start_time).getHours();
      return hour >= 12 && hour < 18;
    }).length;
    
    const eveningDrinks = todayEntries.filter(e => {
      const hour = new Date(e.start_time).getHours();
      return hour >= 18 && hour < 24;
    }).length;

    if (morningDrinks === 0 && todayEntries.length > 0) {
      tips.push("🌅 Try drinking water first thing in the morning to kickstart hydration");
    }
    
    if (afternoonDrinks > morningDrinks + eveningDrinks) {
      tips.push("⚖️ Your hydration is afternoon-heavy. Try spreading it throughout the day");
    }
    
    if (dailyStats.difference > 0) {
      tips.push(`📈 You're ${dailyStats.difference}ml ahead of yesterday - keep it up!`);
    } else if (dailyStats.difference < 0) {
      tips.push(`📉 You're ${Math.abs(dailyStats.difference)}ml behind yesterday. You can catch up!`);
    }
    
    if (weeklyData.completionRate >= 80) {
      tips.push("🌟 Excellent consistency this week! You're building a great habit");
    } else if (weeklyData.completionRate < 50) {
      tips.push("💪 Try to be more consistent - small daily wins add up!");
    }
    
    if (dailyStats.today >= 2000 && dailyStats.today < 2500) {
      tips.push("🎯 Perfect hydration today! This is the sweet spot");
    } else if (dailyStats.today >= 3000) {
      tips.push("💧 Wow! You're exceeding your goal by a lot. Great job!");
    }

    return tips;
  }, [entries, dailyStats, weeklyData]);

  // Check for badges
  useEffect(() => {
    const earnedBadges: string[] = [];
    const todayEntries = entries.filter(e => new Date(e.date).toDateString() === new Date().toDateString());
    
    const hasEarlyDrink = todayEntries.some(e => {
      const hour = new Date(e.start_time).getHours();
      return hour >= 6 && hour <= 9;
    });
    if (hasEarlyDrink) earnedBadges.push('🌅 Early Bird');
    
    const hasLateDrink = todayEntries.some(e => {
      const hour = new Date(e.start_time).getHours();
      return hour >= 21 && hour <= 23;
    });
    if (hasLateDrink) earnedBadges.push('🦉 Night Owl');
    
    const calculateStreak = () => {
      const sortedDates = Array.from(new Set(
        entries
          .map(e => new Date(e.date).toDateString())
          .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      ));
      
      let currentStreak = 0;
      const today = new Date().toDateString();
      
      for (let i = 0; i < sortedDates.length; i++) {
        const expectedDate = new Date(Date.now() - i * 86400000).toDateString();
        if (sortedDates[i] === expectedDate) {
          const dayEntries = entries.filter(e => new Date(e.date).toDateString() === expectedDate);
          const dayTotal = dayEntries.reduce((sum, e) => sum + (e.cups * 250) + (e.bottles * 500), 0);
          if (dayTotal >= 2000) {
            currentStreak++;
          } else {
            break;
          }
        } else {
          break;
        }
      }
      
      return currentStreak;
    };
    
    const streak = calculateStreak();
    if (streak >= 7) earnedBadges.push('🔥 Streak Master');
    
    if (dailyStats.today >= 3000) earnedBadges.push('🏆 Overachiever');
    
    if (weeklyData.completionRate === 100 && weeklyData.last7Days.every(d => d.ml > 0)) {
      earnedBadges.push('✨ Perfect Week');
    }
    
    setBadges(earnedBadges);
  }, [entries, dailyStats, weeklyData]);

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
        <ThemedText type="title" style={styles.title}>📊 Statistics</ThemedText>

        {/* Achievement Badges */}
        {badges.length > 0 && (
          <View style={styles.badgesContainer}>
            {badges.map((badge, index) => (
              <View key={index} style={[styles.badge, styles.glassEffect]}>
                <ThemedText style={styles.badgeText}>{badge}</ThemedText>
              </View>
            ))}
          </View>
        )}

        {/* Hydration Insights Component */}
        <HydrationInsights
          hydrationScore={{
            grade: hydrationScore.grade,
            color: hydrationScore.gradeColor,
            score: hydrationScore.score,
          }}
          insights={insights}
          weeklyData={{
            days: weeklyData.last7Days,
            weekTotal: weeklyData.weekTotal,
            weekAverage: weeklyData.weekAverage,
            completionRate: weeklyData.completionRate,
          }}
        />
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
  },
  title: {
    marginTop: 20,
    marginBottom: 16,
    textAlign: 'center',
    color: '#fff',
    fontWeight: '700',
    fontSize: 28,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  badge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  glassEffect: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
});
