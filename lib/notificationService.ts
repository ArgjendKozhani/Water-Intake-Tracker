import * as Notifications from 'expo-notifications';

// Configure notifications for the app
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Request notification permissions
export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    console.log('Notification permissions not granted');
    return false;
  }
  
  return true;
}

// Schedule hourly water reminders throughout the day
export async function scheduleRecurringReminders() {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  // Cancel existing reminders
  await Notifications.cancelAllScheduledNotificationsAsync();

  // Schedule reminders every hour from 8 AM to 10 PM
  const reminderTimes = [];
  for (let hour = 8; hour <= 22; hour++) {
    reminderTimes.push({ hour, minute: 0 });
  }

  // Schedule all reminders
  for (const time of reminderTimes) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "💧 Hydration Reminder",
          body: "Time to drink water! Stay hydrated.",
          sound: 'default',
        },
        trigger: {
          hour: time.hour,
          minute: time.minute,
          repeats: true,
        } as any,
      });
    } catch (error) {
      console.error('Failed to schedule notification:', error);
    }
  }
}

// Send notification when a drink is added
export async function sendDrinkAddedNotification(cups: number, bottles: number) {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  let title = '';
  let body = '';

  if (cups === 1 && bottles === 0) {
    title = '🥤 One Cup Finished!';
    body = 'Great job! You drank 250ml of water.';
  } else if (cups === 2 && bottles === 0) {
    title = '💧 Two Cups Finished!';
    body = 'Awesome! You drank 500ml of water.';
  } else if (bottles === 1 && cups === 0) {
    title = '🍾 One Bottle Finished!';
    body = 'Excellent! You drank 500ml of water.';
  } else {
    // Custom amount
    const totalML = (cups * 250) + (bottles * 500);
    title = '💧 Water Added!';
    body = `You logged ${totalML}ml of water. Keep it up!`;
  }

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: 'default',
      },
      trigger: null, // Send immediately
    });
  } catch (error) {
    console.error('Failed to send drink notification:', error);
  }
}

// Send notification when daily goal is reached
export async function sendGoalReachedNotification(totalML: number) {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🎉 Daily Goal Achieved!',
        body: `Congratulations! You reached ${totalML}ml today. Stay hydrated!`,
        sound: 'default',
      },
      trigger: null, // Send immediately
    });
  } catch (error) {
    console.error('Failed to send goal notification:', error);
  }
}

// Legacy function for backward compatibility
export async function scheduleWaterReminders(startTime: Date, endTime: Date) {
  // Now just ensures recurring reminders are set up
  await scheduleRecurringReminders();
}