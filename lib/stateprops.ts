import { projects, clients } from '@data/schema';

type ProjectFormStateProps = {
    edit: boolean;
    visible: boolean;
    projectId?: typeof projects.$inferInsert['id'];
};

type ClientFormStateProps = {
    edit: boolean;
    visible: boolean;
    clientId?: typeof clients.$inferInsert['id'];
};

export { ProjectFormStateProps, ClientFormStateProps };