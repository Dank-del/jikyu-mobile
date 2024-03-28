import {
    DarkTheme as NavigationDarkTheme,
    DefaultTheme as NavigationDefaultTheme,
} from '@react-navigation/native';
import merge from 'deepmerge';
import { DefaultTheme, MD3DarkTheme, MD3LightTheme, adaptNavigationTheme } from 'react-native-paper';
const { LightTheme, DarkTheme } = adaptNavigationTheme({
    reactNavigationLight: NavigationDefaultTheme,
    reactNavigationDark: NavigationDarkTheme,
});
export let CombinedDefaultTheme = merge(MD3LightTheme, LightTheme);
export let CombinedDarkTheme = merge(MD3DarkTheme, DarkTheme);
export {DefaultTheme, DarkTheme}