import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';
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
    console.log(timeTrackingsQuery);
    const projectsQuery = useProjects();
    const rateQuery = useRates();

    const handleDeleteTask = async (taskId: typeof tasks.$inferInsert['id']) => {
        if (!taskId) {
            createAlert({
                title: 'Error in deletion',
                message: 'Id is undefined',
            });
            return;
        }
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
    };

    const [timerActive, setTimerActive] = useState(false);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [elapsedTime, setElapsedTime] = useState(0);

    useEffect(() => {
        let interval: string | number | NodeJS.Timeout | undefined;
        if (timerActive) {
            interval = setInterval(() => {
                setElapsedTime(prevElapsedTime => prevElapsedTime + 1);
            }, 1000);
        } else {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [timerActive]);

    const formatTime = (timeInSeconds: number): string => {
        const hours = Math.floor(timeInSeconds / 3600);
        const minutes = Math.floor((timeInSeconds % 3600) / 60);
        const seconds = Math.floor(timeInSeconds % 60);
        return `${padZero(hours)}:${padZero(minutes)}:${padZero(seconds)}`;
    };

    const padZero = (num: number): string => {
        return num < 10 ? `0${num}` : num.toString();
    };

    const handleTimerToggle = async (taskId: typeof tasks.$inferInsert['id']) => {
        if (!taskId) {
            createAlert({
                title: 'Error in toggling timer',
                message: 'Task ID is undefined',
            });
            return;
        }
        const qtimeTrackings = timeTrackingsQuery.data?.filter(tt => tt.taskId === taskId);
        const activeTimeTracking = qtimeTrackings?.find(tt => !tt.endTime);
        if (activeTimeTracking) {
            // set end time of active time tracking
            const completeTimeTrack = await database.update(timeTrackings).set({
                id: activeTimeTracking.id,
                endTime: DateTime.now().toISO(),
            }).execute();
            console.log('Completed time tracking:', completeTimeTrack);
        } else {
            // start new timer if not active
            const newTimetrack = await database.insert(timeTrackings).values({
                taskId: taskId,
                startTime: DateTime.now().toISO(),
            }).execute();
            console.log('New time tracking:', newTimetrack);
        }
        setTimerActive(prevTimerActive => !prevTimerActive);
        if (!timerActive) {
            setStartTime(Date.now());
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
                            // sum the time difference of end time and start of each time tracking
                            const totalMinutes = timeTracking.reduce((acc, tt) => {
                                if (tt.endTime && tt.startTime) {
                                    const start = DateTime.fromISO(tt.startTime);
                                    const end = DateTime.fromISO(tt.endTime);
                                    return acc + Interval.fromDateTimes(start, end).length('minutes');
                                }
                                return acc;
                            }, 0);

                            const totalHours = totalMinutes / 60;

                            const rate = rateQuery.data.find(r => r.clientId === (projectsQuery.data.find(p => p.id === task.projectId)?.clientId));
                            const totalEarnings = rate ? totalHours * rate.ratePerHour : 0;

                            return (
                                <Card key={task.id} style={styles.card}>
                                    <Text style={styles.taskName}>{task.name}</Text>
                                    <Text style={styles.taskDescription}>{task.description}</Text>
                                    {totalHours > 0 && <Text style={styles.timeSpent}>Time Spent: {totalHours} hours</Text>}
                                    {totalEarnings > 0 && <Text style={styles.timeSpent}>Earnings: ${totalEarnings}</Text>}
                                    {timerActive && (
                                        <View style={styles.timerContainer}>
                                            <Text style={styles.timerText}>Elapsed Time: {formatTime(elapsedTime)}</Text>
                                        </View>
                                    )}
                                    <View style={styles.buttonContainer}>
                                        <Button onPress={() => {
                                            if (!task) {
                                                createAlert({
                                                    title: 'Error in editing task',
                                                    message: 'Task is undefined',
                                                });
                                                return;
                                            }
                                            console.log('Task:', task);
                                            router.push({
                                                pathname: '/modals/forms/task/[id]',
                                                params: {
                                                    id: task.id,
                                                },
                                            });
                                        }}>Edit</Button>
                                        <Button onPress={() => handleTimerToggle(task.id)}>{timerActive ? "Stop Timer" : "Start Timer"}</Button>
                                        <Button onPress={() => handleDeleteTask(task.id)}>Delete</Button>
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