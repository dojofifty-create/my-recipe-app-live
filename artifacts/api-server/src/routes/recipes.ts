import {
  and,
  desc,
  eq,
  ilike,
  or,
  sql,
} from "drizzle-orm";
import {
  CreateRecipeBody,
  CreateRecipeResponse,
  DeleteRecipeParams,
  GetFeaturedRecipeResponse,
  GetPopularRecipesQueryParams,
  GetPopularRecipesResponse,
  GetRecipeParams,
  GetRecipeResponse,
  ListRecipesQueryParams,
  ListRecipesResponse,
  RemoveFavoriteParams,
  RemoveFavoriteResponse,
  SaveFavoriteParams,
  SaveFavoriteResponse,
  UpdateRecipeBody,
  UpdateRecipeParams,
  UpdateRecipeResponse,
} from "@workspace/api-zod";
import {
  db,
  favoritesTable,
  recipesTable,
  type Recipe,
} from "@workspace/db";
import { Router, type IRouter } from "express";
import { requireAdmin } from "../middlewares/admin";

const router: IRouter = Router();

function serializeRecipe(recipe: Recipe) {
  return { ...recipe, createdAt: recipe.createdAt.toISOString() };
}

function validImagePath(imagePath: string | null | undefined): boolean {
  if (imagePath == null) return true;
  return (
    (imagePath.startsWith("/objects/") ||
      imagePath.startsWith("/recipes/")) &&
    !imagePath.includes("..")
  );
}

router.get("/recipes", async (req, res): Promise<void> => {
  const parsed = ListRecipesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const filters = [];
  const { q, category } = parsed.data;
  if (category) filters.push(eq(recipesTable.category, category));
  if (q?.trim()) {
    const pattern = `%${q.trim()}%`;
    filters.push(
      or(
        ilike(recipesTable.title, pattern),
        ilike(recipesTable.category, pattern),
        sql`${recipesTable.ingredients}::text ILIKE ${pattern}`,
      ),
    );
  }

  const recipes = await db
    .select()
    .from(recipesTable)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(recipesTable.featured), desc(recipesTable.createdAt));
  res.json(ListRecipesResponse.parse(recipes.map(serializeRecipe)));
});

router.get("/recipes/featured", async (_req, res): Promise<void> => {
  const [recipe] = await db
    .select()
    .from(recipesTable)
    .where(eq(recipesTable.featured, true))
    .orderBy(desc(recipesTable.createdAt))
    .limit(1);
  res.json(
    GetFeaturedRecipeResponse.parse(recipe ? serializeRecipe(recipe) : null),
  );
});

router.get("/recipes/popular", async (req, res): Promise<void> => {
  const parsed = GetPopularRecipesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const rows = await db
    .select({ recipe: recipesTable })
    .from(recipesTable)
    .leftJoin(
      favoritesTable,
      eq(favoritesTable.recipeId, recipesTable.id),
    )
    .groupBy(recipesTable.id)
    .orderBy(
      desc(sql<number>`count(${favoritesTable.recipeId})`),
      desc(recipesTable.createdAt),
    )
    .limit(parsed.data.limit ?? 6);
  res.json(
    GetPopularRecipesResponse.parse(
      rows.map(({ recipe }) => serializeRecipe(recipe)),
    ),
  );
});

router.post("/recipes", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateRecipeBody.safeParse(req.body);
  if (!parsed.success || !validImagePath(parsed.success ? parsed.data.imagePath : undefined)) {
    res.status(400).json({ error: parsed.success ? "Invalid image path." : parsed.error.message });
    return;
  }

  const recipe = await db.transaction(async (tx) => {
    if (parsed.data.featured) {
      await tx.update(recipesTable).set({ featured: false });
    }
    const [created] = await tx
      .insert(recipesTable)
      .values(parsed.data)
      .returning();
    return created;
  });
  res.status(201).json(CreateRecipeResponse.parse(serializeRecipe(recipe)));
});

router.get("/recipes/:id", async (req, res): Promise<void> => {
  const params = GetRecipeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [recipe] = await db
    .select()
    .from(recipesTable)
    .where(eq(recipesTable.id, params.data.id));
  if (!recipe) {
    res.status(404).json({ error: "Recipe not found." });
    return;
  }
  res.json(GetRecipeResponse.parse(serializeRecipe(recipe)));
});

router.patch("/recipes/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateRecipeParams.safeParse(req.params);
  const body = UpdateRecipeBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({
      error: !params.success ? params.error.message : body.error.message,
    });
    return;
  }
  if (!validImagePath(body.data.imagePath)) {
    res.status(400).json({ error: "Invalid image path." });
    return;
  }

  const recipe = await db.transaction(async (tx) => {
    if (body.data.featured) {
      await tx
        .update(recipesTable)
        .set({ featured: false })
        .where(sql`${recipesTable.id} <> ${params.data.id}`);
    }
    const [updated] = await tx
      .update(recipesTable)
      .set(body.data)
      .where(eq(recipesTable.id, params.data.id))
      .returning();
    return updated;
  });

  if (!recipe) {
    res.status(404).json({ error: "Recipe not found." });
    return;
  }
  res.json(UpdateRecipeResponse.parse(serializeRecipe(recipe)));
});

router.delete(
  "/recipes/:id",
  requireAdmin,
  async (req, res): Promise<void> => {
    const params = DeleteRecipeParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const [deleted] = await db
      .delete(recipesTable)
      .where(eq(recipesTable.id, params.data.id))
      .returning({ id: recipesTable.id });
    if (!deleted) {
      res.status(404).json({ error: "Recipe not found." });
      return;
    }
    res.sendStatus(204);
  },
);

router.put("/recipes/:id/favorite", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Sign in to save favorites." });
    return;
  }
  const params = SaveFavoriteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [recipe] = await db
    .select({ id: recipesTable.id })
    .from(recipesTable)
    .where(eq(recipesTable.id, params.data.id));
  if (!recipe) {
    res.status(404).json({ error: "Recipe not found." });
    return;
  }
  await db
    .insert(favoritesTable)
    .values({ userId: req.user.id, recipeId: params.data.id })
    .onConflictDoNothing();
  res.json(
    SaveFavoriteResponse.parse({
      recipeId: params.data.id,
      isFavorite: true,
    }),
  );
});

router.delete("/recipes/:id/favorite", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Sign in to manage favorites." });
    return;
  }
  const params = RemoveFavoriteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db
    .delete(favoritesTable)
    .where(
      and(
        eq(favoritesTable.userId, req.user.id),
        eq(favoritesTable.recipeId, params.data.id),
      ),
    );
  res.json(
    RemoveFavoriteResponse.parse({
      recipeId: params.data.id,
      isFavorite: false,
    }),
  );
});

export default router;
