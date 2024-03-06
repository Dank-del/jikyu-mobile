import { projects, tasks } from "@data/schema";
import { useForm, Controller } from "react-hook-form";
import { View, StyleSheet } from "react-native";
import React from "react";
import { Button, Dialog, Portal, TextInput, Text } from "react-native-paper";
import { Picker } from "@react-native-picker/picker";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createAlert } from "@lib/alert";
import { useDatabase } from "@hooks/useDatabaseConnection";

interface TaskFormProps {
    taskId?: typeof tasks.$inferInsert['id'];
    update: boolean;
    visible: boolean;
    setVisible: (isVisible: boolean) => void;
}

const TaskForm: React.FC<TaskFormProps> = (props: TaskFormProps) => {
    console.log("TaskForm", props.taskId);
    const queryClient = useQueryClient();
    const db = useDatabase();
    const { control, handleSubmit, formState: { errors }, reset } = useForm<typeof tasks.$inferInsert>();
    const projectsQuery = useQuery({
        queryKey: ['projects'],
        queryFn: async () => {
            return await db.select().from(projects);
        },
        refetchOnWindowFocus: "always",
    });

    const tasksQuery = useQuery({
        queryKey: ['tasks'],
        queryFn: async () => {
            return await db.select().from(tasks);
        },
        refetchOnWindowFocus: "always",
    })

    const task = tasksQuery.data?.find(t => t.id === props.taskId);

    const taskMutation = useMutation({
        mutationKey: ['tasks'],
        mutationFn: async (task: typeof tasks.$inferInsert) => {
            console.log("taskMutation", task, props.update, props.taskId);
            if (props.update) {
                const updatedTask = await db.update(tasks).set({
                    id: props.taskId,
                    name: task.name,
                    description: task.description,
                    projectId: task.projectId,
                });
                queryClient.refetchQueries({ queryKey: ['tasks'] });
                return updatedTask;
            }
            const newTask = await db.insert(tasks).values({
                name: task.name,
                description: task.description,
                projectId: task.projectId,
            });
            queryClient.refetchQueries({ queryKey: ['tasks'] });
            return newTask;
        }
    });

    const onSubmit = handleSubmit(async data => {
        if (!data.projectId) {
            createAlert({
                title: "Error",
                message: "Please select a project",
            });
            return;
        }

        const success = await taskMutation.mutateAsync({
            name: data.name,
            description: data.description,
            projectId: data.projectId,
        });

        if (!success) {
            createAlert({
                title: "Error",
                message: "Failed to save task",
            });
            return;
        }

        reset();
        props.setVisible(false);
    });

    return (
        <View>
            <Portal>
                <Dialog visible={props.visible} onDismiss={() => props.setVisible(false)}>
                    <Dialog.Title>{props.update ? 'Edit Task' : 'Add Task'}</Dialog.Title>
                    <Dialog.Content style={{ display: 'flex', gap: 5 }}>
                        <Text>
                            {errors.name && "Task name is required"}
                            {errors.description && "Description is required"}
                            {errors.projectId && "Project is required"}
                        </Text>
                        <Controller
                            control={control}
                            name="name"
                            defaultValue={task?.name}
                            rules={{ required: true }}
                            render={({ field: { onChange, onBlur, value } }) => {
                                return (
                                    <TextInput
                                        label="Task Name"
                                        onBlur={onBlur}
                                        onChangeText={onChange}
                                        value={value}
                                    />
                                );
                            }}
                        />
                        <Controller
                            control={control}
                            name="description"
                            rules={{ required: true }}
                            defaultValue={task?.description}
                            render={({ field: { onChange, onBlur, value } }) => {
                                return (
                                    <TextInput
                                        label="Description"
                                        onBlur={onBlur}
                                        onChangeText={onChange}
                                        value={value}
                                    />
                                );
                            }}
                        />
                        <Controller
                            control={control}
                            name="projectId"
                            defaultValue={task?.projectId}
                            rules={{ required: true }}
                            render={({ field: { onChange, onBlur, value } }) => {
                                return (
                                    <Picker
                                        selectedValue={value}
                                        style={styles.picker}
                                        onBlur={onBlur}
                                        onValueChange={onChange}
                                    >
                                        <Picker.Item label="Select Project..." value="" />
                                        {projectsQuery.isFetched && projectsQuery.data?.map(project => (
                                            <Picker.Item key={project.id} label={project.name} value={project.id} />
                                        ))}
                                    </Picker>
                                )
                            }}
                        />
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => { props.setVisible(false); reset() }}>Cancel</Button>
                        <Button onPress={onSubmit}>Save</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </View>
    );
};

const styles = StyleSheet.create({
    picker: {
        marginBottom: 10,
    }
});

export default React.memo(TaskForm);
