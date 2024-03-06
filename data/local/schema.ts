import { sqliteTable, integer, text, real, foreignKey } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

const clients = sqliteTable("clients", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
});

const projects = sqliteTable("projects", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    description: text("description").notNull(),
    clientId: integer("client_id")
        .notNull()
        .references(() => clients.id, { onDelete: "cascade" }),
    deadline: text("timestamp").default(sql`CURRENT_TIMESTAMP`),
});

const tasks = sqliteTable("tasks", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    description: text("description").notNull(),
    projectId: integer("project_id")
        .notNull()
        .references(() => projects.id, { onDelete: "cascade" }),
});

const rates = sqliteTable("rates", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    ratePerHour: real("rate_per_hour").notNull(),
    clientId: integer("client_id")
        .notNull()
        .references(() => clients.id, { onDelete: "cascade" }),
});

const timeTrackings = sqliteTable("time_trackings", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    startTime: text('start_time').notNull(),
    endTime: text('end_time'),
    taskId: integer("task_id")
        .notNull()
        .references(() => tasks.id, { onDelete: "cascade" }),
});

export { clients, projects, tasks, rates, timeTrackings };