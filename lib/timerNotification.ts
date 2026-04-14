import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: false,
        shouldPlaySound: false,
        shouldSetBadge: false,
    }),
});

const TIMER_NOTIFICATION_ID = 'timer-running';

export async function requestNotificationPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('timer', {
            name: 'Timer',
            importance: Notifications.AndroidImportance.LOW,
            lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        });
    }
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
}

export async function showTimerNotification(taskName: string, elapsed: string): Promise<void> {
    await Notifications.scheduleNotificationAsync({
        identifier: TIMER_NOTIFICATION_ID,
        content: {
            title: `Timer Running: ${taskName}`,
            body: elapsed,
            sticky: true,
            autoDismiss: false,
            sound: false,
        },
        trigger: null,
    });
}

export async function updateTimerNotification(taskName: string, elapsed: string): Promise<void> {
    await showTimerNotification(taskName, elapsed);
}

export async function dismissTimerNotification(): Promise<void> {
    await Notifications.dismissNotificationAsync(TIMER_NOTIFICATION_ID);
}
