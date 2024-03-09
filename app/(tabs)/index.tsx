import React, { useState } from "react";
import { ScrollView, View, StyleSheet, useColorScheme } from "react-native";
import { Appbar, Card, Text, Button, useTheme } from "react-native-paper";
import { faker } from '@faker-js/faker';
import { BarChart } from "react-native-gifted-charts";
import usePaperTheme from "@hooks/usePaperTheme";
import TaskForm from "@components/forms/task";
import { TaskFormStateProps } from "@lib/stateprops";
import { createAlert } from "@lib/alert";
import ClientDialog from "@components/dialog/clientlist";

const Dashboard = () => {
    // Generate fake data
    const theme = useTheme();
    const t = usePaperTheme();
    const [clientDialogVisible, setClientDialogVisible] = useState(false);
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
    const [taskFormVisible, setTaskFormVisible] = useState<TaskFormStateProps>({
        edit: false,
        visible: false,
    });

    return (
        <View style={{
            backgroundColor: theme.colors.background
        }}>
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
                        <Button mode="contained" style={styles.quickActionButton} onPress={() => setTaskFormVisible({
                            visible: true,
                            edit: false,
                        })}>
                            Add Task
                        </Button>
                        <Button mode="contained" style={styles.quickActionButton} onPress={() => setClientDialogVisible(!clientDialogVisible)}>View Clients</Button>
                    </View>
                    {/* Add more quick actions as needed */}
                </Card>
                {/* Add more widgets based on the suggested requirements */}
            </ScrollView>
            <ClientDialog visible={clientDialogVisible} setVisible={setClientDialogVisible} />
            <TaskForm update={taskFormVisible.edit} visible={taskFormVisible.visible} setVisible={() => setTaskFormVisible({
                ...taskFormVisible,
                visible: false,
            })} />
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