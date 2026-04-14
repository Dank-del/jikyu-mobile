import React, { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Appbar, Card, Divider, List, RadioButton, Searchbar, Text, useTheme } from 'react-native-paper';
import { router } from 'expo-router';
import { useSettings } from '@lib/settings';
import { ALL_CURRENCIES, getCurrencySymbol } from '@lib/currencies';

export default function SettingsScreen() {
    const theme = useTheme();
    const { settings, updateSettings } = useSettings();
    const [currencySearch, setCurrencySearch] = useState('');

    const filteredCurrencies = currencySearch
        ? ALL_CURRENCIES.filter(c =>
            c.code.toLowerCase().includes(currencySearch.toLowerCase()) ||
            c.name.toLowerCase().includes(currencySearch.toLowerCase())
        )
        : ALL_CURRENCIES;

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Appbar.Header>
                <Appbar.BackAction onPress={() => router.back()} />
                <Appbar.Content title="Settings" />
            </Appbar.Header>

            <FlatList
                data={filteredCurrencies}
                keyExtractor={(item) => item.code}
                ListHeaderComponent={
                    <View>
                        <Card style={styles.card}>
                            <Card.Content>
                                <Text variant="titleMedium" style={{ marginBottom: 12 }}>Appearance</Text>
                                <RadioButton.Group
                                    onValueChange={(value) => updateSettings({ themeMode: value as 'system' | 'light' | 'dark' })}
                                    value={settings.themeMode}
                                >
                                    <RadioButton.Item label="System" value="system" />
                                    <RadioButton.Item label="Light" value="light" />
                                    <RadioButton.Item label="Dark" value="dark" />
                                </RadioButton.Group>
                            </Card.Content>
                        </Card>

                        <Card style={styles.card}>
                            <Card.Content>
                                <Text variant="titleMedium" style={{ marginBottom: 4 }}>
                                    Currency
                                </Text>
                                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 12 }}>
                                    Currently: {getCurrencySymbol(settings.currency)} ({settings.currency})
                                </Text>
                                <Searchbar
                                    placeholder="Search currencies..."
                                    onChangeText={setCurrencySearch}
                                    value={currencySearch}
                                    style={{ marginBottom: 8 }}
                                />
                            </Card.Content>
                        </Card>
                    </View>
                }
                renderItem={({ item }) => (
                    <List.Item
                        title={`${item.code} — ${item.name}`}
                        description={getCurrencySymbol(item.code)}
                        onPress={() => updateSettings({ currency: item.code })}
                        left={(props) => (
                            <RadioButton
                                {...props}
                                value={item.code}
                                status={settings.currency === item.code ? 'checked' : 'unchecked'}
                                onPress={() => updateSettings({ currency: item.code })}
                            />
                        )}
                        style={styles.currencyItem}
                    />
                )}
                ItemSeparatorComponent={Divider}
                contentContainerStyle={{ paddingBottom: 32 }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    card: {
        margin: 12,
        marginBottom: 4,
    },
    currencyItem: {
        paddingHorizontal: 12,
    },
});
