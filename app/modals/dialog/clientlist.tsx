import { clients } from "@data/schema";
import { useDatabase } from "@hooks/useDatabaseConnection";
import React from "react";
import { View, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { Dialog, Button, Text, useTheme } from "react-native-paper";
import { createAlert } from "@lib/alert";
import { DatabaseMethods } from "@data/methods";
import { router } from "expo-router";
import { useClients } from "@data/queries";

const ClientDialog = () => {
    const db = useDatabase();
    const theme = useTheme();
    const dbMethods = new DatabaseMethods(db);
    const clientsQuery = useClients();

    const handleClientDelete = async (clientId: typeof clients.$inferInsert['id']) => {
        if (!clientId) {
            createAlert({
                title: "Error",
                message: "Id is undefined"
            });
            return;
        }
        createAlert({
            title: "Delete Client",
            message: "Are you sure you want to delete this client? All associated projects and tasks will also be deleted. This action CANNOT be undone.",
            buttons: [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        const deleted = await dbMethods.deleteClient(clientId);
                        if (deleted) {
                            clientsQuery.refetch();
                            return;
                        }
                        createAlert({
                            title: "Error",
                            message: "Failed to delete client"
                        });
                    }
                }
            ]
        });
    };

    const renderItem = ({ item }: { item: typeof clients.$inferInsert }) => {
        return (
            <View style={[styles.itemContainer, { borderBottomColor: theme.colors.outlineVariant }]}>
                <TouchableOpacity
                    style={{ flex: 1 }}
                    onPress={() => router.push({
                        pathname: '/modals/forms/client/[id]',
                        params: { id: item.id }
                    })}
                >
                    <Text variant="bodyLarge" style={{ paddingVertical: 12 }}>{item.name}</Text>
                </TouchableOpacity>
                <View style={styles.buttonRow}>
                    <Button
                        compact
                        icon="pencil"
                        onPress={() => router.push({
                            pathname: '/modals/forms/client/[id]',
                            params: { id: item.id }
                        })}
                    >
                        Edit
                    </Button>
                    <Button
                        compact
                        textColor={theme.colors.error}
                        icon="delete"
                        onPress={() => handleClientDelete(item.id)}
                    >
                        Delete
                    </Button>
                </View>
            </View>
        );
    };

    return (
        <Dialog visible onDismiss={() => router.back()}>
            <Dialog.Title>Clients</Dialog.Title>
            <Dialog.Content>
                {clientsQuery.isFetched && (clientsQuery.data?.length ?? 0) === 0 && (
                    <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', paddingVertical: 16 }}>
                        No clients yet. Add your first client to get started.
                    </Text>
                )}
                {clientsQuery.isFetched && (clientsQuery.data?.length ?? 0) > 0 && (
                    <FlatList
                        data={clientsQuery.data}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.id!.toString()}
                    />
                )}
            </Dialog.Content>
            <Dialog.Actions>
                <Button icon="account-plus" onPress={() => {
                    router.push({
                        pathname: '/modals/forms/client/[id]',
                        params: { id: 'new' }
                    });
                }}>Add Client</Button>
                <Button onPress={() => router.back()}>Close</Button>
            </Dialog.Actions>
        </Dialog>
    );
};

const styles = StyleSheet.create({
    itemContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        paddingHorizontal: 4,
    },
    buttonRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
});

export default React.memo(ClientDialog);
