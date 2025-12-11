import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import waterService, { WaterEntry } from '@/lib/waterService';
import { supabase } from '@/supabase';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [entries, setEntries] = useState<WaterEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        router.replace('/auth/login');
        return;
      }
      setUser(currentUser);

      // Load profile
      let { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();
      
      // If profile doesn't exist, create it
      if (profileError && profileError.code === 'PGRST116') {
        console.log('Profile not found, creating new profile...');
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: currentUser.id,
            email: currentUser.email,
            avatar_url: null,
          })
          .select()
          .single();
        
        if (createError) {
          console.error('Error creating profile:', createError);
        } else {
          console.log('Profile created successfully:', newProfile);
          profileData = newProfile;
        }
      } else if (profileError) {
        console.error('Profile load error:', profileError);
      }
      
      console.log('Loaded profile data:', profileData);
      setProfile(profileData);

      // Load entries
      const fetchedEntries = await waterService.getEntries();
      setEntries(fetchedEntries);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to upload a profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadAvatar = async (uri: string) => {
    try {
      setUploading(true);
      
      const ext = uri.substring(uri.lastIndexOf('.') + 1);
      const fileName = `${user.id}/${Date.now()}.${ext}`;
      
      const response = await fetch(uri);
      const blob = await response.blob();
      const arrayBuffer = await new Response(blob).arrayBuffer();

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(fileName, arrayBuffer, {
          contentType: `image/${ext}`,
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(fileName);

      console.log('Public URL generated:', publicUrl);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) {
        console.error('Database update error:', updateError);
        throw updateError;
      }

      console.log('Profile updated with avatar_url:', publicUrl);
      
      // Reload profile from database to confirm it was saved
      const { data: updatedProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      console.log('Reloaded profile:', updatedProfile);
      setProfile(updatedProfile);
      Alert.alert('Success', 'Profile picture updated!');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      Alert.alert('Error', 'Failed to upload profile picture');
    } finally {
      setUploading(false);
    }
  };

  const stats = useMemo(() => {
    const totalML = entries.reduce((sum, e) => sum + (e.cups * 250) + (e.bottles * 500), 0);
    const totalDays = new Set(entries.map(e => new Date(e.date).toDateString())).size;
    const avgPerDay = totalDays > 0 ? Math.round(totalML / totalDays) : 0;
    const daysMetGoal = entries.reduce((count, e) => {
      const dateStr = new Date(e.date).toDateString();
      const dayEntries = entries.filter(entry => new Date(entry.date).toDateString() === dateStr);
      const dayTotal = dayEntries.reduce((sum, entry) => sum + (entry.cups * 250) + (entry.bottles * 500), 0);
      return dayTotal >= 2000 ? count + 1 : count;
    }, 0);

    // Calculate streak
    const sortedDates = Array.from(new Set(
      entries
        .map(e => new Date(e.date).toDateString())
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
    ));
    
    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;
    
    for (let i = 0; i < sortedDates.length; i++) {
      const expectedDate = new Date(Date.now() - i * 86400000).toDateString();
      if (sortedDates[i] === expectedDate) {
        const dayEntries = entries.filter(e => new Date(e.date).toDateString() === expectedDate);
        const dayTotal = dayEntries.reduce((sum, e) => sum + (e.cups * 250) + (e.bottles * 500), 0);
        if (dayTotal >= 2000) {
          currentStreak++;
          tempStreak++;
          if (tempStreak > bestStreak) bestStreak = tempStreak;
        } else {
          break;
        }
      } else {
        break;
      }
    }

    return {
      totalEntries: entries.length,
      totalML,
      totalLiters: (totalML / 1000).toFixed(1),
      avgPerDay,
      totalDays,
      daysMetGoal,
      successRate: totalDays > 0 ? Math.round((daysMetGoal / totalDays) * 100) : 0,
      currentStreak,
      bestStreak: Math.max(bestStreak, currentStreak),
    };
  }, [entries]);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.replace('/auth/login');
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <LinearGradient
          colors={colorScheme === 'dark'
            ? ['#0a1929', '#1e3a5f', '#2d5f8d']
            : ['#e3f2fd', '#90caf9', '#42a5f5']}
          style={styles.backgroundGradient}
        />
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

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
        <ThemedText type="title" style={styles.title}>👤 Profile</ThemedText>

        {/* Profile Picture Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            <TouchableOpacity onPress={pickImage} disabled={uploading} style={styles.avatarContainer}>
              {uploading ? (
                <View style={styles.avatarPlaceholder}>
                  <ActivityIndicator size="large" color="#2196F3" />
                </View>
              ) : profile?.avatar_url ? (
                <Image 
                  source={{ uri: profile.avatar_url }} 
                  style={styles.avatar}
                  resizeMode="cover"
                  onError={(e) => console.log('Image load error:', e.nativeEvent.error)}
                  onLoad={() => console.log('Image loaded successfully:', profile.avatar_url)}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <ThemedText style={styles.avatarPlaceholderText}>👤</ThemedText>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={pickImage} disabled={uploading} style={styles.editBadge}>
              <ThemedText style={styles.editBadgeText}>✏️</ThemedText>
            </TouchableOpacity>
          </View>
          <ThemedText style={styles.email}>{user?.email}</ThemedText>
          <ThemedText style={styles.memberSince}>
            Member since {new Date(user?.created_at).toLocaleDateString()}
          </ThemedText>
        </View>

        {/* Stats Cards */}
        <View style={[styles.section, styles.glassEffect]}>
          <LinearGradient
            colors={colorScheme === 'dark'
              ? ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']
              : ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)']}
            style={styles.gradientOverlay}
          />
          <View style={styles.sectionContent}>
            <ThemedText style={styles.sectionTitle}>📊 Your Stats</ThemedText>
            
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <ThemedText style={styles.statValue}>{stats.totalLiters}L</ThemedText>
                <ThemedText style={styles.statLabel}>Total Water</ThemedText>
              </View>
              <View style={styles.statCard}>
                <ThemedText style={styles.statValue}>{stats.totalEntries}</ThemedText>
                <ThemedText style={styles.statLabel}>Total Logs</ThemedText>
              </View>
              <View style={styles.statCard}>
                <ThemedText style={styles.statValue}>{stats.avgPerDay}ml</ThemedText>
                <ThemedText style={styles.statLabel}>Daily Avg</ThemedText>
              </View>
              <View style={styles.statCard}>
                <ThemedText style={styles.statValue}>{stats.successRate}%</ThemedText>
                <ThemedText style={styles.statLabel}>Success Rate</ThemedText>
              </View>
            </View>
          </View>
        </View>

        {/* Streaks Section */}
        <View style={[styles.section, styles.glassEffect]}>
          <LinearGradient
            colors={colorScheme === 'dark'
              ? ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']
              : ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)']}
            style={styles.gradientOverlay}
          />
          <View style={styles.sectionContent}>
            <ThemedText style={styles.sectionTitle}>🔥 Streaks</ThemedText>
            
            <View style={styles.streaksRow}>
              <View style={styles.streakCard}>
                <ThemedText style={styles.streakValue}>🔥 {stats.currentStreak}</ThemedText>
                <ThemedText style={styles.streakLabel}>Current Streak</ThemedText>
              </View>
              <View style={styles.streakCard}>
                <ThemedText style={styles.streakValue}>⭐ {stats.bestStreak}</ThemedText>
                <ThemedText style={styles.streakLabel}>Best Streak</ThemedText>
              </View>
            </View>
          </View>
        </View>

        {/* Activity Summary */}
        <View style={[styles.section, styles.glassEffect]}>
          <LinearGradient
            colors={colorScheme === 'dark'
              ? ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']
              : ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)']}
            style={styles.gradientOverlay}
          />
          <View style={styles.sectionContent}>
            <ThemedText style={styles.sectionTitle}>📅 Activity Summary</ThemedText>
            
            <View style={styles.summaryRow}>
              <ThemedText style={styles.summaryLabel}>Days Tracked</ThemedText>
              <ThemedText style={styles.summaryValue}>{stats.totalDays}</ThemedText>
            </View>
            <View style={styles.summaryRow}>
              <ThemedText style={styles.summaryLabel}>Days Met Goal</ThemedText>
              <ThemedText style={styles.summaryValue}>{stats.daysMetGoal}</ThemedText>
            </View>
            <View style={styles.summaryRow}>
              <ThemedText style={styles.summaryLabel}>Average Per Day</ThemedText>
              <ThemedText style={styles.summaryValue}>{stats.avgPerDay}ml</ThemedText>
            </View>
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
          <ThemedText style={styles.signOutButtonText}>🚪 Sign Out</ThemedText>
        </TouchableOpacity>
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
    marginBottom: 24,
    textAlign: 'center',
    color: '#fff',
    fontWeight: '700',
    fontSize: 28,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 20,
  },
  avatarContainer: {
    width: 130,
    height: 130,
    borderRadius: 65,
    overflow: 'hidden',
    borderWidth: 5,
    borderColor: '#2196F3',
    backgroundColor: '#f0f0f0',
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(33, 150, 243, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#2196F3',
  },
  avatarPlaceholderText: {
    fontSize: 48,
  },
  editBadge: {
    position: 'absolute',
    bottom: 15,
    right: -5,
    backgroundColor: '#2196F3',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  editBadgeText: {
    fontSize: 18,
  },
  email: {
    fontSize: 19,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  memberSince: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    padding: 16,
    paddingVertical: 20,
    marginBottom: 12,
    backgroundColor: 'rgba(33, 150, 243, 0.15)',
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 100,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2196F3',
    marginBottom: 4,
    lineHeight: 34,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.8,
    textAlign: 'center',
  },
  streaksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  streakCard: {
    width: '48%',
    padding: 16,
    paddingVertical: 20,
    backgroundColor: 'rgba(255, 152, 0, 0.15)',
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 100,
  },
  streakValue: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 4,
    lineHeight: 40,
  },
  streakLabel: {
    fontSize: 12,
    opacity: 0.8,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.2)',
  },
  summaryLabel: {
    fontSize: 15,
    opacity: 0.9,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2196F3',
  },
  signOutButton: {
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  signOutButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f44336',
  },
});
