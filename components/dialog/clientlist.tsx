import { clients, projects, tasks } from "@data/schema";
import { useDatabase } from "@hooks/useDatabaseConnection";
import { ClientFormStateProps } from "@lib/stateprops";
import { useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { Dialog, Portal, Button } from "react-native-paper";
import ClientForm from "@components/forms/client";
import { createAlert } from "@lib/alert";
import { eq } from "drizzle-orm";
import { DatabaseMethods } from "@data/methods";

interface ClientDialogProps {
    visible: boolean;
    setVisible: (isVisible: boolean) => void;
}

const ClientDialog = ({ visible, setVisible }: ClientDialogProps) => {
    const db = useDatabase();
    const dbMethods = new DatabaseMethods(db);
    const clientsQuery = useQuery({
        queryKey: ['clients'],
        queryFn: async () => {
            return await db.select().from(clients);
        },

    })
    const [clientFormVisible, setClientFormVisible] = useState<ClientFormStateProps>({
        edit: false,
        visible: false,
    });

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
                <TouchableOpacity onPress={() => setClientFormVisible({
                    client: item,
                    edit: true,
                    visible: true
                })}>
                    <View style={styles.item}>
                        <Text style={styles.clientName}>{item.name}</Text>
                    </View>
                </TouchableOpacity>
                <View style={styles.buttonContainer}>
                    {/* <Button title="Edit" onPress={() => handleEditClient(item.id)} />
                    <Button title="Delete" onPress={() => handleDeleteClient(item.id)} /> */}
                    <Button style={styles.buttonContainer} icon='account-edit' onPress={() => setClientFormVisible({
                        visible: true,
                        edit: true,
                        client: item,
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
        <Portal>
            <Dialog visible={visible} onDismiss={() => setVisible(false)}>
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
                        setClientFormVisible({
                            edit: false,
                            visible: true,
                            client: undefined,
                        });
                        // setVisible(false);
                    }}>Add New Client</Button>
                    <Button onPress={() => setVisible(false)}>Close</Button>
                </Dialog.Actions>
            </Dialog>
            <ClientForm update={clientFormVisible.edit} client={clientFormVisible.client} visible={clientFormVisible.visible} setVisible={() => setClientFormVisible({
                ...clientFormVisible,
                visible: false,
            })} />
        </Portal>
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
