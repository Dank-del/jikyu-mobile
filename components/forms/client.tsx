import { Portal, Dialog, Button, TextInput, Text } from "react-native-paper";
import { useForm, Controller } from "react-hook-form";
import { clients } from "@data/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import React, { forwardRef } from "react";
import { useDatabase } from "@hooks/useDatabaseConnection";
import { createAlert } from "@lib/alert";

interface ClientFormProps {
    visible: boolean;
    setVisible: (isVisible: boolean) => void;
    client?: typeof clients.$inferInsert;
    update: boolean;
}

const ClientForm = forwardRef(({ visible, setVisible, client: existingClient, update }: ClientFormProps, ref) => {
    const { control, handleSubmit, formState: { errors } } = useForm<typeof clients.$inferInsert>();
    const db = useDatabase();
    const queryClient = useQueryClient()
    const onSubmit = handleSubmit(async data => {
        // await db.insert(clients).values({
        //     name: data.name,
        // }).execute()
        // console.log("client-form-submit", data);
        const succ = await clientMutation.mutateAsync({
            ...data
        });
        if (!succ) {
            createAlert({
                title: "Error",
                message: "Failed to save client"
            })
            return;
        }
        setVisible(false);
    });
    const clientMutation = useMutation({
        mutationKey: ['clients'],
        mutationFn: async (data: typeof clients.$inferInsert) => {
            if (update && existingClient) {
                const up = await db.update(clients).set({
                    id: existingClient.id,
                    name: data.name,
                })
                queryClient.refetchQueries({ queryKey: ['clients'] })
                return up;
            }
            const ins = await db.insert(clients).values({
                name: data.name,
            })
            queryClient.refetchQueries({ queryKey: ['clients'] })
            return ins;
        }
    })
    console.log("client", existingClient)
    console.log("mutation-error", clientMutation.error)
    return (
        <Portal>
            <Dialog visible={visible}
                onDismiss={() => setVisible(false)}>
                <Dialog.Title>Add New Client</Dialog.Title>
                <Dialog.Content>
                    <Text>
                        {errors.name && "Client name is required"}
                    </Text>
                    <Controller
                        control={control}
                        name="name"
                        rules={{ required: true }}
                        render={({ field: { onChange, onBlur, value } }) => {
                            return (
                                <TextInput
                                    label="Client Name"
                                    onBlur={onBlur}
                                    onChangeText={onChange}
                                    value={value}
                                    inputMode="text"
                                    // mode="outlined"
                                    defaultValue={existingClient?.name}
                                />
                            );
                        }}
                    />
                </Dialog.Content>
                <Dialog.Actions>
                    <Button onPress={onSubmit}>Add</Button>
                    <Button onPress={() => setVisible(false)}>
                        Cancel
                    </Button>
                </Dialog.Actions>
            </Dialog>
        </Portal>
    );
});

export default React.memo(ClientForm);