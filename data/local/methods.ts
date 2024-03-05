import { clients, projects, tasks } from "@data/schema";
import { eq } from "drizzle-orm";
import { ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite";

class DatabaseMethods {
    private db: ExpoSQLiteDatabase;
    constructor(db: ExpoSQLiteDatabase) {
        this.db = db;
    }
    async deleteProjects(projectId: typeof projects.$inferInsert['id']) {
        await this.db.delete(tasks).where(eq(tasks.projectId, projectId!)).execute();
        return await this.db.delete(projects).where(eq(projects.id, projectId!)).execute();
    }

    async deleteClient(clientId: typeof projects.$inferInsert['id']) {
        const allprojects = await this.db.select().from(projects).where(eq(projects.clientId, clientId!)).execute();
        for (const project of allprojects) {
            await this.deleteProjects(project.id);
        }
        return await this.db.delete(clients).where(eq(clients.id, clientId!)).execute();
    }

    async deleteTask(taskId: typeof tasks.$inferInsert['id']) {
        return await this.db.delete(tasks).where(eq(tasks.id, taskId!)).execute();
    }
}

export { DatabaseMethods };