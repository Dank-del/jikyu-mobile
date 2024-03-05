import { projects, clients, tasks } from '@data/schema';

type ProjectFormStateProps = {
    edit: boolean;
    visible: boolean;
    project?: typeof projects.$inferInsert;
};

type ClientFormStateProps = {
    edit: boolean;
    visible: boolean;
    client?: typeof clients.$inferInsert;
};

type TaskFormStateProps = {
    edit: boolean;
    visible: boolean;
    taskId?: typeof tasks.$inferInsert['id'];
}

export { ProjectFormStateProps, ClientFormStateProps, TaskFormStateProps };