import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, RefreshControl } from 'react-native';
import { Button, Card, Chip, Icon, Searchbar, Text, useTheme } from 'react-native-paper';
import { useDatabase } from '@hooks/useDatabaseConnection';
import { tasks, timeTrackings } from '@data/schema';
import { eq } from 'drizzle-orm';
import { createAlert } from '@lib/alert';
import { DateTime, Interval } from 'luxon';
import { router } from 'expo-router';
import { useProjects, useRates, useTasks, useTimeTrackings } from '@data/queries';
import { useSettings } from '@lib/settings';
import { formatCurrency } from '@lib/currencies';
import { showTimerNotification, dismissTimerNotification, requestNotificationPermissions } from '@lib/timerNotification';

const TasksPage: React.FC = () => {
    const database = useDatabase();
    const tasksQuery = useTasks();
    const timeTrackingsQuery = useTimeTrackings();
    const projectsQuery = useProjects();
    const rateQuery = useRates();
    const theme = useTheme();
    const { settings } = useSettings();
    const [activeTaskId, setActiveTaskId] = useState<number | null>(null);
    const [startTime, setStartTime] = useState<DateTime | null>(null);
    const [elapsedTime, setElapsedTime] = useState<DateTime | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    // Restore timer state from DB on mount (handles tab switches / navigation)
    useEffect(() => {
        if (timeTrackingsQuery.data && activeTaskId === null) {
            const activeTracking = timeTrackingsQuery.data.find(tt => tt.endTime === null);
            if (activeTracking) {
                setActiveTaskId(activeTracking.taskId);
                setStartTime(DateTime.fromISO(activeTracking.startTime));
            }
        }
    }, [timeTrackingsQuery.data?.length]);

    useEffect(() => {
        if (activeTaskId !== null && startTime) {
            const interval = setInterval(() => {
                setElapsedTime(DateTime.local().diff(startTime, ['hours', 'minutes', 'seconds']));
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [activeTaskId, startTime]);

    const onRefresh = async () => {
        setRefreshing(true);
        await tasksQuery.refetch();
        await timeTrackingsQuery.refetch();
        setRefreshing(false);
    };

    const handleDeleteTask = async (taskId: typeof tasks.$inferInsert['id']) => {
        if (activeTaskId) {
            createAlert({
                title: 'Cannot delete',
                message: 'Stop the running timer before deleting a task.',
            });
            return;
        }
        if (!taskId) return;
        createAlert({
            title: 'Delete Task',
            message: 'Are you sure you want to delete this task?',
            buttons: [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await database.delete(tasks).where(eq(tasks.id, taskId)).execute();
                            tasksQuery.refetch();
                        } catch (error) {
                            createAlert({
                                title: 'Error',
                                message: 'Failed to delete task.',
                            });
                        }
                    },
                },
            ],
        });
    };

    const statusOrder = ['todo', 'in_progress', 'completed'] as const;
    const statusLabels: Record<string, string> = {
        'todo': 'To Do',
        'in_progress': 'In Progress',
        'completed': 'Completed',
    };
    const statusIcons: Record<string, string> = {
        'todo': 'checkbox-blank-circle-outline',
        'in_progress': 'progress-clock',
        'completed': 'check-circle',
    };

    const cycleStatus = async (taskId: number, currentStatus: string) => {
        const currentIndex = statusOrder.indexOf(currentStatus as any);
        const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];
        await database.update(tasks).set({ status: nextStatus }).where(eq(tasks.id, taskId)).execute();
        tasksQuery.refetch();
    };

    const handleStart = async (taskId: typeof timeTrackings.$inferSelect['id']) => {
        setActiveTaskId(taskId);
        setStartTime(DateTime.local());
        await database
            .insert(timeTrackings)
            .values({ taskId, startTime: DateTime.now().toISO() })
            .execute();
        // Auto-set status to in_progress
        await database.update(tasks).set({ status: 'in_progress' }).where(eq(tasks.id, taskId)).execute();
        tasksQuery.refetch();

        // Show notification and navigate to timer screen
        const taskName = tasksQuery.data?.find(t => t.id === taskId)?.name ?? 'Task';
        await requestNotificationPermissions();
        await showTimerNotification(taskName, '00:00:00');
        router.push({ pathname: '/timer', params: { taskId: taskId.toString() } });
    };

    const handleStop = async (taskId: typeof timeTrackings.$inferSelect['id']) => {
        setActiveTaskId(null);
        setElapsedTime(null);
        const lastTracking = await database.query.timeTrackings.findFirst({
            orderBy: (timeTrackings, { desc }) => [desc(timeTrackings.id)],
            where: eq(timeTrackings.taskId, taskId)
        });
        if (lastTracking) {
            await database.update(timeTrackings)
                .set({ endTime: DateTime.now().toISO() })
                .where(eq(timeTrackings.id, lastTracking.id))
                .execute();
        }
        await dismissTimerNotification();
        tasksQuery.refetch();
        timeTrackingsQuery.refetch();
    };

    // Re-sync active timer state when returning from timer screen
    useEffect(() => {
        if (timeTrackingsQuery.data) {
            const activeTracking = timeTrackingsQuery.data.find(tt => tt.endTime === null);
            if (!activeTracking && activeTaskId !== null) {
                setActiveTaskId(null);
                setElapsedTime(null);
            }
        }
    }, [timeTrackingsQuery.data]);

    const handleTimerToggle = (taskId: number) => {
        if (activeTaskId === taskId) {
            handleStop(taskId);
        } else {
            handleStart(taskId);
        }
    };

    function prettyPrintDuration(milliseconds: number): string {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        const parts: string[] = [];
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0) parts.push(`${minutes}m`);
        if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);
        return parts.join(' ');
    }

    const filteredTasks = tasksQuery.data?.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const allLoaded = tasksQuery.isSuccess && timeTrackingsQuery.isSuccess && rateQuery.isSuccess && projectsQuery.isSuccess;

    return (
        <View style={{ flex: 1 }}>
            {(tasksQuery.data?.length ?? 0) > 0 && (
                <Searchbar
                    placeholder="Search tasks..."
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    style={styles.searchbar}
                />
            )}
            <ScrollView
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                <View style={styles.container}>
                    {tasksQuery.isLoading && (
                        <View style={styles.emptyState}>
                            <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>Loading...</Text>
                        </View>
                    )}
                    {tasksQuery.isError && (
                        <View style={styles.emptyState}>
                            <Text variant="bodyLarge" style={{ color: theme.colors.error }}>Error fetching tasks</Text>
                        </View>
                    )}
                    {allLoaded && (filteredTasks?.length ?? 0) === 0 && !searchQuery && (
                        <View style={styles.emptyState}>
                            <Icon source="clipboard-plus-outline" size={64} color={theme.colors.onSurfaceVariant} />
                            <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, marginTop: 16, textAlign: 'center' }}>
                                No tasks yet.{'\n'}Create your first task to start tracking time.
                            </Text>
                            <Button
                                mode="contained"
                                style={{ marginTop: 16 }}
                                icon="plus"
                                onPress={() => router.push({ pathname: '/modals/forms/task/[id]', params: { id: 'new' } })}
                            >
                                Add Task
                            </Button>
                        </View>
                    )}
                    {allLoaded && (filteredTasks?.length ?? 0) === 0 && searchQuery && (
                        <View style={styles.emptyState}>
                            <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
                                No tasks match "{searchQuery}"
                            </Text>
                        </View>
                    )}
                    {allLoaded && filteredTasks?.map(task => {
                        const timeTracking = timeTrackingsQuery.data.filter(tt => tt.taskId === task.id);
                        const totalmilliseconds = timeTracking.reduce((acc, tt) => {
                            if (tt.endTime && tt.startTime) {
                                const start = DateTime.fromISO(tt.startTime);
                                const end = DateTime.fromISO(tt.endTime);
                                return acc + Interval.fromDateTimes(start, end).length('milliseconds');
                            }
                            return acc;
                        }, 0);

                        const isActive = activeTaskId === task.id;
                        const project = projectsQuery.data.find(p => p.id === task.projectId);
                        const rate = rateQuery.data.find(r => r.clientId === project?.clientId);
                        const totalEarnings = rate ? (totalmilliseconds / 3_600_000) * rate.ratePerHour : 0;

                        const isCompleted = task.status === 'completed';

                        return (
                            <Card
                                key={task.id}
                                style={[
                                    styles.card,
                                    !isActive && activeTaskId !== null ? { opacity: 0.5 } : {},
                                    isCompleted ? { opacity: 0.6 } : {},
                                ]}
                            >
                                <Card.Title
                                    title={task.name}
                                    titleStyle={isCompleted ? { textDecorationLine: 'line-through' } : undefined}
                                    subtitle={project?.name ?? 'No project'}
                                    right={() => (
                                        <Chip
                                            compact
                                            icon={statusIcons[task.status ?? 'todo']}
                                            style={{ marginRight: 16 }}
                                            onPress={() => cycleStatus(task.id, task.status ?? 'todo')}
                                        >
                                            {statusLabels[task.status ?? 'todo']}
                                        </Chip>
                                    )}
                                />
                                <Card.Content>
                                    <Text variant="bodyMedium">{task.description}</Text>
                                    {totalmilliseconds > 0 && (
                                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
                                            {prettyPrintDuration(totalmilliseconds)} spent
                                            {totalEarnings > 0 ? `  ·  ${formatCurrency(totalEarnings, settings.currency)} earned` : ''}
                                        </Text>
                                    )}
                                    {isActive && (
                                        <View style={styles.timerContainer}>
                                            <Text variant="titleLarge" style={{ color: theme.colors.primary, fontVariant: ['tabular-nums'] }}>
                                                {elapsedTime ? elapsedTime.toFormat('hh:mm:ss') : '00:00:00'}
                                            </Text>
                                            <Button
                                                mode="contained-tonal"
                                                icon="timer"
                                                compact
                                                style={{ marginTop: 8 }}
                                                onPress={() => router.push({ pathname: '/timer', params: { taskId: task.id.toString() } })}
                                            >
                                                View Timer
                                            </Button>
                                        </View>
                                    )}
                                </Card.Content>
                                <Card.Actions>
                                    <Button
                                        disabled={!isActive && Boolean(activeTaskId)}
                                        onPress={() => {
                                            if (activeTaskId) return;
                                            router.push({
                                                pathname: '/modals/forms/task/[id]',
                                                params: { id: task.id },
                                            });
                                        }}
                                    >
                                        Edit
                                    </Button>
                                    <Button
                                        disabled={!isActive && Boolean(activeTaskId)}
                                        mode={isActive ? "contained" : "contained-tonal"}
                                        icon={isActive ? "stop" : "play"}
                                        onPress={() => handleTimerToggle(task.id)}
                                    >
                                        {isActive ? "Stop" : "Start"}
                                    </Button>
                                    <Button
                                        disabled={Boolean(activeTaskId)}
                                        mode="outlined"
                                        textColor={theme.colors.error}
                                        onPress={() => handleDeleteTask(task.id)}
                                    >
                                        Delete
                                    </Button>
                                </Card.Actions>
                            </Card>
                        )
                    })}
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    searchbar: {
        marginHorizontal: 12,
        marginTop: 8,
    },
    container: {
        paddingBottom: 16,
    },
    card: {
        marginTop: 12,
        marginHorizontal: 12,
    },
    timerContainer: {
        alignItems: 'center',
        marginTop: 12,
        marginBottom: 4,
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
        paddingHorizontal: 40,
    },
});

export default React.memo(TasksPage);
