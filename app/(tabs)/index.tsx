import React from "react";
import { ScrollView, View, StyleSheet } from "react-native";
import { Card, Text, Button, useTheme } from "react-native-paper";
import { BarChart } from "react-native-gifted-charts";
import { router } from "expo-router";
import { useProjects, useTasks, useTimeTrackings } from "@data/queries";
import { DateTime } from "luxon";

const Dashboard = () => {
    // Generate fake data
    const theme = useTheme();
    const tasks = useTasks();
    const projects = useProjects();
    const timeTrackingData = useTimeTrackings();
    const totalTasks = tasks.data?.length
    const totalProjects = projects.data?.length
    const weekdayInitials = ['M', 'T', 'W', 'T', 'F', 'S', 'S']; // Weekday initials array
    // Map the data to the format needed for the bar chart
    const barData = weekdayInitials.map(day => {
        // Filter the data for the specific day
        const dayData = timeTrackingData.data?.filter(entry => weekdayInitials[DateTime.fromISO(entry.startTime).localWeekday] === day);

        // Sum the time spent for the day
        // sum the difference between the start and end time of each entry
        const value = dayData?.reduce((acc, curr) => {
            const startTime = DateTime.fromISO(curr.startTime);
            const endTime = DateTime.fromISO(curr.endTime!);
            return acc + endTime.diff(startTime, 'hours').hours;
        }, 0) || 0;

        // Return the data point for the bar chart
        return { value, label: day };
    });

    return (
        <View>
            <ScrollView>
                <Card style={styles.card}>
                    <Text style={styles.headerText}>
                        {totalTasks} Task(s)
                    </Text>
                    <Text style={styles.subHeaderText}>
                        for {totalProjects} Project(s)
                    </Text>
                </Card>
                <Card style={styles.card}>
                    <Text style={styles.headerText}>
                        Upcoming Tasks
                    </Text>
                    <View style={styles.upcomingTasksContainer}>
                        {tasks.data?.map((task, index) => (
                            <Text key={index} style={styles.upcomingTask}>
                                {task.name}
                            </Text>
                        ))}
                    </View>
                </Card>
                <Card style={styles.card}>
                    <Text style={styles.headerText}>
                        Productivity Insights
                    </Text>
                    <View style={{
                        overflow: 'hidden'

                    }}>
                        <BarChart
                            xAxisLabelTextStyle={{
                                color: theme.colors.secondary
                            }}
                            yAxisTextStyle={{
                                color: theme.colors.secondary
                            }}
                            barWidth={15}
                            color="white"
                            frontColor={theme.colors.primary}
                            data={barData}
                        />
                    </View>
                </Card>
                <Card style={styles.card}>
                    <Text style={styles.headerText}>
                        Quick Actions
                    </Text>
                    <View style={{
                        display: 'flex',
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        columnGap: 8,
                    }}>
                        <Button mode="contained" style={styles.quickActionButton} onPress={() => {
                            router.push({
                                pathname: "modals/forms/project/[id]",
                                params: {
                                    id: 'new'
                                }
                            })
                        }}>
                            Add Project
                        </Button>
                        <Button mode="contained" style={styles.quickActionButton}
                            onPress={() => router.push({
                                pathname: "modals/forms/task/[id]",
                                params: {
                                    id: 'new'
                                }
                            })}
                        >
                            Add Task
                        </Button>
                        <Button mode="contained" style={styles.quickActionButton} onPress={() => router.push("/modals/dialog/clientlist")}>View Clients</Button>
                    </View>
                    {/* Add more quick actions as needed */}
                </Card>
                {/* Add more widgets based on the suggested requirements */}
            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    card: {
        padding: 20,
        margin: 10,
    },
    headerText: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    subHeaderText: {
        fontSize: 18,
    },
    upcomingTasksContainer: {
        marginTop: 10,
    },
    upcomingTask: {
        fontSize: 16,
        marginBottom: 5,
    },
    quickActionButton: {
        marginTop: 10,
    },
});

export default React.memo(Dashboard);