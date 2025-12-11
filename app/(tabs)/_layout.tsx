import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Tabs } from 'expo-router';
import React from 'react';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const scheme = colorScheme ?? 'light';
  const activeTintColor = '#2196F3'; // Blue for active tab
  const inactiveTintColor = colorScheme === 'dark' ? '#888888' : '#666666'; // Gray for inactive

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: activeTintColor,
        tabBarInactiveTintColor: inactiveTintColor,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol 
              name="house.fill" 
              color={focused ? activeTintColor : inactiveTintColor} 
              size={focused ? 24 : 20} 
            />
          ),
          tabBarButton: HapticTab,
        }}
      />
      <Tabs.Screen
        name="statistics"
        options={{
          title: 'Statistics',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol 
              name="chart.bar.fill" 
              color={focused ? activeTintColor : inactiveTintColor} 
              size={focused ? 24 : 20} 
            />
          ),
          tabBarButton: HapticTab,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol 
              name="paperplane.fill" 
              color={focused ? activeTintColor : inactiveTintColor} 
              size={focused ? 24 : 20} 
            />
          ),
          tabBarButton: HapticTab,
        }}
      />
      <Tabs.Screen
        name="ratings"
        options={{
          title: 'Ratings',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol 
              name="star.fill" 
              color={focused ? activeTintColor : inactiveTintColor} 
              size={focused ? 24 : 20} 
            />
          ),
          tabBarButton: HapticTab,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol 
              name="person.fill" 
              color={focused ? activeTintColor : inactiveTintColor} 
              size={focused ? 24 : 20} 
            />
          ),
          tabBarButton: HapticTab,
        }}
      />
    </Tabs>
  );
}
