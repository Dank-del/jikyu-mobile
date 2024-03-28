import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Text, useTheme } from 'react-native-paper';
import { useDatabase } from '@hooks/useDatabaseConnection';
import { tasks, timeTrackings } from '@data/schema';
import { eq } from 'drizzle-orm';
import { createAlert } from '@lib/alert';
import { DateTime, Interval } from 'luxon';
import { router } from 'expo-router';
import { useProjects, useRates, useTasks, useTimeTrackings } from '@data/queries';

const TasksPage: React.FC = () => {
    const database = useDatabase();
    const tasksQuery = useTasks()
    const timeTrackingsQuery = useTimeTrackings();
    const projectsQuery = useProjects();
    const rateQuery = useRates();
    const theme = useTheme();
    const [activeTaskId, setActiveTaskId] = useState<number | null>(null);
    const [startTime, setStartTime] = useState<DateTime | null>(null);
    const [elapsedTime, setElapsedTime] = useState<DateTime | null>(null);

    useEffect(() => {
        if (activeTaskId !== null) {
            const interval = setInterval(() => {
                // @ts-ignore
                setElapsedTime(DateTime.local().diff(startTime, ['hours', 'minutes', 'seconds', 'milliseconds']));
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [activeTaskId, startTime]);

    const handleDeleteTask = async (taskId: typeof tasks.$inferInsert['id']) => {
        if (activeTaskId) {
            createAlert({
                title: 'Error in deletion',
                message: 'Cannot delete task while timer is running',
            });
            return;
        }
        if (!taskId) {
            createAlert({
                title: 'Error in deletion',
                message: 'Id is undefined',
            });
            return;
        }
        createAlert({
            title: 'Delete Task',
            message: 'Are you sure you want to delete this task?',
            buttons: [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Delete',
                    onPress: async () => {
                        try {
                            await database.delete(tasks).where(eq(tasks.id, taskId)).execute();
                            tasksQuery.refetch();
                        } catch (error) {
                            createAlert({
                                title: 'Error in deletion',
                                message: 'Error deleting task',
                            });
                            console.error('Error deleting task:', error);
                        }
                    },
                },
            ],
        })
    };

    const handleStart = async (taskId: typeof timeTrackings.$inferSelect['id']) => {
        setActiveTaskId(taskId);
        setStartTime(DateTime.local());
        await saveStartTime(taskId);
    };

    const handleStop = async (taskId: typeof timeTrackings.$inferSelect['id']) => {
        setActiveTaskId(null);
        tasksQuery.refetch();
        timeTrackingsQuery.refetch();
        await saveStopTime(taskId);
    };

    const saveStartTime = async (taskId: typeof timeTrackings.$inferSelect['id']) => {
        await database
            .insert(timeTrackings)
            .values({
                taskId,
                startTime: DateTime.now().toISO(),
            })
            .execute();
    };

    const saveStopTime = async (taskId: typeof timeTrackings.$inferSelect['id']) => {
        const lastTracking = await database.query.timeTrackings.findFirst({
            orderBy: (timeTrackings, { desc }) => [desc(timeTrackings.id)],
            where: eq(timeTrackings.taskId, taskId)
        })
        if (lastTracking) {
            await database.update(timeTrackings)
                .set({ endTime: DateTime.now().toISO() })
                .where(eq(timeTrackings.id, lastTracking.id))
                .execute();
        }
    };

    function prettyPrintDuration(milliseconds: number): string {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        const daysRemainder = hours % 24;
        const hoursRemainder = minutes % 60;
        const minutesRemainder = seconds % 60;
        const secondsRemainder = (milliseconds % 1000) / 1000;

        let result = '';
        if (days > 0) {
            result += `${days}d `;
        }
        if (daysRemainder > 0) {
            result += `${daysRemainder}h `;
        }
        if (hoursRemainder > 0) {
            result += `${hoursRemainder}m `;
        }
        if (minutesRemainder > 0) {
            result += `${minutesRemainder}s `;
        }
        if (secondsRemainder > 0) {
            result += `${secondsRemainder.toFixed(3)}ms`;
        }

        return result.trim();
    }

    const handleTimerToggle = (taskId: number) => {
        if (activeTaskId === taskId) {
            handleStop(taskId);
        } else {
            handleStart(taskId);
        }
    };

    return (
        <>
            <ScrollView>
                <View style={styles.container}>
                    {tasksQuery.isLoading && <Text>Loading...</Text>}
                    {tasksQuery.isError && <Text>Error fetching tasks</Text>}
                    {tasksQuery.isSuccess && timeTrackingsQuery.isSuccess && rateQuery.isSuccess && projectsQuery.isSuccess &&
                        tasksQuery.data.map(task => {
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
                            const rate = rateQuery.data.find(r => r.clientId === (projectsQuery.data.find(p => p.id === task.projectId)?.clientId));
                            const totalEarnings = rate ? totalmilliseconds * rate.ratePerHour : 0;

                            return (
                                <Card key={task.id} style={[styles.card, !isActive && activeTaskId !== null ? { backgroundColor: theme.colors.surfaceDisabled } : {}]}>
                                    <Text style={styles.taskName}>{task.name}</Text>
                                    <Text style={styles.taskDescription}>{task.description}</Text>
                                    {totalmilliseconds > 0 && <Text style={styles.timeSpent}>{prettyPrintDuration(totalmilliseconds)} spent</Text>}
                                    {totalEarnings > 0 && <Text style={styles.timeSpent}>Earnings: ${totalEarnings}</Text>}
                                    {isActive && (
                                        <View style={styles.timerContainer}>
                                            <Text style={styles.timerText}>Elapsed Time: {elapsedTime ? elapsedTime.toFormat('hh:mm:ss.SSS') : '00:00:00.000'}</Text>
                                        </View>
                                    )}
                                    <View style={styles.buttonContainer}>
                                        <Button
                                            disabled={!isActive && Boolean(activeTaskId)}
                                            onPress={() => {
                                                if (activeTaskId) {
                                                    createAlert({
                                                        title: 'Error in deletion',
                                                        message: 'Cannot delete task while timer is running',
                                                    });
                                                    return;
                                                }
                                                if (!task) {
                                                    createAlert({
                                                        title: 'Error in editing task',
                                                        message: 'Task is undefined',
                                                    });
                                                    return;
                                                }
                                                router.push({
                                                    pathname: '/modals/forms/task/[id]',
                                                    params: {
                                                        id: task.id,
                                                    },
                                                });
                                            }}>Edit</Button>
                                        <Button disabled={!isActive && Boolean(activeTaskId)} onPress={() => handleTimerToggle(task.id)}>{isActive ? "Stop Timer" : "Start Timer"}</Button>
                                        <Button disabled={!isActive && Boolean(activeTaskId)} onPress={() => handleDeleteTask(task.id)}>Delete</Button>
                                    </View>
                                </Card>
                            )
                        })}
                </View>
            </ScrollView>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 10,
    },
    card: {
        marginVertical: 10,
        padding: 15,
        marginHorizontal: 10,
    },
    taskName: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    taskDescription: {
        fontSize: 16,
        marginBottom: 5,
    },
    timeSpent: {
        fontSize: 14,
        color: 'gray',
        marginBottom: 5,
    },
    timerContainer: {
        alignItems: 'center',
        marginTop: 10,
    },
    timerText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 10,
    },
});

export default React.memo(TasksPage);
