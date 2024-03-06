import type { Config } from 'drizzle-kit';
export default {
    schema: './data/local/schema.ts',
    out: './drizzle',
    driver: 'expo', // <--- very important
    strict: true,
    verbose: true,
} satisfies Config;