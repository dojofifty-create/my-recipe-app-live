import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import {
  CreateFoodBody,
  CreateFoodResponse,
  DeleteFoodParams,
  ListFoodsQueryParams,
  ListFoodsResponse,
  UpdateFoodBody,
  UpdateFoodParams,
  UpdateFoodResponse,
} from "@workspace/api-zod";
import { db, foodsTable, type Food } from "@workspace/db";
import { Router, type IRouter } from "express";
import { requireAdmin } from "../middlewares/admin";

const router: IRouter = Router();

function serializeFood(food: Food) {
  return { ...food, createdAt: food.createdAt.toISOString() };
}

router.get("/foods", async (req, res): Promise<void> => {
  const parsed = ListFoodsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const query = parsed.data.q?.trim();
  const foods = await db
    .select()
    .from(foodsTable)
    .where(
      query
        ? or(
            ilike(foodsTable.name, `%${query}%`),
            ilike(foodsTable.benefits, `%${query}%`),
          )
        : undefined,
    )
    .orderBy(desc(foodsTable.name));
  res.json(ListFoodsResponse.parse(foods.map(serializeFood)));
});

router.post("/foods", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateFoodBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [food] = await db.insert(foodsTable).values(parsed.data).returning();
  res.status(201).json(CreateFoodResponse.parse(serializeFood(food)));
});

router.patch("/foods/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateFoodParams.safeParse(req.params);
  const body = UpdateFoodBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({
      error: !params.success ? params.error.message : body.error.message,
    });
    return;
  }
  const [food] = await db
    .update(foodsTable)
    .set(body.data)
    .where(eq(foodsTable.id, params.data.id))
    .returning();
  if (!food) {
    res.status(404).json({ error: "Food benefit not found." });
    return;
  }
  res.json(UpdateFoodResponse.parse(serializeFood(food)));
});

router.delete(
  "/foods/:id",
  requireAdmin,
  async (req, res): Promise<void> => {
    const params = DeleteFoodParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const [food] = await db
      .delete(foodsTable)
      .where(eq(foodsTable.id, params.data.id))
      .returning({ id: foodsTable.id });
    if (!food) {
      res.status(404).json({ error: "Food benefit not found." });
      return;
    }
    res.sendStatus(204);
  },
);

export default router;
