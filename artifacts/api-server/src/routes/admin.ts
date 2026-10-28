import { count } from "drizzle-orm";
import { GetAdminAccessResponse, GetAdminSummaryResponse } from "@workspace/api-zod";
import { db, favoritesTable, foodsTable, recipesTable } from "@workspace/db";
import { Router, type IRouter } from "express";
import { isAdminRequest, requireAdmin } from "../middlewares/admin";

const router: IRouter = Router();

router.get("/admin/access", (req, res): void => {
  res.json(GetAdminAccessResponse.parse({ isAdmin: isAdminRequest(req) }));
});

router.get("/admin/summary", requireAdmin, async (_req, res): Promise<void> => {
  const [[recipeResult], [foodResult], [favoriteResult]] = await Promise.all([
    db.select({ value: count() }).from(recipesTable),
    db.select({ value: count() }).from(foodsTable),
    db.select({ value: count() }).from(favoritesTable),
  ]);
  res.json(
    GetAdminSummaryResponse.parse({
      recipeCount: recipeResult.value,
      foodCount: foodResult.value,
      favoriteCount: favoriteResult.value,
    }),
  );
});

export default router;
