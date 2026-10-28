import { integer, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";
import { recipesTable } from "./recipes";

export const favoritesTable = pgTable(
  "favorites",
  {
    userId: text("user_id").notNull(),
    recipeId: integer("recipe_id")
      .notNull()
      .references(() => recipesTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.recipeId] })],
);
