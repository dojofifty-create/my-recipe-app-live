export type CustomFetchOptions = RequestInit & {
  responseType?: "json" | "text" | "blob" | "auto";
};

export type ErrorType<T = unknown> = ApiError<T>;
export type BodyType<T> = T;
export type AuthTokenGetter = () => Promise<string | null> | string | null;

const MOCK_RECIPES = [
  {
    id: 1,
    title: "Lemon Herb Roasted Salmon",
    description: "Tender flaky salmon with fresh herbs, lemon slices, and crisp asparagus.",
    category: "Dinner",
    cookTime: "25 mins",
    servings: 4,
    calories: 420,
    rating: 4.9,
    reviewsCount: 128,
    isFeatured: true,
    isPopular: true,
    imagePath: "/recipes/lemon-herb-salmon.jpg",
    ingredients: ["Salmon fillets", "Fresh dill", "Garlic", "Lemon", "Olive oil", "Asparagus"],
    instructions: ["Preheat oven to 400°F (200°C).", "Season salmon with salt, pepper, garlic, and dill.", "Place on baking sheet with asparagus and lemon slices.", "Bake for 15-20 minutes until cooked through."]
  },
  {
    id: 2,
    title: "Fluffy Berry Buttermilk Pancakes",
    description: "Golden buttermilk pancakes topped with sweet berry compote and maple syrup.",
    category: "Breakfast",
    cookTime: "20 mins",
    servings: 4,
    calories: 350,
    rating: 4.8,
    reviewsCount: 95,
    isFeatured: false,
    isPopular: true,
    imagePath: "/recipes/berry-pancakes.jpg",
    ingredients: ["Flour", "Buttermilk", "Eggs", "Baking powder", "Butter", "Fresh berries", "Maple syrup"],
    instructions: ["Whisk dry ingredients together.", "Fold in buttermilk and beaten eggs gently.", "Cook on a heated skillet until bubbly, flip and finish.", "Serve warm with berry toppings."]
  },
  {
    id: 3,
    title: "Rich Dark Chocolate Tart",
    description: "Silky chocolate ganache filling nestled inside a buttery chocolate crust.",
    category: "Desserts",
    cookTime: "45 mins",
    servings: 8,
    calories: 480,
    rating: 5.0,
    reviewsCount: 210,
    isFeatured: false,
    isPopular: true,
    imagePath: "/recipes/chocolate-tart.jpg",
    ingredients: ["Dark chocolate 70%", "Heavy cream", "Butter", "Flour", "Cocoa powder", "Sea salt"],
    instructions: ["Bake tart shell until crisp.", "Warm cream and pour over chopped chocolate to form ganache.", "Pour into tart shell and chill until set."]
  },
  {
    id: 4,
    title: "Green Goddess Glow Smoothie",
    description: "Invigorating blend of crisp green apple, spinach, ginger, and coconut water.",
    category: "Drinks",
    cookTime: "5 mins",
    servings: 2,
    calories: 180,
    rating: 4.7,
    reviewsCount: 64,
    isFeatured: false,
    isPopular: false,
    imagePath: "/recipes/green-smoothie.jpg",
    ingredients: ["Fresh baby spinach", "Green apple", "Ginger root", "Cucumber", "Coconut water", "Chia seeds"],
    instructions: ["Add all ingredients to a high-speed blender.", "Blend on high until silky smooth.", "Pour over ice and serve."]
  },
  {
    id: 5,
    title: "Traditional Shakshuka with Feta",
    description: "Poached eggs in a fragrant spiced tomato and bell pepper sauce.",
    category: "Breakfast",
    cookTime: "30 mins",
    servings: 3,
    calories: 310,
    rating: 4.9,
    reviewsCount: 142,
    isFeatured: false,
    isPopular: true,
    imagePath: "/recipes/shakshuka.jpg",
    ingredients: ["Eggs", "Canned tomatoes", "Bell peppers", "Onion", "Cumin", "Paprika", "Feta cheese"],
    instructions: ["Sauté onions and peppers until tender.", "Simmer with tomatoes and aromatic spices.", "Crack eggs directly into simmering sauce and cover until set."]
  },
  {
    id: 6,
    title: "Roasted Harvest Vegetable Bowl",
    description: "Warm quinoa layered with caramelized vegetables, tahini dressing, and seeds.",
    category: "Healthy",
    cookTime: "35 mins",
    servings: 2,
    calories: 390,
    rating: 4.8,
    reviewsCount: 88,
    isFeatured: false,
    isPopular: false,
    imagePath: "/recipes/roasted-vegetable-bowl.jpg",
    ingredients: ["Quinoa", "Sweet potatoes", "Chickpeas", "Kale", "Tahini", "Lemon juice", "Pumpkin seeds"],
    instructions: ["Roast sweet potatoes and chickpeas until crispy.", "Assemble over warm cooked quinoa with fresh kale.", "Drizzle generously with tahini sauce."]
  }
];

export function setBaseUrl(_url: string | null): void {}
export function setAuthTokenGetter(_getter: AuthTokenGetter | null): void {}

export class ApiError<T = unknown> extends Error {
  readonly name = "ApiError";
  readonly status: number = 500;
  readonly statusText: string = "Error";
  readonly data: T | null = null;
  readonly headers: Headers = new Headers();
  readonly response: Response = new Response();
  readonly method: string = "GET";
  readonly url: string = "";

  constructor(message = "API Error") {
    super(message);
  }
}

export async function customFetch<T = unknown>(
  input: RequestInfo | URL,
  _options: CustomFetchOptions = {},
): Promise<T> {
  const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

  if (url.includes("/api/recipes/featured")) {
    return (MOCK_RECIPES[0] ?? null) as T;
  }

  if (url.includes("/api/recipes/popular")) {
    return MOCK_RECIPES.filter((r) => r.isPopular) as T;
  }

  if (url.includes("/api/recipes/")) {
    const id = parseInt(url.split("/api/recipes/")[1] ?? "1", 10);
    const recipe = MOCK_RECIPES.find((r) => r.id === id) ?? MOCK_RECIPES[0];
    return recipe as T;
  }

  if (url.includes("/api/recipes")) {
    return MOCK_RECIPES as T;
  }

  if (url.includes("/api/favorites")) {
    return [] as T;
  }

  if (url.includes("/api/foods")) {
    return [] as T;
  }

  if (url.includes("/api/admin")) {
    return { recipesCount: MOCK_RECIPES.length, usersCount: 1 } as T;
  }

  return [] as T;
}
