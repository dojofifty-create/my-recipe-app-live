import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const appSeedsTable = pgTable("app_seeds", {
  key: text("key").primaryKey(),
  seededAt: timestamp("seeded_at", { withTimezone: true }).notNull().defaultNow(),
});
