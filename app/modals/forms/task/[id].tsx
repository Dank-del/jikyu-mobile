import { tasks } from "@data/schema";
import { useForm, Controller } from "react-hook-form";
import { StyleSheet } from "react-native";
import React from "react";
import { Button, Dialog, TextInput, Text, useTheme } from "react-native-paper";
import { Picker } from "@react-native-picker/picker";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createAlert } from "@lib/alert";
import { useDatabase } from "@hooks/useDatabaseConnection";
import { router, useLocalSearchParams } from "expo-router";
import { useProjects, useTasks } from "@data/queries";

const TaskForm: React.FC = () => {
    const theme = useTheme();
    const { id } = useLocalSearchParams()
    const update = !(id === 'new');
    console.log("TaskForm", id);
    const tasksQuery = useTasks();
    const task = tasksQuery.data?.find(t => t.id === parseInt(id!.toString()));
    const queryClient = useQueryClient();
    const db = useDatabase();
    const { control, handleSubmit, formState: { errors }, reset } = useForm<typeof tasks.$inferInsert>();
    const projectsQuery = useProjects();

    const taskMutation = useMutation({
        mutationKey: ['tasks'],
        mutationFn: async (task: typeof tasks.$inferInsert) => {
            console.log("taskMutation", task, update, task.id);
            if (update) {
                const updatedTask = await db.update(tasks).set({
                    id: task.id,
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
        router.push("../");
    });

    return (
        <Dialog visible>
            <Dialog.Title>{update ? 'Edit Task' : 'Add Task'}</Dialog.Title>
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
                                <Picker.Item color={theme.colors.onSurface} style={{ color: 'white' }} label="Select Project..." value="" />
                                {projectsQuery.isFetched && projectsQuery.data?.map(project => (
                                    <Picker.Item color={theme.colors.onSurface} key={project.id} label={project.name} value={project.id} />
                                ))}
                            </Picker>
                        )
                    }}
                />
            </Dialog.Content>
            <Dialog.Actions>
                <Button onPress={() => { router.push("../"); reset() }}>Cancel</Button>
                <Button onPress={onSubmit}>Save</Button>
            </Dialog.Actions>
        </Dialog>
    );
};

const styles = StyleSheet.create({
    picker: {
        marginBottom: 10,
    }
});

export default React.memo(TaskForm);
