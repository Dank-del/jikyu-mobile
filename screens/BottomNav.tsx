import * as React from 'react';
import { BottomNavigation, Text } from 'react-native-paper';
import Tasks from '@screens/tabs/tasks';
import Dashboard from '@screens/tabs/dashboard';
import ProjectsPage from './tabs/projects';

const DashboardRoute = () => <Text>Dashboard</Text>
const ProjectsRoute = () => <Text>Projects</Text>
const InvoicesRoute = () => <Text>Invoices</Text>

const BottomNav = () => {
    const [index, setIndex] = React.useState(0);
    const [routes] = React.useState([
        { key: 'dashboard', title: 'Dashboard', focusedIcon: 'view-dashboard', unfocusedIcon: 'view-dashboard-outline' },
        { key: 'projects', title: 'Projects', focusedIcon: 'briefcase', unfocusedIcon: 'briefcase-outline' },
        { key: 'tasks', title: 'Tasks', focusedIcon: 'clipboard-list', unfocusedIcon: 'clipboard-list-outline' },
        { key: 'invoices', title: 'Invoices', focusedIcon: 'file-document', unfocusedIcon: 'file-document-outline' },
    ]);

    const renderScene = BottomNavigation.SceneMap({
        dashboard: Dashboard,
        projects: ProjectsPage,
        tasks: Tasks,
        invoices: InvoicesRoute,
    });

    return (
        <BottomNavigation
            navigationState={{ index, routes }}
            onIndexChange={setIndex}
            renderScene={renderScene}
        />
    );
};

export default BottomNav;