import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Appbar, Button, Card, Chip, Text, useTheme } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { useProjects, useTasks, useTimeTrackings, useRates, useClients } from '@data/queries';
import { DateTime, Interval } from 'luxon';

const ProjectDetail: React.FC = () => {
    const { id } = useLocalSearchParams();
    const theme = useTheme();
    const projectsQuery = useProjects();
    const tasksQuery = useTasks();
    const timeTrackingsQuery = useTimeTrackings();
    const rateQuery = useRates();
    const clientsQuery = useClients();

    const project = projectsQuery.data?.find(p => p.id === parseInt(id!.toString()));
    const projectTasks = tasksQuery.data?.filter(t => t.projectId === project?.id) ?? [];
    const client = clientsQuery.data?.find(c => c.id === project?.clientId);
    const rate = rateQuery.data?.find(r => r.clientId === project?.clientId);

    const statusLabels: Record<string, string> = {
        'todo': 'To Do',
        'in_progress': 'In Progress',
        'completed': 'Completed',
    };

    // Compute aggregate stats
    const totalMilliseconds = projectTasks.reduce((total, task) => {
        const trackings = timeTrackingsQuery.data?.filter(tt => tt.taskId === task.id) ?? [];
        return total + trackings.reduce((acc, tt) => {
            if (tt.endTime && tt.startTime) {
                return acc + Interval.fromDateTimes(
                    DateTime.fromISO(tt.startTime),
                    DateTime.fromISO(tt.endTime)
                ).length('milliseconds');
            }
            return acc;
        }, 0);
    }, 0);

    const totalHours = totalMilliseconds / 3_600_000;
    const totalEarnings = rate ? totalHours * rate.ratePerHour : 0;

    function formatDuration(ms: number): string {
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    }

    if (!project) {
        return (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Text variant="bodyLarge">Project not found</Text>
                <Button onPress={() => router.back()}>Go Back</Button>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <Appbar.Header>
                <Appbar.BackAction onPress={() => router.back()} />
                <Appbar.Content title={project.name} />
                <Appbar.Action icon="pencil" onPress={() => router.push({
                    pathname: '/modals/forms/project/[id]',
                    params: { id: project.id }
                })} />
            </Appbar.Header>
            <ScrollView>
                {/* Project Info */}
                <Card style={styles.card}>
                    <Card.Content>
                        <Text variant="bodyLarge">{project.description}</Text>
                        <View style={styles.infoRow}>
                            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                                Client: {client?.name ?? 'Unknown'}
                            </Text>
                            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                                Deadline: {DateTime.fromISO(project.deadline!).toLocaleString({ month: 'short', day: 'numeric', year: 'numeric' })}
                            </Text>
                        </View>
                    </Card.Content>
                </Card>

                {/* Stats */}
                <Card style={styles.card}>
                    <Card.Content>
                        <Text variant="titleMedium" style={{ marginBottom: 8 }}>Summary</Text>
                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <Text variant="headlineSmall" style={{ color: theme.colors.primary }}>{projectTasks.length}</Text>
                                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Tasks</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text variant="headlineSmall" style={{ color: theme.colors.primary }}>
                                    {totalMilliseconds > 0 ? formatDuration(totalMilliseconds) : '0m'}
                                </Text>
                                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Time Tracked</Text>
                            </View>
                            {rate && (
                                <View style={styles.statItem}>
                                    <Text variant="headlineSmall" style={{ color: theme.colors.primary }}>
                                        ${totalEarnings.toFixed(2)}
                                    </Text>
                                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Earnings</Text>
                                </View>
                            )}
                        </View>
                    </Card.Content>
                </Card>

                {/* Tasks */}
                <View style={styles.sectionHeader}>
                    <Text variant="titleMedium">Tasks</Text>
                    <Button
                        mode="contained-tonal"
                        compact
                        icon="plus"
                        onPress={() => router.push({ pathname: '/modals/forms/task/[id]', params: { id: 'new' } })}
                    >
                        Add Task
                    </Button>
                </View>

                {projectTasks.length === 0 ? (
                    <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', padding: 24 }}>
                        No tasks for this project yet.
                    </Text>
                ) : (
                    projectTasks.map(task => {
                        const isCompleted = task.status === 'completed';
                        return (
                            <Card key={task.id} style={[styles.card, isCompleted ? { opacity: 0.6 } : {}]}>
                                <Card.Title
                                    title={task.name}
                                    titleStyle={isCompleted ? { textDecorationLine: 'line-through' } : undefined}
                                    right={() => (
                                        <Chip compact style={{ marginRight: 16 }}>
                                            {statusLabels[task.status ?? 'todo']}
                                        </Chip>
                                    )}
                                />
                                <Card.Content>
                                    <Text variant="bodyMedium">{task.description}</Text>
                                </Card.Content>
                            </Card>
                        );
                    })
                )}

                <View style={{ height: 24 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        marginHorizontal: 12,
        marginTop: 12,
    },
    infoRow: {
        marginTop: 8,
        gap: 4,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 16,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginTop: 16,
    },
});

export default ProjectDetail;
