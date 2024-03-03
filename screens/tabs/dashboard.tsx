import React from "react";
import { ScrollView, View, StyleSheet } from "react-native";
import { Appbar, Card, Text, Button } from "react-native-paper";
import { faker } from '@faker-js/faker';
import { BarChart } from "react-native-gifted-charts";
import usePaperTheme from "@hooks/usePaperTheme";

const Dashboard = () => {
    // Generate fake data
    const { paperTheme } = usePaperTheme();
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
        <>
            <Appbar.Header>
                <Appbar.Content title="Dashboard" />
            </Appbar.Header>
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
                            barWidth={15}
                            frontColor={paperTheme.colors.primary}
                            data={barData}
                        />
                    </View>
                </Card>
                <Card style={styles.card}>
                    <Text style={styles.headerText}>
                        Quick Actions
                    </Text>
                    <Button mode="contained" style={styles.quickActionButton}>
                        Start Timer
                    </Button>
                    <Button mode="contained" style={styles.quickActionButton}>
                        Add Task
                    </Button>
                    {/* Add more quick actions as needed */}
                </Card>
                {/* Add more widgets based on the suggested requirements */}
            </ScrollView>
        </>
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

export default React.memo(React.forwardRef(Dashboard));