import React from "react";
import { ScrollView, View, StyleSheet } from "react-native";
import { Card, Text, Button, useTheme } from "react-native-paper";
import { faker } from '@faker-js/faker';
import { BarChart } from "react-native-gifted-charts";
import usePaperTheme from "@hooks/usePaperTheme";
import { createAlert } from "@lib/alert";
import { router } from "expo-router";

const Dashboard = () => {
    // Generate fake data
    const theme = useTheme();
    const t = usePaperTheme();
    const totalTasks = faker.number.int({ min: 20, max: 30 });
    const totalProjects = faker.number.int({ min: 10, max: 20 });
    const upcomingTasks = Array.from({ length: 5 }).map(() => faker.lorem.words());
    const barData = [
        { value: 250, label: 'M' },
        { value: 500, label: 'T' },
        { value: 745, label: 'W' },
        { value: 320, label: 'T' },
        { value: 600, label: 'F' },
        { value: 256, label: 'S' },
        { value: 300, label: 'S' },
    ];

    return (
        <View>
            <ScrollView>
                <Card style={styles.card}>
                    <Text style={styles.headerText}>
                        {totalTasks} Tasks
                    </Text>
                    <Text style={styles.subHeaderText}>
                        for {totalProjects} Projects
                    </Text>
                </Card>
                <Card style={styles.card}>
                    <Text style={styles.headerText}>
                        Upcoming Tasks
                    </Text>
                    <View style={styles.upcomingTasksContainer}>
                        {upcomingTasks.map((task, index) => (
                            <Text key={index} style={styles.upcomingTask}>
                                {task}
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
                            createAlert({
                                title: 'Start Timer',
                                message: 'Click OK you fucking idiot'
                            })
                        }}>
                            Start Timer
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