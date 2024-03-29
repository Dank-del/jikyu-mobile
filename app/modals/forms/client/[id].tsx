import { Dialog, Button, TextInput, Text, Switch } from "react-native-paper";
import { useForm, Controller } from "react-hook-form";
import { clients } from "@data/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import { useDatabase } from "@hooks/useDatabaseConnection";
import { createAlert } from "@lib/alert";
import { View, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useClients, useRates } from "@data/queries";

const ClientForm = () => {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    let update = !(id === 'new');
    const { control, handleSubmit, formState: { errors }, reset } = useForm<typeof clients.$inferInsert>();
    const rateQuery = useRates();
    const clientsQuery = useClients();
    const existingClient = clientsQuery.data?.filter(c => c.id === parseInt(id!.toString()))[0];
    const [rate, setRate] = useState<number | undefined>(rateQuery.data?.find((r) => r.clientId === existingClient?.id)?.ratePerHour);

    const handleRateChange = (text: string) => {
        const parsedRate = parseFloat(text);
        if (!isNaN(parsedRate)) {
            setRate(parsedRate);
        } else {
            setRate(undefined);
        }
    };

    const handleRateSubmit = () => {
        if (rate !== undefined) {
            // Perform your action with the rate here
            console.log('Rate per hour:', rate);
        } else {
            console.log('Please enter a valid rate');
        }
    };
    const [monetized, setMonetized] = React.useState(rate !== undefined);
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
        router.push("../")
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
            reset();
            setRate(undefined);
            return ins;
        }
    })
    console.log("client", existingClient)
    console.log("mutation-error", clientMutation.error)
    return (
        <Dialog visible>
            <Dialog.Title>{update ? "Edit Client" : "Add new Client"}</Dialog.Title>
            <Dialog.Content>
                <Text>
                    {errors.name && "Client name is required"}
                    {errors.root && "Root error: " + errors.root.message}
                    {clientMutation.error && "Error: " + clientMutation.error.message}
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
                <View style={{
                    display: 'flex',
                    flexDirection: 'row',
                    rowGap: 10,
                    alignItems: 'center',
                    margin: 8,
                    justifyContent: 'space-between'
                }}>
                    <Text style={{
                        fontSize: 16
                    }}>Monetized? </Text>
                    <Switch
                        value={monetized}
                        onValueChange={() => setMonetized(!monetized)}
                    />
                </View>
                {
                    monetized &&
                    <View style={styles.container}>
                        <TextInput
                            label="Rate per Hour (USD)"
                            keyboardType="numeric"
                            value={rate ? rate.toString() : ''}
                            onChangeText={handleRateChange}
                            style={styles.input}
                        />
                        <Button mode="contained" onPress={handleRateSubmit} style={styles.button}>
                            Save
                        </Button>
                    </View>
                }
            </Dialog.Content>
            <Dialog.Actions>
                <Button onPress={onSubmit}>Add</Button>
                <Button onPress={() => {
                    router.push("../")
                }}>
                    Cancel
                </Button>
            </Dialog.Actions>
        </Dialog>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    input: {
        width: '80%',
        marginBottom: 20,
    },
    button: {
        width: '50%',
    },
});

export default React.memo(ClientForm);