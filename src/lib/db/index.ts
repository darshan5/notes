import { drizzle, DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "./schema";

export type Database = DrizzleD1Database<typeof schema>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getDb(d1: any): Database {
  return drizzle(d1, { schema });
}

export { schema };
