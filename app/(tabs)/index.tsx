import React from "react";
import { ScrollView, View, StyleSheet } from "react-native";
import { Card, Text, Button, Icon, useTheme } from "react-native-paper";
import { BarChart } from "react-native-gifted-charts";
import { router } from "expo-router";
import { useProjects, useRates, useTasks, useTimeTrackings } from "@data/queries";
import { DateTime } from "luxon";
import { useSettings } from "@lib/settings";
import { formatCurrency } from "@lib/currencies";

const Dashboard = () => {
    const theme = useTheme();
    const tasks = useTasks();
    const projects = useProjects();
    const timeTrackingData = useTimeTrackings();
    const rateQuery = useRates();
    const { settings } = useSettings();
    const totalTasks = tasks.data?.length ?? 0;
    const totalProjects = projects.data?.length ?? 0;

    // Bar chart: hours per day for the current week
    const weekStart = DateTime.local().startOf('week');
    const barData = Array.from({ length: 7 }, (_, i) => {
        const dayDate = weekStart.plus({ days: i });
        const dayEntries = timeTrackingData.data?.filter(entry => {
            const entryDate = DateTime.fromISO(entry.startTime);
            return entryDate.hasSame(dayDate, 'day');
        }) || [];
        const value = dayEntries.reduce((acc, curr) => {
            if (!curr.endTime) return acc;
            const start = DateTime.fromISO(curr.startTime);
            const end = DateTime.fromISO(curr.endTime);
            return acc + end.diff(start, 'hours').hours;
        }, 0);
        return { value: Math.round(value * 100) / 100, label: dayDate.toFormat('ccc') };
    });

    // Upcoming tasks: sorted by project deadline, limited to 5
    const upcomingTasks = tasks.data
        ?.map(task => {
            const project = projects.data?.find(p => p.id === task.projectId);
            return { ...task, deadline: project?.deadline, projectName: project?.name };
        })
        .filter(t => t.deadline && DateTime.fromISO(t.deadline) >= DateTime.local())
        .sort((a, b) => DateTime.fromISO(a.deadline!).toMillis() - DateTime.fromISO(b.deadline!).toMillis())
        .slice(0, 5) ?? [];

    // Earnings summary
    const computeEarnings = (since: DateTime) => {
        return timeTrackingData.data?.reduce((total, tt) => {
            if (!tt.endTime) return total;
            const start = DateTime.fromISO(tt.startTime);
            if (start < since) return total;
            const end = DateTime.fromISO(tt.endTime);
            const hours = end.diff(start, 'hours').hours;
            const task = tasks.data?.find(t => t.id === tt.taskId);
            const project = projects.data?.find(p => p.id === task?.projectId);
            const rate = rateQuery.data?.find(r => r.clientId === project?.clientId);
            return total + (rate ? hours * rate.ratePerHour : 0);
        }, 0) || 0;
    };

    const weeklyEarnings = computeEarnings(weekStart);
    const monthlyEarnings = computeEarnings(DateTime.local().startOf('month'));
    const hasEarnings = weeklyEarnings > 0 || monthlyEarnings > 0;

    return (
        <View style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Stats Card */}
                <Card style={styles.card}>
                    <Card.Content>
                        <Text variant="headlineMedium" style={{ color: theme.colors.onSurface }}>
                            {totalTasks} Task{totalTasks !== 1 ? 's' : ''}
                        </Text>
                        <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
                            across {totalProjects} project{totalProjects !== 1 ? 's' : ''}
                        </Text>
                    </Card.Content>
                </Card>

                {/* Earnings Card */}
                {hasEarnings && (
                    <Card style={styles.card}>
                        <Card.Content>
                            <Text variant="titleMedium" style={{ color: theme.colors.onSurface, marginBottom: 8 }}>
                                Earnings
                            </Text>
                            <View style={styles.earningsRow}>
                                <View style={styles.earningsItem}>
                                    <Text variant="headlineSmall" style={{ color: theme.colors.primary }}>
                                        {formatCurrency(weeklyEarnings, settings.currency)}
                                    </Text>
                                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                                        This week
                                    </Text>
                                </View>
                                <View style={styles.earningsItem}>
                                    <Text variant="headlineSmall" style={{ color: theme.colors.primary }}>
                                        {formatCurrency(monthlyEarnings, settings.currency)}
                                    </Text>
                                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                                        This month
                                    </Text>
                                </View>
                            </View>
                        </Card.Content>
                    </Card>
                )}

                {/* Upcoming Tasks Card */}
                <Card style={styles.card}>
                    <Card.Content>
                        <Text variant="titleMedium" style={{ color: theme.colors.onSurface, marginBottom: 8 }}>
                            Upcoming Tasks
                        </Text>
                        {upcomingTasks.length === 0 ? (
                            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                                No upcoming tasks
                            </Text>
                        ) : (
                            upcomingTasks.map((task) => (
                                <View key={task.id} style={styles.upcomingTaskRow}>
                                    <View style={{ flex: 1 }}>
                                        <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                                            {task.name}
                                        </Text>
                                        {task.projectName && (
                                            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                                                {task.projectName}
                                            </Text>
                                        )}
                                    </View>
                                </View>
                            ))
                        )}
                    </Card.Content>
                </Card>

                {/* Productivity Insights */}
                <Card style={styles.card}>
                    <Card.Content>
                        <Text variant="titleMedium" style={{ color: theme.colors.onSurface, marginBottom: 8 }}>
                            This Week
                        </Text>
                        <View style={{ overflow: 'hidden' }}>
                            <BarChart
                                xAxisLabelTextStyle={{ color: theme.colors.onSurfaceVariant }}
                                yAxisTextStyle={{ color: theme.colors.onSurfaceVariant }}
                                barWidth={22}
                                noOfSections={4}
                                barBorderRadius={4}
                                frontColor={theme.colors.primary}
                                data={barData}
                                yAxisThickness={0}
                                xAxisThickness={0}
                                hideRules
                                spacing={18}
                            />
                        </View>
                    </Card.Content>
                </Card>

                {/* Quick Actions */}
                <Card style={styles.card}>
                    <Card.Content>
                        <Text variant="titleMedium" style={{ color: theme.colors.onSurface, marginBottom: 8 }}>
                            Quick Actions
                        </Text>
                        <View style={styles.quickActionsGrid}>
                            <Button
                                mode="contained"
                                icon="briefcase-plus"
                                style={styles.quickActionButton}
                                onPress={() => router.push({ pathname: "modals/forms/project/[id]", params: { id: 'new' } })}
                            >
                                Add Project
                            </Button>
                            <Button
                                mode="contained"
                                icon="plus-circle"
                                style={styles.quickActionButton}
                                onPress={() => router.push({ pathname: "modals/forms/task/[id]", params: { id: 'new' } })}
                            >
                                Add Task
                            </Button>
                            <Button
                                mode="contained-tonal"
                                icon="account-group"
                                style={styles.quickActionButton}
                                onPress={() => router.push("/modals/dialog/clientlist")}
                            >
                                View Clients
                            </Button>
                        </View>
                    </Card.Content>
                </Card>
            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    scrollContent: {
        paddingBottom: 16,
    },
    card: {
        marginHorizontal: 12,
        marginTop: 12,
    },
    earningsRow: {
        flexDirection: 'row',
        gap: 24,
    },
    earningsItem: {
        flex: 1,
    },
    upcomingTaskRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
    },
    quickActionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    quickActionButton: {
        flexGrow: 1,
        minWidth: '45%',
    },
});

export default React.memo(Dashboard);
