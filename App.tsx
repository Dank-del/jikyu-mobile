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
import BottomNav from './screens/BottomNav';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import usePaperTheme from './hooks/usePaperTheme';

const { LightTheme, DarkTheme } = adaptNavigationTheme({
  reactNavigationLight: NavigationDefaultTheme,
  reactNavigationDark: NavigationDarkTheme,
});
let CombinedDefaultTheme = merge(MD3LightTheme, LightTheme);
let CombinedDarkTheme = merge(MD3DarkTheme, DarkTheme);

const Stack = createNativeStackNavigator();

export default function App() {
  const { paperTheme, colorScheme } = usePaperTheme()
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider theme={paperTheme}>
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
      </PaperProvider>
    </GestureHandlerRootView>
  );
}