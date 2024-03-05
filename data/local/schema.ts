import { text, integer, real, sqliteTable, } from "drizzle-orm/sqlite-core";
import { relations, sql } from "drizzle-orm";

const clients = sqliteTable('client', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
});

const projects = sqliteTable('project', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    description: text('description').notNull(),
    clientId: integer('client_id').notNull(),
    deadline: text("timestamp").default(sql`CURRENT_TIMESTAMP`),
});

const tasks = sqliteTable('task', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    description: text('description').notNull(),
    projectId: integer('project_id').notNull(),
});

const rates = sqliteTable('rate', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    ratePerHour: real('rate_per_hour').notNull(),
    clientId: integer('client_id').notNull(),
});

const timeTrackings = sqliteTable('time_tracking', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    startTime: text('start_time').notNull(),
    endTime: text('end_time'),
    // hoursSpent: real('hours_spent').notNull(),
    taskId: integer('task_id').notNull(),
});

// const timeSpentAnalytics = sqliteTable('time_spent_analytics', {
//     id: integer('id').primaryKey({ autoIncrement: true }),
//     date: text('date').notNull(),
//     hoursSpent: real('hours_spent').notNull(),
//     projectId: integer('project_id').notNull(),
// });

export { clients, projects, tasks, rates, timeTrackings };