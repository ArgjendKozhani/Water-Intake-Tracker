import { WaterIntakeModal } from '@/components/WaterIntakeModal';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { scheduleRecurringReminders, sendDrinkAddedNotification, sendGoalReachedNotification } from '@/lib/notificationService';
import waterService, { WaterEntry } from '@/lib/waterService';
import { supabase } from '@/supabase';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, Dimensions, PanResponder, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';

const SCREEN_WIDTH = Dimensions.get('window').width;

// Swipeable Item Component
const SwipeableItem = ({ 
  children, 
  onDelete, 
  colorScheme 
}: { 
  children: React.ReactNode; 
  onDelete: () => void; 
  colorScheme: 'light' | 'dark' | null | undefined;
}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) {
          translateX.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -100) {
          // Swipe threshold reached - delete
          Animated.timing(translateX, {
            toValue: -400,
            duration: 200,
            useNativeDriver: true,
          }).start(() => onDelete());
        } else {
          // Return to original position
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 50,
            friction: 7,
          }).start();
        }
      },
    })
  ).current;

  return (
    <View style={{ marginBottom: 10 }}>
      <View style={styles.deleteBackground}>
        <ThemedText style={styles.deleteBackgroundText}>🗑️ Delete</ThemedText>
      </View>
      <Animated.View
        style={[
          { transform: [{ translateX }] },
        ]}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
};

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();

  const [entries, setEntries] = useState<WaterEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [badges, setBadges] = useState<string[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const goalReachedToday = useRef(false);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const confettiRef = useRef<any>(null);

  // Calculate daily totals
  const dailyStats = useMemo(() => {
    const today = new Date().toLocaleDateString();
    const yesterday = new Date(Date.now() - 86400000).toLocaleDateString();
    
    const todayEntries = entries.filter(e => new Date(e.date).toLocaleDateString() === today);
    const yesterdayEntries = entries.filter(e => new Date(e.date).toLocaleDateString() === yesterday);
    
    const totalCups = todayEntries.reduce((sum, e) => sum + e.cups, 0);
    const totalBottles = todayEntries.reduce((sum, e) => sum + e.bottles, 0);
    const totalML = (totalCups * 250) + (totalBottles * 500);
    
    const yesterdayML = yesterdayEntries.reduce((sum, e) => sum + (e.cups * 250) + (e.bottles * 500), 0);
    const difference = totalML - yesterdayML;
    
    const goalML = 2000; // 2L daily goal
    const progress = Math.min(100, (totalML / goalML) * 100);
    const goalMet = totalML >= goalML;
    
    return { totalCups, totalBottles, totalML, progress, goalML, goalMet, yesterdayML, difference };
  }, [entries]);

  // Calculate weekly stats and chart data
  const weeklyData = useMemo(() => {
    const last7Days = [];
    const dailyTotals: { [key: string]: number } = {};
    
    // Calculate totals for each day
    entries.forEach(entry => {
      const date = new Date(entry.date).toLocaleDateString();
      const ml = (entry.cups * 250) + (entry.bottles * 500);
      dailyTotals[date] = (dailyTotals[date] || 0) + ml;
    });
    
    // Get last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString();
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      last7Days.push({
        date: dateStr,
        dayName,
        ml: dailyTotals[dateStr] || 0,
        goalMet: (dailyTotals[dateStr] || 0) >= 2000,
      });
    }
    
    const weekTotal = last7Days.reduce((sum, day) => sum + day.ml, 0);
    const weekAverage = weekTotal / 7;
    const daysWithData = last7Days.filter(d => d.ml > 0).length;
    const completionRate = daysWithData > 0 ? (last7Days.filter(d => d.goalMet).length / daysWithData) * 100 : 0;
    
    return { last7Days, weekTotal, weekAverage, completionRate };
  }, [entries]);

  // Calculate hydration score/grade
  const hydrationScore = useMemo(() => {
    const { totalML, goalML } = dailyStats;
    const { completionRate, weekAverage } = weeklyData;
    
    // Scoring factors
    const goalScore = Math.min(100, (totalML / goalML) * 100);
    const consistencyScore = completionRate;
    const averageScore = Math.min(100, (weekAverage / goalML) * 100);
    
    // Timing distribution (check if entries are spread throughout day)
    const today = new Date().toLocaleDateString();
    const todayEntries = entries.filter(e => new Date(e.date).toLocaleDateString() === today);
    const hours = todayEntries.map(e => new Date(e.start_time).getHours());
    const uniqueHours = new Set(hours).size;
    const distributionScore = Math.min(100, (uniqueHours / 8) * 100); // Ideal: 8 different hours
    
    // Weighted overall score
    const overallScore = (goalScore * 0.4) + (consistencyScore * 0.3) + (averageScore * 0.2) + (distributionScore * 0.1);
    
    let grade = 'F';
    let gradeColor = '#F44336';
    if (overallScore >= 90) { grade = 'A+'; gradeColor = '#4CAF50'; }
    else if (overallScore >= 85) { grade = 'A'; gradeColor = '#66BB6A'; }
    else if (overallScore >= 80) { grade = 'B+'; gradeColor = '#9CCC65'; }
    else if (overallScore >= 75) { grade = 'B'; gradeColor = '#FDD835'; }
    else if (overallScore >= 70) { grade = 'C+'; gradeColor = '#FFB74D'; }
    else if (overallScore >= 65) { grade = 'C'; gradeColor = '#FF9800'; }
    else if (overallScore >= 60) { grade = 'D'; gradeColor = '#FF7043'; }
    
    return { grade, gradeColor, overallScore: Math.round(overallScore) };
  }, [dailyStats, weeklyData, entries]);

  // Generate smart insights
  const insights = useMemo(() => {
    const today = new Date().toLocaleDateString();
    const todayEntries = entries.filter(e => new Date(e.date).toLocaleDateString() === today);
    
    if (todayEntries.length === 0) return ['Start your day with a glass of water! 💧'];
    
    const hours = todayEntries.map(e => new Date(e.start_time).getHours());
    const avgHour = hours.reduce((a, b) => a + b, 0) / hours.length;
    
    const morningCount = hours.filter(h => h >= 6 && h < 12).length;
    const afternoonCount = hours.filter(h => h >= 12 && h < 18).length;
    const eveningCount = hours.filter(h => h >= 18 && h < 24).length;
    
    const tips = [];
    
    if (morningCount > afternoonCount + eveningCount) {
      tips.push('🌅 Morning hydrator! Try to maintain this throughout the day.');
    } else if (afternoonCount > morningCount + eveningCount) {
      tips.push('☀️ You drink more in the afternoon. Consider hydrating earlier!');
    } else if (eveningCount > morningCount + afternoonCount) {
      tips.push('🌙 Evening drinker! Spread your intake more evenly during the day.');
    }
    
    if (dailyStats.totalML > dailyStats.yesterdayML && dailyStats.yesterdayML > 0) {
      tips.push(`📈 Great progress! ${dailyStats.difference}ml more than yesterday!`);
    }
    
    if (weeklyData.weekAverage > dailyStats.goalML) {
      tips.push(`⭐ You're ${Math.round(((weeklyData.weekAverage / dailyStats.goalML) - 1) * 100)}% ahead of your weekly average!`);
    }
    
    if (tips.length === 0) tips.push('Keep up the good hydration habits! 💪');
    
    return tips;
  }, [entries, dailyStats, weeklyData]);

  // Check and award badges
  useEffect(() => {
    const today = new Date().toLocaleDateString();
    const todayEntries = entries.filter(e => new Date(e.date).toLocaleDateString() === today);
    const newBadges: string[] = [];
    
    // Early Bird badge
    const morningEntries = todayEntries.filter(e => {
      const hour = new Date(e.start_time).getHours();
      return hour >= 6 && hour < 9;
    });
    if (morningEntries.length > 0) newBadges.push('🌅 Early Bird');
    
    // Night Owl badge
    const nightEntries = todayEntries.filter(e => {
      const hour = new Date(e.start_time).getHours();
      return hour >= 21 && hour < 24;
    });
    if (nightEntries.length > 0) newBadges.push('🦉 Night Owl');
    
    // Streak Master badge
    if (streak >= 7) newBadges.push('🔥 Streak Master');
    
    // Overachiever badge
    if (dailyStats.totalML >= dailyStats.goalML * 1.5) newBadges.push('🏆 Overachiever');
    
    // Perfect Week badge
    if (weeklyData.completionRate === 100 && weeklyData.last7Days.every(d => d.ml > 0)) {
      newBadges.push('✨ Perfect Week');
    }
    
    setBadges(newBadges);
  }, [entries, streak, dailyStats, weeklyData]);

  // Calculate streak from entries
  const calculateStreak = (entriesData: WaterEntry[]) => {
    const goalML = 2000;
    const dailyTotals = new Map<string, number>();
    
    entriesData.forEach(entry => {
      const date = new Date(entry.date).toLocaleDateString();
      const ml = (entry.cups * 250) + (entry.bottles * 500);
      dailyTotals.set(date, (dailyTotals.get(date) || 0) + ml);
    });

    let currentStreak = 0;
    let checkDate = new Date();
    
    while (true) {
      const dateStr = checkDate.toLocaleDateString();
      const dayTotal = dailyTotals.get(dateStr) || 0;
      
      if (dayTotal >= goalML) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    // Calculate best streak
    let bestStreak = 0;
    let tempStreak = 0;
    const sortedDates = Array.from(dailyTotals.keys()).sort();
    
    for (let i = 0; i < sortedDates.length; i++) {
      if ((dailyTotals.get(sortedDates[i]) || 0) >= goalML) {
        tempStreak++;
        bestStreak = Math.max(bestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }
    
    return { currentStreak, bestStreak: Math.max(bestStreak, currentStreak) };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.replace('/auth/login');
  };

  useEffect(() => {
    loadEntries();
    // Set up 30-minute recurring reminders
    scheduleRecurringReminders();
  }, []);

  const loadEntries = async () => {
    setLoading(true);
    const data = await waterService.getEntries();
    setEntries(data);
    const streaks = calculateStreak(data);
    setStreak(streaks.currentStreak);
    setBestStreak(streaks.bestStreak);
    setLoading(false);
  };
  
  // Animate progress bar when dailyStats changes
  useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: dailyStats.progress,
      useNativeDriver: false,
      tension: 50,
      friction: 7,
    }).start();
  }, [dailyStats.progress]);

  const handleQuickAdd = async (cups: number, bottles: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      const now = new Date();
      const created = await waterService.addEntry({
        cups,
        bottles,
        start_time: now.toISOString(),
        end_time: now.toISOString(),
      });
      if (created) {
        const newEntries = [created, ...entries];
        setEntries(newEntries);
        const streaks = calculateStreak(newEntries);
        setStreak(streaks.currentStreak);
        setBestStreak(streaks.bestStreak);
        
        // Send drink added notification
        await sendDrinkAddedNotification(cups, bottles);
        
        // Check if goal reached and send notification
        const today = new Date().toLocaleDateString();
        const todayEntries = newEntries.filter(e => new Date(e.date).toLocaleDateString() === today);
        const totalML = todayEntries.reduce((sum, e) => sum + (e.cups * 250) + (e.bottles * 500), 0);
        
        if (totalML >= 2000 && !goalReachedToday.current) {
          goalReachedToday.current = true;
          await sendGoalReachedNotification(totalML);
          // Trigger confetti celebration!
          confettiRef.current?.start();
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3000);
        }
      } else {
        Alert.alert('Error', 'Could not add entry. Please make sure you are signed in.');
      }
    } catch (err) {
      Alert.alert('Error', `Could not add entry: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
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
        const newEntries = [created, ...entries];
        setEntries(newEntries);
        const streaks = calculateStreak(newEntries);
        setStreak(streaks.currentStreak);
        setBestStreak(streaks.bestStreak);
        
        // Send drink added notification
        await sendDrinkAddedNotification(data.cups, data.bottles);
        
        // Check if goal reached and send notification
        const today = new Date().toLocaleDateString();
        const todayEntries = newEntries.filter(e => new Date(e.date).toLocaleDateString() === today);
        const totalML = todayEntries.reduce((sum, e) => sum + (e.cups * 250) + (e.bottles * 500), 0);
        
        if (totalML >= 2000 && !goalReachedToday.current) {
          goalReachedToday.current = true;
          await sendGoalReachedNotification(totalML);
          // Trigger confetti celebration!
          confettiRef.current?.start();
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3000);
        }
        
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
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert('Delete', 'Are you sure you want to delete this entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
    <View style={styles.container}>
      {/* Water Wave Background */}
      <LinearGradient
        colors={colorScheme === 'dark' 
          ? ['#0a1929', '#1e3a5f', '#2d5f8d'] 
          : ['#e3f2fd', '#90caf9', '#42a5f5']}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <ThemedText type="title" style={styles.title}>💧 Water Tracker</ThemedText>

        {/* Daily Stats Card with Glass Effect */}
        <View style={[styles.statsCard, styles.glassEffect]}>
          <LinearGradient
            colors={colorScheme === 'dark'
              ? ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']
              : ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)']}
            style={styles.statsCardGradient}
          >
            <View style={styles.statsTitleRow}>
              <ThemedText style={[styles.statsTitle, { color: colorScheme === 'dark' ? '#fff' : '#1a237e' }]}>
                Today's Progress
              </ThemedText>
              {streak > 0 && (
                <View style={styles.streakBadge}>
                  <ThemedText style={styles.streakText}>🔥 {streak} day{streak > 1 ? 's' : ''}</ThemedText>
                </View>
              )}
            </View>
            <View style={styles.progressBarContainer}>
              <Animated.View 
                style={[
                  styles.progressBar, 
                  { 
                    width: progressAnim.interpolate({
                      inputRange: [0, 100],
                      outputRange: ['0%', '100%'],
                    }),
                  }
                ]} 
              >
                <LinearGradient
                  colors={['#4FC3F7', '#29B6F6', '#03A9F4']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.progressGradient}
                />
              </Animated.View>
            </View>
            <ThemedText style={[styles.statsText, { color: colorScheme === 'dark' ? '#fff' : '#1a237e' }]}>
              {dailyStats.totalML}ml / {dailyStats.goalML}ml ({Math.round(dailyStats.progress)}%)
            </ThemedText>
            {dailyStats.yesterdayML > 0 && (
              <ThemedText style={[styles.comparisonText, { color: dailyStats.difference >= 0 ? '#4CAF50' : '#FF6B35' }]}>
                {dailyStats.difference >= 0 ? '↑' : '↓'} {Math.abs(dailyStats.difference)}ml vs yesterday
              </ThemedText>
            )}
            <View style={styles.statsRow}>
              <ThemedText style={[styles.statItem, { color: colorScheme === 'dark' ? '#b3e5fc' : '#01579b' }]}>
                🥤 {dailyStats.totalCups} cups
              </ThemedText>
              <ThemedText style={[styles.statItem, { color: colorScheme === 'dark' ? '#b3e5fc' : '#01579b' }]}>
                🍾 {dailyStats.totalBottles} bottles
              </ThemedText>
            </View>
            {bestStreak > 0 && (
              <ThemedText style={[styles.bestStreakText, { color: colorScheme === 'dark' ? '#81d4fa' : '#0277bd' }]}>
                🏆 Best: {bestStreak} day{bestStreak > 1 ? 's' : ''}
              </ThemedText>
            )}
          </LinearGradient>
        </View>

      {/* Quick Add Buttons */}
      <View style={styles.quickAddContainer}>
        <TouchableOpacity 
          style={[styles.quickButton, { backgroundColor: '#2196F3' }]} 
          onPress={() => handleQuickAdd(1, 0)}
          disabled={loading}
        >
          <ThemedText style={styles.quickButtonEmoji}>🥤</ThemedText>
          <ThemedText style={styles.quickButtonText}>1 Cup</ThemedText>
          <ThemedText style={styles.quickButtonSub}>250ml</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.quickButton, { backgroundColor: '#4CAF50' }]} 
          onPress={() => handleQuickAdd(0, 1)}
          disabled={loading}
        >
          <ThemedText style={styles.quickButtonEmoji}>🍾</ThemedText>
          <ThemedText style={styles.quickButtonText}>1 Bottle</ThemedText>
          <ThemedText style={styles.quickButtonSub}>500ml</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.quickButton, { backgroundColor: '#FF9800' }]} 
          onPress={() => handleQuickAdd(2, 0)}
          disabled={loading}
        >
          <ThemedText style={styles.quickButtonEmoji}>💧</ThemedText>
          <ThemedText style={styles.quickButtonText}>2 Cups</ThemedText>
          <ThemedText style={styles.quickButtonSub}>500ml</ThemedText>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={[styles.button, styles.customButton]} 
        onPress={() => setModalVisible(true)}
        disabled={loading}
      >
        <ThemedText style={styles.buttonText}>⚙️ Custom Amount</ThemedText>
      </TouchableOpacity>

      <WaterIntakeModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleAdd}
      />

      {entries.length === 0 ? (
        <ThemedView style={styles.emptyState}>
          <ThemedText style={styles.emptyStateEmoji}>💧</ThemedText>
          <ThemedText style={styles.emptyStateTitle}>Start Your Hydration Journey</ThemedText>
          <ThemedText style={styles.emptyStateText}>Tap a quick add button above to log your first drink!</ThemedText>
        </ThemedView>
      ) : (
        <View style={{ width: '100%', marginTop: 16 }}>
          {entries.map((item) => (
            <SwipeableItem
              key={item.id}
              onDelete={() => handleDelete(item.id)}
              colorScheme={colorScheme}
            >
              <ThemedView style={[styles.item, { backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#ffffff', borderWidth: 1, borderColor: colorScheme === 'dark' ? '#3a3a3a' : '#e0e0e0' }]}>
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
                      style={[styles.smallButton, { backgroundColor: colorScheme === 'dark' ? '#3a3a3a' : '#e0e0e0' }]}
                      onPress={() => handleUpdate(item.id, 'cups', 1)}
                    >
                      <ThemedText>＋</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.smallButton, { backgroundColor: colorScheme === 'dark' ? '#3a3a3a' : '#e0e0e0' }]}
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
                      style={[styles.smallButton, { backgroundColor: colorScheme === 'dark' ? '#3a3a3a' : '#e0e0e0' }]}
                      onPress={() => handleUpdate(item.id, 'bottles', 1)}
                    >
                      <ThemedText>＋</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.smallButton, { backgroundColor: colorScheme === 'dark' ? '#3a3a3a' : '#e0e0e0' }]}
                      onPress={() => handleUpdate(item.id, 'bottles', -1)}
                    >
                      <ThemedText>－</ThemedText>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </ThemedView>
          </SwipeableItem>
          ))}
        </View>
      )}

      <TouchableOpacity style={[styles.button, { marginTop: 12 }]} onPress={signOut}>
        <ThemedText style={styles.buttonText}>Sign Out</ThemedText>
      </TouchableOpacity>
      </ScrollView>
      
      {/* Confetti Celebration */}
      {showConfetti && (
        <ConfettiCannon
          ref={confettiRef}
          count={200}
          origin={{ x: SCREEN_WIDTH / 2, y: -10 }}
          fadeOut={true}
          autoStart={false}
        />
      )}
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
  statsCard: {
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
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  statsCardGradient: {
    padding: 20,
    borderRadius: 20,
  },
  statsTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  streakBadge: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  streakText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  progressBarContainer: {
    height: 28,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  progressBar: {
    height: '100%',
    borderRadius: 14,
  },
  progressGradient: {
    flex: 1,
    borderRadius: 14,
  },
  statsText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 4,
    fontWeight: '600',
  },
  comparisonText: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 4,
  },
  statItem: {
    fontSize: 14,
    fontWeight: '500',
  },
  bestStreakText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    opacity: 0.7,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyStateEmoji: {
    fontSize: 64,
    marginBottom: 16,
    lineHeight: 80,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
    lineHeight: 28,
  },
  emptyStateText: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
  },
  quickAddContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
  },
  quickButton: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  quickButtonEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  quickButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  quickButtonSub: {
    color: '#fff',
    fontSize: 10,
    opacity: 0.9,
    marginTop: 2,
  },
  button: {
    marginTop: 8,
    backgroundColor: '#d9534f',
    padding: 12,
    borderRadius: 8,
  },
  customButton: {
    backgroundColor: '#9C27B0',
    marginBottom: 12,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
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
    marginHorizontal: 4,
  },
  deleteButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#d9534f',
    marginLeft: 8,
  },
  deleteBackground: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#d9534f',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 20,
    width: '100%',
    borderRadius: 8,
  },
  deleteBackgroundText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
});
