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

export {
    ErrorBoundary,
} from 'expo-router';

registerTranslation('en-GB', enGB)

export const unstable_settings = {
    initialRouteName: '(tabs)',
};

export default function RootLayout() {
    return <RootLayoutNav />;
}

const client = new QueryClient();

function RootLayoutNav() {
    const colorScheme = useColorScheme();
    return (
        <DatabaseProvider>
            <QueryClientProvider client={client}>
                <GestureHandlerRootView style={{ flex: 1 }}>
                    <PaperProvider theme={colorScheme === 'dark' ? CombinedDarkTheme : CombinedDefaultTheme}>
                        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
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
                                </Stack>
                            </SnackbarProvider>
                        </ThemeProvider>
                        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
                    </PaperProvider>
                </GestureHandlerRootView>
            </QueryClientProvider>
        </DatabaseProvider>
    );
}
