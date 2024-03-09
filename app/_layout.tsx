import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
    Provider as PaperProvider
    // Appbar
} from 'react-native-paper';
import { enGB, registerTranslation } from 'react-native-paper-dates'

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DatabaseProvider } from '@hooks/useDatabaseConnection';

import { useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { CombinedDarkTheme, CombinedDefaultTheme, DarkTheme } from '@lib/theme';

export {
    // Catch any errors thrown by the Layout component.
    ErrorBoundary,
} from 'expo-router';

registerTranslation('en-GB', enGB)

export const unstable_settings = {
    // Ensure that reloading on `/modal` keeps a back button present.
    initialRouteName: '(tabs)',
};


export default function RootLayout() {
    //   const [loaded, error] = useFonts({
    //     SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    //     ...FontAwesome.font,
    //   });

    //   // Expo Router uses Error Boundaries to catch errors in the navigation tree.
    //   useEffect(() => {
    //     if (error) throw error;
    //   }, [error]);

    //   useEffect(() => {
    //     if (loaded) {
    //       SplashScreen.hideAsync();
    //     }
    //   }, [loaded]);

    //   if (!loaded) {
    //     return null;
    //   }

    return <RootLayoutNav />;
}

const client = new QueryClient();
function RootLayoutNav() {
    const colorScheme = useColorScheme();
    console.log(colorScheme)
    return (
        <DatabaseProvider>
            <QueryClientProvider client={client}>
                <GestureHandlerRootView style={{ flex: 1 }}>
                    <PaperProvider theme={colorScheme ? CombinedDarkTheme : CombinedDefaultTheme}>
                        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                            <Stack screenOptions={{
                                
                            }}>
                                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                            </Stack>
                        </ThemeProvider>
                        <StatusBar style={colorScheme === 'dark' ? 'dark' : 'light'} />
                    </PaperProvider>
                </GestureHandlerRootView>
            </QueryClientProvider>
        </DatabaseProvider>

    );
}
