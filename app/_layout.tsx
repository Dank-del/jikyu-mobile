import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider as PaperProvider } from 'react-native-paper';
import { enGB, registerTranslation } from 'react-native-paper-dates'
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DatabaseProvider } from '@hooks/useDatabaseConnection';
import { useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { CombinedDarkTheme, CombinedDefaultTheme, DarkTheme } from '@lib/theme';
import { SnackbarProvider } from '@components/SnackbarProvider';
import { SettingsProvider, useSettings } from '@lib/settings';

export {
    ErrorBoundary,
} from 'expo-router';

registerTranslation('en-GB', enGB)

export const unstable_settings = {
    initialRouteName: '(tabs)',
};

export default function RootLayout() {
    return (
        <SettingsProvider>
            <RootLayoutNav />
        </SettingsProvider>
    );
}

const client = new QueryClient();

function RootLayoutNav() {
    const systemScheme = useColorScheme();
    const { settings, isLoaded } = useSettings();

    if (!isLoaded) return null;

    const isDark = settings.themeMode === 'system'
        ? systemScheme === 'dark'
        : settings.themeMode === 'dark';

    return (
        <DatabaseProvider>
            <QueryClientProvider client={client}>
                <GestureHandlerRootView style={{ flex: 1 }}>
                    <PaperProvider theme={isDark ? CombinedDarkTheme : CombinedDefaultTheme}>
                        <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
                            <SnackbarProvider>
                                <Stack>
                                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                                    <Stack.Screen name='modals/forms/client/[id]' options={{
                                        presentation: 'transparentModal',
                                        headerShown: false
                                    }} />
                                    <Stack.Screen name='modals/forms/project/[id]' options={{
                                        presentation: 'transparentModal',
                                        headerShown: false
                                    }} />
                                    <Stack.Screen name='modals/forms/task/[id]' options={{
                                        presentation: 'transparentModal',
                                        headerShown: false
                                    }} />
                                    <Stack.Screen name='modals/dialog/clientlist' options={{
                                        presentation: 'transparentModal',
                                        headerShown: false
                                    }} />
                                    <Stack.Screen name='project/[id]' options={{
                                        headerShown: false
                                    }} />
                                    <Stack.Screen name='settings' options={{
                                        headerShown: false
                                    }} />
                                    <Stack.Screen name='timer' options={{
                                        headerShown: false
                                    }} />
                                </Stack>
                            </SnackbarProvider>
                        </ThemeProvider>
                        <StatusBar style={isDark ? 'light' : 'dark'} />
                    </PaperProvider>
                </GestureHandlerRootView>
            </QueryClientProvider>
        </DatabaseProvider>
    );
}
