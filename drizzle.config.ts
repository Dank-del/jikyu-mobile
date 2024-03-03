import type { Config } from 'drizzle-kit';
export default {
    schema: './data/local/schema.ts',
    out: './drizzle',
    driver: 'expo', // <--- very important
} satisfies Config;