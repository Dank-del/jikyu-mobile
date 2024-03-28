import { clients } from "@data/schema";
import { useDatabase } from "@hooks/useDatabaseConnection";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { Dialog, Button, useTheme } from "react-native-paper";
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
                title: "Error in deletion",
                message: "Id is undefined"
            })
        }
        console.log("Client ID", clientId);
        createAlert({
            title: "Delete Client",
            message: "Are you sure you want to delete this client? This action CANNOT be undone.",
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
        })
    }

    // const [visible, setVisible] = useState(false);

    const renderItem = ({ item }: { item: typeof clients.$inferInsert }) => {
        return (
            <View style={styles.itemContainer}>
                <TouchableOpacity onPress={() => router.push({
                    pathname: '/modals/forms/client/[id]',
                    params: {
                        id: item.id,
                    }
                })}>
                    <View style={styles.item}>
                        <Text style={[styles.clientName, { color: theme.colors.onSurface }]}>{item.name}</Text>
                    </View>
                </TouchableOpacity>
                <View style={styles.buttonContainer}>
                    <Button style={styles.buttonContainer} icon='account-edit' onPress={() => router.push({
                        pathname: '/modals/forms/client/[id]',
                        params: {
                            id: item.id,
                        }
                    })}>
                        Edit
                    </Button>
                    <Button style={styles.buttonContainer} textColor="red" icon="delete" onPress={() => handleClientDelete(item.id)}>
                        Delete
                    </Button>
                </View>
            </View>
        );
    };

    return (
        <Dialog visible>
            <Dialog.Title>Clients</Dialog.Title>
            <Dialog.Content>
                {clientsQuery.isFetched && (
                    <FlatList
                        data={clientsQuery.data}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.id.toString()}
                    />
                )}
            </Dialog.Content>
            <Dialog.Actions>
                <Button onPress={() => {
                    router.push({
                        pathname: '/modals/forms/client/[id]',
                        params: {
                            id: 'new',
                        }
                    })
                    // setVisible(false);
                }}>Add New Client</Button>
                <Button onPress={() => router.push('../')}>Close</Button>
            </Dialog.Actions>
        </Dialog>
    );
};

const styles = StyleSheet.create({
    itemContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    item: {
        flex: 1,
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    clientName: {
        fontSize: 16,
    },
    buttonContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
});

export default React.memo(ClientDialog);
