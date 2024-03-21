import { clients, projects, rates, tasks, timeTrackings } from "@data/schema";
import { useDatabase } from "@hooks/useDatabaseConnection";
import { useQuery } from "@tanstack/react-query";

export const useProjects = () => {
    const db = useDatabase();
    return useQuery({
        queryKey: ['projects'],
        queryFn: async () => {
            return await db.select().from(projects);
        },
        refetchOnWindowFocus: "always",
    });
}

export const useClients = () => {
    const db = useDatabase();
    return useQuery({
        queryKey: ['clients'],
        queryFn: async () => {
            return await db.select().from(clients);
        },
        refetchOnWindowFocus: "always",
    });
}

export const useTasks = () => {
    const db = useDatabase();
    return useQuery({
        queryKey: ['tasks'],
        queryFn: async () => {
            return await db.select().from(tasks);
        },
        refetchOnWindowFocus: "always",
    });
}

export const useTimeTrackings = () => {
    const db = useDatabase();
    return useQuery({
        queryKey: ['timeTrackings'],
        queryFn: async () => {
            return await db.select().from(timeTrackings);
        },
        refetchOnWindowFocus: "always",
        refetchInterval: 1000,
    });
}

export const useRates = () => {
    const db = useDatabase();
    return useQuery({
        queryKey: ['rate'],
        queryFn: async () => {
            return await db.select().from(rates);
        },
        refetchOnWindowFocus: "always",
    });
}
