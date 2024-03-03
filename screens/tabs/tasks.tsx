import { StyleSheet } from 'react-native';
import { Appbar, Button, Dialog, Modal, Portal, Text } from 'react-native-paper';
import { faker } from "@faker-js/faker";
import { ScrollView } from 'react-native-gesture-handler';
import { DataTable } from 'react-native-paper';
import { useEffect, useState } from 'react';
import usePaperTheme from '@hooks/usePaperTheme';
import React from 'react';

const Tasks = () => {
    const [page, setPage] = useState<number>(0);
    const { paperTheme, colorScheme } = usePaperTheme()
    const [numberOfItemsPerPageList] = useState([8, 10, 20, 30, 40, 50, 100]);
    const [itemsPerPage, onItemsPerPageChange] = useState(
        numberOfItemsPerPageList[0]
    );

    const [items, setItems] = useState(Array.from({ length: 100 }).map((_, index) => {
        return {
            id: index,
            name: faker.lorem.words(),
            project: faker.company.name(),
            timeMins: Math.floor(Math.random() * 100),
            monetized: Math.random() > 0.5,
            rateHourly: Math.floor(Math.random() * 100),
            currency: 'USD'
        }
    }));

    const [selectedTask, setSelectedTask] = useState<any>(null);
    const [modalVisible, setModalVisible] = useState(false);

    const handleRowPress = (task: any) => {
        setSelectedTask(task);
        setModalVisible(true);
    };

    const from = page * itemsPerPage;
    const to = Math.min((page + 1) * itemsPerPage, items.length);

    useEffect(() => {
        setPage(0);
    }, [itemsPerPage]);

    const fakeData = []
    for (let i = 0; i < 100; i++) {
        fakeData.push({
            title: faker.lorem.words(),
            subtitle: faker.lorem.sentence()
        })
    }
    console.log(items);
    return (
        <>
            <Appbar.Header>
                <Appbar.Content title="Tasks" />
            </Appbar.Header>
            <ScrollView>
                <DataTable>
                    <DataTable.Header>
                        <DataTable.Title>Task</DataTable.Title>
                        <DataTable.Title numeric>Project</DataTable.Title>
                        <DataTable.Title numeric>Time</DataTable.Title>
                    </DataTable.Header>

                    {items.slice(from, to).map((item) => (
                        <DataTable.Row key={item.id} onPress={() => handleRowPress(item)}>
                            <DataTable.Cell>{item.name}</DataTable.Cell>
                            <DataTable.Cell numeric>{item.project}</DataTable.Cell>
                            <DataTable.Cell numeric>{item.timeMins} mins</DataTable.Cell>
                        </DataTable.Row>
                    ))}

                    <DataTable.Pagination
                        page={page}
                        numberOfPages={Math.ceil(items.length / itemsPerPage)}
                        onPageChange={(page) => setPage(page)}
                        label={`${from + 1}-${to} of ${items.length}`}
                        numberOfItemsPerPageList={numberOfItemsPerPageList}
                        numberOfItemsPerPage={itemsPerPage}
                        onItemsPerPageChange={onItemsPerPageChange}
                        showFastPaginationControls
                        selectPageDropdownLabel={'Rows per page'}
                    />
                </DataTable>
            </ScrollView>
            <Portal>
                {selectedTask && (
                    <Dialog visible={modalVisible} onDismiss={() => setModalVisible(false)}>
                    <Dialog.Icon icon="chart-box-outline" />
                    <Dialog.Title>{selectedTask ? `${selectedTask.name}` : ''}</Dialog.Title>
                    <Dialog.Content>
                        <Text variant="bodyMedium">{selectedTask ? `Project: ${selectedTask.project}` : ''}</Text>
                        <Text>{selectedTask ? `Time: ${selectedTask.timeMins} mins` : ''}</Text>
                        <Text>{selectedTask ? `Monetized: ${selectedTask.monetized}` : ''}</Text>
                        <Text>{selectedTask ? `Rate: ${selectedTask.rateHourly} ${selectedTask.currency}` : ''} an hour</Text>
                        <Text>Earned {(selectedTask.timeMins / 60 * selectedTask.rateHourly).toFixed(2)} {selectedTask.currency}</Text>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button icon='delete' mode="contained" onPress={() => {
                            setItems(items.filter((item) => item.id !== selectedTask.id));
                            setModalVisible(false);
                        }} buttonColor='red'>delete</Button>
                        <Button icon='hand-okay' mode="contained" onPress={() => setModalVisible(false)}>Okay</Button>
                    </Dialog.Actions>
                </Dialog>
                )}
            </Portal >
        </>
    );
}

const styles = StyleSheet.create({
    modal: { backgroundColor: 'white', padding: 20 }
});

export default React.memo(React.forwardRef(Tasks));