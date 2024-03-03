import { createContext, forwardRef, useContext } from "react";
import { ExpoSQLiteDatabase, drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite/next";
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import migrations from '../drizzle/migrations';
import { View, Text } from "react-native";

const DatabaseContext = createContext<ExpoSQLiteDatabase | undefined>(undefined);
const expo = openDatabaseSync("db.db");
const db = drizzle(expo);

export const DatabaseProvider = forwardRef<React.Ref<ExpoSQLiteDatabase>, { children: React.ReactNode }>(({ children }, ref) => {
    const { success, error } = useMigrations(db, migrations);

    if (error) {
        return (
            <View>
                <Text>Migration error: {error.message}</Text>
            </View>
        );
    }
    if (!success) {
        return (
            <View>
                <Text>Migration is in progress...</Text>
            </View>
        );
    }


    return (
        <DatabaseContext.Provider value={db}>
            {children}
        </DatabaseContext.Provider>
    );
});

export const useDatabase = () => {
    const database = useContext(DatabaseContext);
    if (!database) {
        throw new Error('useDatabase must be used within a DatabaseProvider');
    }
    return database;
};