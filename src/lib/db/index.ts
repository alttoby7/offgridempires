import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;
let _pool: Pool | null = null;

export function getDb() {
  if (_db) return _db;

  const databaseUrl = process.env.OFFGRID_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("OFFGRID_DATABASE_URL or DATABASE_URL must be set");
  }

  _pool = new Pool({
    connectionString: databaseUrl,
    max: 5,
    ssl: false,
  });

  _db = drizzle(_pool, { schema });
  return _db;
}

// Convenience re-export — scripts should call getDb() directly
export const db = new Proxy(
  {} as ReturnType<typeof drizzle<typeof schema>>,
  {
    get(_target, prop, receiver) {
      const instance = getDb();
      const value = Reflect.get(instance, prop, receiver);
      return typeof value === "function" ? value.bind(instance) : value;
    },
  }
);

export type Database = ReturnType<typeof getDb>;
