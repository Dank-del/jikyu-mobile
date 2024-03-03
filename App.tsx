import 'reflect-metadata';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  adaptNavigationTheme, Provider as PaperProvider, MD3DarkTheme,
  MD3LightTheme,
  // Appbar
} from 'react-native-paper';
import {
  NavigationContainer, DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import merge from 'deepmerge';
import BottomNav from '@screens/BottomNav';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import usePaperTheme from '@hooks/usePaperTheme';
import { enGB, registerTranslation } from 'react-native-paper-dates'
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  en,
  registerTranslation as registerTranslation2,
  registerDefaultLocale
} from 'react-native-use-form'
import { DatabaseProvider } from '@hooks/useDatabaseConnection';
registerTranslation2('en', en)
// you can override the locale per form
registerDefaultLocale('en') // optional (default = en)
// registerTranslation('nl', nl)
registerTranslation('en-GB', enGB)
const { LightTheme, DarkTheme } = adaptNavigationTheme({
  reactNavigationLight: NavigationDefaultTheme,
  reactNavigationDark: NavigationDarkTheme,
});
let CombinedDefaultTheme = merge(MD3LightTheme, LightTheme);
let CombinedDarkTheme = merge(MD3DarkTheme, DarkTheme);

const Stack = createNativeStackNavigator();
const client = new QueryClient();


export default function App() {
  const { paperTheme, colorScheme } = usePaperTheme()
  return (
    <DatabaseProvider>
      <QueryClientProvider client={client}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <PaperProvider theme={paperTheme}>
            <SafeAreaProvider>
              <NavigationContainer theme={colorScheme ? CombinedDarkTheme : CombinedDefaultTheme}>
                {/* <Appbar.Header dark elevated>
          <Appbar.Content title="Jisan" />
        </Appbar.Header> */}
                <Stack.Navigator initialRouteName="Login">
                  <Stack.Screen options={{
                    headerShown: false
                  }} name="BottomNav" component={BottomNav} />
                </Stack.Navigator>
              </NavigationContainer>
            </SafeAreaProvider>
            <StatusBar style="auto" />
          </PaperProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </DatabaseProvider>
  );
}