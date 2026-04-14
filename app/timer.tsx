import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, IconButton, Text, useTheme } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { useProjects, useRates, useTasks, useTimeTrackings } from '@data/queries';
import { useDatabase } from '@hooks/useDatabaseConnection';
import { tasks, timeTrackings } from '@data/schema';
import { eq } from 'drizzle-orm';
import { DateTime } from 'luxon';
import { useSettings } from '@lib/settings';
import { formatCurrency } from '@lib/currencies';
import { dismissTimerNotification, updateTimerNotification } from '@lib/timerNotification';

export default function TimerScreen() {
    const { taskId: taskIdParam } = useLocalSearchParams();
    const taskId = parseInt(taskIdParam as string);
    const theme = useTheme();
    const database = useDatabase();
    const tasksQuery = useTasks();
    const projectsQuery = useProjects();
    const rateQuery = useRates();
    const timeTrackingsQuery = useTimeTrackings();
    const { settings } = useSettings();

    const [startTime, setStartTime] = useState<DateTime | null>(null);
    const [elapsed, setElapsed] = useState('00:00:00');
    const [elapsedMs, setElapsedMs] = useState(0);

    const task = tasksQuery.data?.find(t => t.id === taskId);
    const project = projectsQuery.data?.find(p => p.id === task?.projectId);
    const rate = rateQuery.data?.find(r => r.clientId === project?.clientId);

    // Find the active tracking record to get the start time
    useEffect(() => {
        if (timeTrackingsQuery.data) {
            const activeTracking = timeTrackingsQuery.data.find(
                tt => tt.taskId === taskId && tt.endTime === null
            );
            if (activeTracking) {
                setStartTime(DateTime.fromISO(activeTracking.startTime));
            }
        }
    }, [timeTrackingsQuery.data, taskId]);

    // Tick every second
    useEffect(() => {
        if (!startTime) return;

        const tick = () => {
            const now = DateTime.local();
            const diff = now.diff(startTime, ['hours', 'minutes', 'seconds']);
            const h = String(Math.floor(diff.hours)).padStart(2, '0');
            const m = String(Math.floor(diff.minutes)).padStart(2, '0');
            const s = String(Math.floor(diff.seconds)).padStart(2, '0');
            setElapsed(`${h}:${m}:${s}`);
            setElapsedMs(now.toMillis() - startTime.toMillis());
        };

        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [startTime]);

    // Update notification every 5 seconds
    useEffect(() => {
        if (!startTime || !task) return;

        const interval = setInterval(() => {
            const now = DateTime.local();
            const diff = now.diff(startTime, ['hours', 'minutes', 'seconds']);
            const h = String(Math.floor(diff.hours)).padStart(2, '0');
            const m = String(Math.floor(diff.minutes)).padStart(2, '0');
            const s = String(Math.floor(diff.seconds)).padStart(2, '0');
            updateTimerNotification(task.name, `${h}:${m}:${s}`);
        }, 5000);
        return () => clearInterval(interval);
    }, [startTime, task]);

    const handleStop = async () => {
        const lastTracking = await database.query.timeTrackings.findFirst({
            orderBy: (timeTrackings, { desc }) => [desc(timeTrackings.id)],
            where: eq(timeTrackings.taskId, taskId),
        });
        if (lastTracking) {
            await database
                .update(timeTrackings)
                .set({ endTime: DateTime.now().toISO() })
                .where(eq(timeTrackings.id, lastTracking.id))
                .execute();
        }
        await dismissTimerNotification();
        tasksQuery.refetch();
        timeTrackingsQuery.refetch();
        router.back();
    };

    const currentEarnings = rate ? (elapsedMs / 3_600_000) * rate.ratePerHour : 0;

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={styles.header}>
                <IconButton
                    icon="chevron-down"
                    size={28}
                    onPress={() => router.back()}
                />
            </View>

            <View style={styles.content}>
                {task && (
                    <Text variant="titleLarge" style={[styles.taskName, { color: theme.colors.onSurface }]}>
                        {task.name}
                    </Text>
                )}
                {project && (
                    <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
                        {project.name}
                    </Text>
                )}

                <Text
                    variant="displayLarge"
                    style={[styles.clock, { color: theme.colors.primary }]}
                >
                    {elapsed}
                </Text>

                {rate && currentEarnings > 0 && (
                    <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
                        {formatCurrency(currentEarnings, settings.currency)} earned
                    </Text>
                )}
            </View>

            <View style={styles.actions}>
                <Button
                    mode="contained"
                    icon="stop"
                    onPress={handleStop}
                    contentStyle={styles.stopButtonContent}
                    labelStyle={styles.stopButtonLabel}
                    buttonColor={theme.colors.error}
                    textColor={theme.colors.onError}
                >
                    Stop Timer
                </Button>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        alignItems: 'flex-start',
        paddingTop: 48,
        paddingHorizontal: 8,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    taskName: {
        textAlign: 'center',
        marginBottom: 4,
    },
    clock: {
        fontVariant: ['tabular-nums'],
        marginVertical: 32,
        fontSize: 64,
        lineHeight: 80,
    },
    actions: {
        paddingHorizontal: 24,
        paddingBottom: 48,
    },
    stopButtonContent: {
        height: 56,
    },
    stopButtonLabel: {
        fontSize: 18,
    },
});
