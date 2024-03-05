import React, { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Appbar, Button, Card, Text } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { useDatabase } from '@hooks/useDatabaseConnection';
import { projects, rates, tasks, timeTrackings } from '@data/schema';
import { eq } from 'drizzle-orm';
import { createAlert } from '@lib/alert';
import TaskForm from '@components/forms/task';
import { TaskFormStateProps } from '@lib/stateprops';
import { DateTime, Interval } from 'luxon';

const TasksPage: React.FC = () => {
    const database = useDatabase();
    const tasksQuery = useQuery({
        queryKey: ['tasks'],
        queryFn: async () => {
            return await database.select().from(tasks);
        },
    });

    const timeTrackingsQuery = useQuery({
        queryKey: ['timeTrackings'],
        queryFn: async () => {
            return await database.select().from(timeTrackings);
        },
    });

    const projectsQuery = useQuery({
        queryKey: ['projects'],
        queryFn: async () => {
            return await database.select().from(projects);
        },
    })

    const rateQuery = useQuery({
        queryKey: ['rate'],
        queryFn: async () => {
            return await database.select().from(rates);
        },
    });

    const [taskFormVisible, setTaskFormVisible] = useState<TaskFormStateProps>({
        edit: false,
        visible: false,
    });

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
    const [startTime, setStartTime] = useState(null);
    const [endTime, setEndTime] = useState(null);

    return (
        <>
            <Appbar.Header>
                <Appbar.Content title="Tasks" />
                <Appbar.Action icon="plus" onPress={() => setTaskFormVisible({
                    visible: true,
                    edit: false,
                })} />
            </Appbar.Header>
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
                                // <Card key={task.id} style={styles.card}>
                                //     <Text style={styles.taskName}>{task.name}</Text>
                                //     <Text style={styles.taskDescription}>{task.description}</Text>
                                //     <View style={styles.buttonContainer}>
                                //         <Button onPress={() => setTaskFormVisible({
                                //             visible: true,
                                //             edit: true,
                                //             task,
                                //         })}>Edit</Button>
                                //         <Button onPress={() => handleDeleteTask(task.id)}>Delete</Button>
                                //     </View>
                                // </Card>
                                <Card key={task.id} style={styles.card}>
                                    <Text style={styles.taskName}>{task.name}</Text>
                                    <Text style={styles.taskDescription}>{task.description}</Text>
                                    <Text style={styles.timeSpent}>Time Spent: {totalHours}</Text>
                                    <Text style={styles.earnings}>Earnings: {totalEarnings}</Text>
                                    <View style={styles.timerContainer}>
                                        <Button>{timerActive ? "Stop Timer" : "Start Timer"}</Button>
                                    </View>
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
                                            setTaskFormVisible({
                                                visible: true,
                                                edit: true,
                                                taskId: task.id,
                                            })
                                        }}>Edit</Button>
                                        <Button onPress={() => handleDeleteTask(task.id)}>Delete</Button>
                                    </View>
                                </Card>
                            )
                        })}
                </View>
            </ScrollView>
            <TaskForm taskId={taskFormVisible.taskId} update={taskFormVisible.edit} visible={taskFormVisible.visible} setVisible={() => setTaskFormVisible({
                ...taskFormVisible,
                visible: false,
            })} />
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
    earnings: {
        fontSize: 14,
        color: 'gray',
        marginBottom: 5,
    },
    timerContainer: {
        alignItems: 'center',
        marginBottom: 10,
    },
    timerButton: {
        fontSize: 16,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
});

export default React.memo(TasksPage);
