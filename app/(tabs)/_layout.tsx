import { Tabs } from "expo-router";
import { Appbar, BottomNavigation, Icon } from "react-native-paper";
import { CommonActions } from '@react-navigation/native';
import { useColorScheme } from "react-native";
import { CombinedDarkTheme, CombinedDefaultTheme } from "@lib/theme";

export default function TabLayout() {
    const colorScheme = useColorScheme();
    return (
        <Tabs screenOptions={{
            header: (props) => (
                <Appbar.Header>
                    <Appbar.Content title={props.options.title} />
                </Appbar.Header>
            )
            
        }} tabBar={({ navigation, state, descriptors, insets }) => (
            <BottomNavigation.Bar
                theme={colorScheme ? CombinedDarkTheme : CombinedDefaultTheme}
                navigationState={state}
                safeAreaInsets={insets}
                onTabPress={({ route, preventDefault }) => {
                    const event = navigation.emit({
                        type: 'tabPress',
                        target: route.key,
                        canPreventDefault: true,
                    });

                    if (event.defaultPrevented) {
                        preventDefault();
                    } else {
                        navigation.dispatch({
                            ...CommonActions.navigate(route.name, route.params),
                            target: state.key,
                        });
                    }
                }}
                renderIcon={({ route, focused, color }) => {
                    const { options } = descriptors[route.key];
                    if (options.tabBarIcon) {
                        return options.tabBarIcon({ focused, color, size: 24 });
                    }

                    return null;
                }}
                getLabelText={({ route }) => {
                    const { options } = descriptors[route.key];
                    const label =
                        options.tabBarLabel !== undefined
                            ? options.tabBarLabel
                            : options.title !== undefined
                                ? options.title
                                // @ts-ignore
                                : route.title;

                    return label;
                }}
            />
        )}>
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Dashboard',
                    tabBarIcon: ({ color }) => <Icon size={28} source='view-dashboard-outline' color={color} />,
                }}
            />
            <Tabs.Screen
                name="projects"
                options={{
                    title: 'Projects',
                    
                    tabBarIcon: ({ color }) => <Icon size={28} source='briefcase-outline' color={color} />,
                    header: (props) => (
                        <Appbar.Header>
                            <Appbar.Content title="Projects" />
                            {/* <Appbar.Action icon="plus" onPress={() => setProjectFormVisible({
                                visible: true,
                                edit: false,
                                project: undefined,
                            })} /> */}
                        </Appbar.Header>
                    )
                }}
            />
        </Tabs>
    )
}