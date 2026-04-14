import { Dialog, Button, TextInput, Text, Switch } from "react-native-paper";
import { useForm, Controller } from "react-hook-form";
import { clients, rates } from "@data/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import { useDatabase } from "@hooks/useDatabaseConnection";
import { createAlert } from "@lib/alert";
import { View, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useClients, useRates } from "@data/queries";
import { eq } from "drizzle-orm";
import { useSnackbar } from "@components/SnackbarProvider";
import { useSettings } from "@lib/settings";

const ClientForm = () => {
    const { id } = useLocalSearchParams();
    const { settings } = useSettings();
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

    const [monetized, setMonetized] = React.useState(rate !== undefined);
    const { showSnackbar } = useSnackbar();
    const db = useDatabase();
    const queryClient = useQueryClient()

    const saveRate = async (clientId: number) => {
        if (monetized && rate !== undefined) {
            const existingRate = rateQuery.data?.find(r => r.clientId === clientId);
            if (existingRate) {
                await db.update(rates).set({ ratePerHour: rate }).where(eq(rates.id, existingRate.id)).execute();
            } else {
                await db.insert(rates).values({ ratePerHour: rate, clientId }).execute();
            }
        } else if (!monetized) {
            const existingRate = rateQuery.data?.find(r => r.clientId === clientId);
            if (existingRate) {
                await db.delete(rates).where(eq(rates.id, existingRate.id)).execute();
            }
        }
        queryClient.refetchQueries({ queryKey: ['rate'] });
    };

    const clientMutation = useMutation({
        mutationKey: ['clients'],
        mutationFn: async (data: typeof clients.$inferInsert) => {
            if (update && existingClient) {
                const up = await db.update(clients).set({
                    id: existingClient.id,
                    name: data.name,
                });
                await saveRate(existingClient.id);
                queryClient.refetchQueries({ queryKey: ['clients'] });
                return up;
            }
            const ins = await db.insert(clients).values({
                name: data.name,
            });
            const newClientId = (ins as any).lastInsertRowId ?? (ins as any).lastInsertRowid;
            if (newClientId) {
                await saveRate(newClientId);
            }
            queryClient.refetchQueries({ queryKey: ['clients'] });
            reset();
            setRate(undefined);
            return ins;
        }
    });

    const onSubmit = handleSubmit(async data => {
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
        showSnackbar(update ? 'Client updated' : 'Client created');
        router.back();
    });
    return (
        <Dialog visible onDismiss={() => router.back()}>
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
                                mode="outlined"
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
                    <View style={styles.rateContainer}>
                        <TextInput
                            label={`Rate per Hour (${settings.currency})`}
                            keyboardType="numeric"
                            value={rate ? rate.toString() : ''}
                            onChangeText={handleRateChange}
                            mode="outlined"
                            style={styles.input}
                        />
                    </View>
                }
            </Dialog.Content>
            <Dialog.Actions>
                <Button onPress={() => router.back()}>Cancel</Button>
                <Button onPress={onSubmit}>{update ? "Save" : "Add"}</Button>
            </Dialog.Actions>
        </Dialog>
    );
};

const styles = StyleSheet.create({
    rateContainer: {
        marginTop: 8,
    },
    input: {
        width: '100%',
    },
});

export default React.memo(ClientForm);