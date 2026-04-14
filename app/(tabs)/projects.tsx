import React, { useState } from "react";
import { View, ScrollView, StyleSheet, RefreshControl } from "react-native";
import { Card, Text, Button, Icon, Searchbar, useTheme } from "react-native-paper";
import { projects, tasks } from "@data/schema";
import { useQueryClient } from "@tanstack/react-query";
import { createAlert } from "@lib/alert";
import { useDatabase } from "@hooks/useDatabaseConnection";
import { eq } from "drizzle-orm";
import { router } from "expo-router";
import { useClients, useProjects } from "@data/queries";
import { DateTime } from "luxon";

const ProjectsPage = () => {
    const queryClient = useQueryClient();
    const db = useDatabase();
    const theme = useTheme();
    const projectsQuery = useProjects();
    const clientsQuery = useClients();
    const clientMap = new Map(clientsQuery.data?.map(c => [c.id, c]) ?? []);
    const [searchQuery, setSearchQuery] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = async () => {
        setRefreshing(true);
        await projectsQuery.refetch();
        await clientsQuery.refetch();
        setRefreshing(false);
    };

    const filteredProjects = projectsQuery.data?.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const onDelete = (id: typeof projects.$inferInsert['id']) => {
        if (!id) {
            createAlert({
                title: "Error in deletion",
                message: "Id is undefined"
            })
            return;
        }
        createAlert({
            title: "Delete Project",
            message: "Are you sure you want to delete this project? It will delete any tasks related to it as well. This action CANNOT be undone.",
            buttons: [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        await db.delete(tasks).where(eq(tasks.projectId, id)).execute();
                        await db.delete(projects).where(eq(projects.id, id)).execute();
                        projectsQuery.refetch();
                        queryClient.refetchQueries({ queryKey: ['tasks'] });
                    }
                }
            ]
        })
    };

    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
            {(projectsQuery.data?.length ?? 0) > 0 && (
                <Searchbar
                    placeholder="Search projects..."
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    style={styles.searchbar}
                />
            )}
            <ScrollView
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                <View style={styles.container}>
                    {projectsQuery.isFetched && (filteredProjects?.length ?? 0) === 0 && !searchQuery && (
                        <View style={styles.emptyState}>
                            <Icon source="briefcase-plus-outline" size={64} color={theme.colors.onSurfaceVariant} />
                            <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, marginTop: 16, textAlign: 'center' }}>
                                No projects yet.{'\n'}Create your first project to get started.
                            </Text>
                            <Button
                                mode="contained"
                                style={{ marginTop: 16 }}
                                icon="plus"
                                onPress={() => router.push({ pathname: '/modals/forms/project/[id]', params: { id: 'new' } })}
                            >
                                Add Project
                            </Button>
                        </View>
                    )}
                    {projectsQuery.isFetched && (filteredProjects?.length ?? 0) === 0 && searchQuery && (
                        <View style={styles.emptyState}>
                            <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
                                No projects match "{searchQuery}"
                            </Text>
                        </View>
                    )}
                    {filteredProjects?.map((project: typeof projects.$inferSelect) => {
                        const client = clientMap.get(project.clientId);
                        return (
                            <Card
                                key={project.id}
                                style={styles.card}
                                onPress={() => router.push({ pathname: '/project/[id]', params: { id: project.id } })}
                            >
                                <Card.Title
                                    title={project.name}
                                    subtitle={`Client: ${client?.name ?? 'Unknown'}`}
                                />
                                <Card.Content>
                                    <Text variant="bodyMedium" style={{ marginBottom: 4 }}>{project.description}</Text>
                                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                                        Deadline: {DateTime.fromISO(project.deadline!).toLocaleString({ weekday: 'long', month: 'long', day: '2-digit', year: 'numeric' })}
                                    </Text>
                                </Card.Content>
                                <Card.Actions>
                                    <Button
                                        icon="pencil"
                                        onPress={() => router.push({
                                            pathname: '/modals/forms/project/[id]',
                                            params: { id: project.id }
                                        })}
                                    >
                                        Edit
                                    </Button>
                                    <Button
                                        mode="outlined"
                                        icon="delete"
                                        textColor={theme.colors.error}
                                        onPress={() => onDelete(project.id)}
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
    )
}

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
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
        paddingHorizontal: 40,
    },
});

export default React.memo(ProjectsPage);
