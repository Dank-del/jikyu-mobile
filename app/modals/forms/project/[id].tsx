import { clients, projects } from "@data/schema";
import { useForm, Controller } from "react-hook-form";
import { StyleSheet } from "react-native";
import React from "react";
import { Button, Dialog, TextInput, useTheme } from "react-native-paper";
import { Picker } from "@react-native-picker/picker";
import { DatePickerModal } from "react-native-paper-dates";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createAlert } from "@lib/alert";
import { useDatabase } from "@hooks/useDatabaseConnection";
import { eq } from "drizzle-orm";
import { DateTime } from 'luxon';
import { router, useLocalSearchParams } from "expo-router";
import { useClients } from "@data/queries";

const ProjectForm = () => {
    const theme = useTheme();
    const { id } = useLocalSearchParams();
    const update = !(id === 'new')
    const projectsQuery = useQuery({
        queryKey: ['projects'],
        queryFn: async () => {
            return await db.select().from(projects);
        },
        refetchOnWindowFocus: "always",
    });
    const existingProject = projectsQuery.data?.filter(p => p.id === parseInt(id!.toString()))[0];
    const queryClient = useQueryClient();
    const db = useDatabase();
    const [showDatePicker, setShowDatePicker] = React.useState(false);
    const { control, handleSubmit, formState: { errors }, reset } = useForm<typeof projects.$inferInsert>();
    const clientQuery = useClients();
    console.log("clients", clientQuery.data);
    const projectMutation = useMutation({
        mutationKey: ['projects'],
        mutationFn: async (project: typeof projects.$inferInsert) => {
            if (update && existingProject) {
                const up = await db.update(projects).set({
                    id: existingProject.id,
                    name: project.name,
                    description: project.description,
                    clientId: project.clientId,
                    deadline: project.deadline,
                })
                queryClient.refetchQueries({ queryKey: ['projects'] });
                return up
            }
            const newProj = await db.insert(projects).values({
                name: project.name,
                description: project.description,
                clientId: project.clientId,
                deadline: project.deadline,
            })
            queryClient.refetchQueries({ queryKey: ['projects'] });
            reset();
            return newProj;
        }
    });
    const onSubmit = handleSubmit(async data => {
        console.log("proj-submit", data);
        if (!data.deadline) {
            createAlert({
                title: "Error",
                message: "Please select a deadline",
            });
            return;
        }

        const client = (await db.select().from(clients).where(eq(clients.id, data.clientId)));

        console.log("ClientRepository", client);

        if (!client) {
            createAlert({
                title: "Error",
                message: "Client not found",
            });
            return;
        }
        const succ = await projectMutation.mutateAsync(
            {
                name: data.name,
                description: data.description,
                clientId: data.clientId,
                deadline: DateTime.fromJSDate(new Date(data.deadline)).toISO(),
            }
        )

        if (!succ) {
            createAlert({
                title: "Error",
                message: "Failed to save project",
            });
            return;
        }

        router.push("../");
    });
    return (
        <Dialog visible>
            <Dialog.Title>{update ? "Edit Project" : "New Project"}</Dialog.Title>
            <Dialog.Content style={{
                display: 'flex',
                gap: 5,
            }}>
                <Controller
                    control={control}
                    name="name"
                    defaultValue={update ? existingProject?.name : ""}
                    rules={{ required: true }}
                    render={({ field: { onChange, onBlur, value } }) => {
                        return (
                            <TextInput
                                label="Project Name"
                                onBlur={onBlur}
                                onChangeText={onChange}
                                value={value}
                                // mode="outlined"
                                defaultValue={existingProject?.name}
                            />
                        );
                    }}
                />
                <Controller
                    control={control}
                    name="description"
                    rules={{ required: true }}
                    defaultValue={update ? existingProject?.description : ""}
                    render={({ field: { onChange, onBlur, value } }) => {
                        return (
                            <TextInput
                                label="Description"
                                onBlur={onBlur}
                                onChangeText={onChange}
                                value={value}
                                // mode="outlined"
                                defaultValue={existingProject?.description}
                            />
                        );
                    }}
                />
                <Controller
                    control={control}
                    name="clientId"
                    defaultValue={update ? existingProject?.clientId : undefined}
                    rules={{ required: true }}
                    render={({ field: { onChange, onBlur, value } }) => {
                        // clientQuery.refetch()
                        return (
                            <Picker
                                selectedValue={value}
                                style={styles.picker}
                                onBlur={onBlur}
                                onValueChange={onChange}
                            >
                                {clientQuery.isFetched
                                    &&
                                    ((clientQuery.data?.length || 0) > 0)
                                    ?
                                    <Picker.Item color={theme.colors.onSurface} label="Select Client..." value="" /> :
                                    <Picker.Item color={theme.colors.onSurface} label="No Client (Click New!)" value="" />}
                                {clientQuery.data?.map((client) => (
                                    <Picker.Item color={theme.colors.onSurface} key={client.id} label={client.name} value={client.id} />
                                ))}
                            </Picker>
                        )
                    }}
                />
                <Button mode="contained" onPress={() => router.push({
                    pathname: '/modals/forms/client/[id]',
                    params: {
                        id: 'new'
                    }
                })}>New</Button>
                <Controller
                    control={control}
                    name="deadline"
                    defaultValue={existingProject?.deadline}
                    rules={{ required: true }}
                    render={({ field: { onChange, onBlur, value } }) => {
                        if (typeof value == 'object') {
                            value = DateTime.fromJSDate(value as unknown as Date).toISO();
                        }
                        const cDate = existingProject?.deadline ? DateTime.fromISO(existingProject.deadline) : DateTime.now();

                        return (
                            <>
                                <Button
                                    icon="calendar-multiselect"
                                    mode="outlined"
                                    onPress={() => setShowDatePicker(true)}
                                >
                                    {value ? DateTime.fromISO(value).toLocaleString({ weekday: 'long', month: 'long', day: '2-digit', year: '2-digit' }) : "Select Deadline"}
                                </Button>
                                <DatePickerModal
                                    mode="single"
                                    locale="en-GB"
                                    visible={showDatePicker}
                                    presentationStyle="pageSheet"
                                    startDate={new Date()}
                                    date={cDate.toJSDate()}
                                    // onChange={({ date }) => onChange(date)}
                                    allowEditing={true}
                                    onDismiss={() => setShowDatePicker(false)}
                                    onConfirm={({ date }) => { onChange(date); setShowDatePicker(false) }}
                                />
                            </>
                        )
                    }}
                />
            </Dialog.Content>
            <Dialog.Actions>
                <Button onPress={onSubmit}>Save</Button>
                <Button onPress={() => { router.push("../"); reset() }}>Cancel</Button>
            </Dialog.Actions>
        </Dialog>
    );
};

const styles = StyleSheet.create({
    picker: {
        marginBottom: 10,
    },
});

export default React.memo(ProjectForm);