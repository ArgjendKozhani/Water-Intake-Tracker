import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notifications for the app
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function scheduleWaterReminders(startTime: Date, endTime: Date) {
  // Request permissions first
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    console.log('Failed to get push token for push notification!');
    return;
  }

  // Cancel any existing notifications
  await Notifications.cancelAllScheduledNotificationsAsync();

  // Calculate time intervals between start and end time
  const startTimeMs = startTime.getTime();
  const endTimeMs = endTime.getTime();
  const duration = endTimeMs - startTimeMs;
  const intervalMs = 60 * 60 * 1000; // 1 hour in milliseconds

  // Schedule notifications for each hour between start and end time
  for (let timeMs = startTimeMs; timeMs <= endTimeMs; timeMs += intervalMs) {
    const notificationTime = new Date(timeMs);

    // Only schedule if the time hasn't passed yet
    if (notificationTime.getTime() > Date.now()) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Time to drink water! 💧",
          body: "Stay hydrated! Remember to drink a glass of water.",
          sound: Platform.OS === 'android' ? 'default' : undefined,
        },
        trigger: {
          hour: notificationTime.getHours(),
          minute: notificationTime.getMinutes(),
          repeats: true,
        },
      });
    }
  }
}