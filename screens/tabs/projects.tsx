import React, { useState } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { Appbar, Card, Text, Button } from "react-native-paper";
import { projects, clients } from "@data/schema";
import ProjectForm from "@components/forms/project";
import ClientForm from "@components/forms/client";
import { useQuery } from "@tanstack/react-query";
import { createAlert } from "@lib/alert";
import { useDatabase } from "@hooks/useDatabaseConnection";
import { eq } from "drizzle-orm";

type ProjectFormStateProps = {
    edit: boolean;
    visible: boolean;
    project?: typeof projects.$inferInsert;
};

type ClientFormStateProps = {
    edit: boolean;
    visible: boolean;
    clientId?: typeof clients.$inferSelect['id'];
};

const ProjectsPage = () => {
    const db = useDatabase();
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
            message: "Are you sure you want to delete this project?",
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
                        await db.delete(projects).where(eq(projects.id, id)).execute();
                        projectsQuery.refetch();
                    }
                }
            ]
        })
    };

    return (
        <>
            <Appbar.Header>
                <Appbar.Content title="Projects" />
                <Appbar.Action icon="plus" onPress={() => setProjectFormVisible({
                    visible: true,
                    edit: false,
                })} />
            </Appbar.Header>
            <ScrollView>
                <View style={styles.container}>
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
                                    justifyContent: 'space-between',
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
        </>
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

export default React.memo(React.forwardRef(ProjectsPage));