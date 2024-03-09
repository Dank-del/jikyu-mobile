import React, { useState } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { Appbar, Card, Text, Button, useTheme } from "react-native-paper";
import { projects, clients, tasks } from "@data/schema";
import ProjectForm from "@components/forms/project";
import ClientForm from "@components/forms/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createAlert } from "@lib/alert";
import { useDatabase } from "@hooks/useDatabaseConnection";
import { eq } from "drizzle-orm";
import { ProjectFormStateProps, ClientFormStateProps } from "@lib/stateprops";



const ProjectsPage = () => {
    const queryClient = useQueryClient();
    const db = useDatabase();
    const theme = useTheme();
    const projectsQuery = useQuery({
        queryKey: ['projects'],
        queryFn: async () => {
            // await ProjectRepository.clear();
            return await db.select().from(projects);
        },
        // refetchInterval: 7000,
    });

    console.log("projectsQuery", projectsQuery);

    const [projectFormVisible, setProjectFormVisible] = useState<ProjectFormStateProps>({
        edit: false,
        visible: false,
    });

    const [clientFormVisible, setClientFormVisible] = useState<ClientFormStateProps>({
        edit: false,
        visible: false,
    });

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
            message: "Are you sure you want to delete this project? it will delete any tasks related to it as well. This action CANNOT be undone.",
            buttons: [
                {
                    text: "Cancel",
                    style: "cancel",
                    onPress: () => console.log("Cancel Pressed")
                },
                {
                    text: "OK",
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
        <View style={{
            backgroundColor: theme.colors.background
        }}>
            <ScrollView>
                <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
                    {projectsQuery.isFetched && projectsQuery.data?.map((project: typeof projects.$inferSelect) => {
                        const client = db.select({
                            name: clients.name
                        }).from(clients).where(eq(clients.id, project.clientId)).get();
                        return (
                            <Card key={project.id} style={styles.card}>
                                <Text style={styles.projectName}>{project.name}</Text>
                                <Text style={styles.projectDescription}>{project.description}</Text>
                                <Text style={styles.projectInfo}>Client: {client?.name}</Text>
                                <Text style={styles.projectInfo}>Deadline: {project.deadline}</Text>
                                <View style={{
                                    display: 'flex',
                                    flexDirection: 'row',
                                    justifyContent: 'center',
                                    width: '100%',
                                    gap: 10,
                                }}>
                                    <Button style={styles.optionButtons} mode="contained" onPress={() => setProjectFormVisible({
                                        visible: true,
                                        edit: true,
                                        project: project,
                                    })}>Edit</Button>
                                    <Button mode="contained" onPress={() => onDelete(project.id)} buttonColor="red" style={styles.optionButtons}>Delete</Button>
                                </View>
                            </Card>
                        )
                    })}
                </View>
            </ScrollView>
            {/* Add New Project Dialog */}
            <ProjectForm update={projectFormVisible.edit} visible={projectFormVisible.visible} project={projectFormVisible.project} setVisible={() => setProjectFormVisible({
                ...projectFormVisible,
                visible: false,
            })} />
            {/* Edit Project Dialog */}

            {/* Add New Client Dialog */}
            <ClientForm update={clientFormVisible.edit} visible={clientFormVisible.visible} setVisible={() => setClientFormVisible({
                ...clientFormVisible,
                visible: false,
            })} />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        padding: 10,
    },
    card: {
        marginVertical: 10,
        padding: 15,
        marginHorizontal: 10,
    },
    projectName: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    projectDescription: {
        fontSize: 16,
        marginBottom: 5,
    },
    projectInfo: {
        fontSize: 14,
        color: 'gray',
    },
    optionButtons: {
        marginTop: 7,
        width: '50%'
    }
});

export default React.memo(ProjectsPage);