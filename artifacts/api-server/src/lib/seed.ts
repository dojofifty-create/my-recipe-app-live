import { eq, sql } from "drizzle-orm";
import { db, appSeedsTable, foodsTable, recipesTable } from "@workspace/db";

const seedKey = "initial-recipe-content-v1";

const sampleRecipes = [
  {
    title: "Lemon Herb Salmon with Crispy Potatoes",
    category: "Dinner",
    prepMinutes: 15,
    cookMinutes: 25,
    servings: 4,
    calories: 485,
    ingredients: [
      "4 salmon fillets",
      "500 g baby potatoes, halved",
      "1 lemon, zested and juiced",
      "2 tbsp olive oil",
      "2 garlic cloves, finely grated",
      "Fresh dill and parsley",
      "Fine sea salt and black pepper",
    ],
    instructions: [
      "Heat the oven to 220°C (425°F). Toss potatoes with half the olive oil, salt, and pepper; roast cut-side down for 18 minutes.",
      "Mix lemon zest, lemon juice, garlic, remaining oil, chopped herbs, and a pinch of salt.",
      "Nestle salmon among the potatoes and spoon the lemon-herb mixture over each fillet.",
      "Roast for 8–10 minutes, until the salmon flakes easily. Finish with extra herbs and lemon.",
    ],
    healthBenefits:
      "Salmon provides protein and omega-3 fats, while potatoes and fresh herbs add satisfying texture and flavor.",
    imagePath: "/recipes/lemon-herb-salmon.jpg",
    featured: true,
  },
  {
    title: "Skillet Shakshuka with Feta",
    category: "Breakfast",
    prepMinutes: 12,
    cookMinutes: 28,
    servings: 3,
    calories: 310,
    ingredients: [
      "1 tbsp olive oil",
      "1 red bell pepper, thinly sliced",
      "1 small onion, diced",
      "2 garlic cloves, minced",
      "1 tsp ground cumin",
      "1 tsp smoked paprika",
      "1 can (400 g) crushed tomatoes",
      "4 large eggs",
      "50 g crumbled feta",
      "Parsley and crusty bread, to serve",
    ],
    instructions: [
      "Warm the olive oil in a deep skillet over medium heat. Add pepper and onion; cook until soft, about 7 minutes.",
      "Stir in garlic, cumin, and paprika for 30 seconds, then add tomatoes. Simmer until thickened, 12–15 minutes.",
      "Make four small wells in the sauce and crack an egg into each. Cover and cook until the whites are set.",
      "Scatter with feta and parsley. Serve straight from the skillet with warm bread.",
    ],
    healthBenefits:
      "Tomatoes and peppers bring color and vegetables to the table; eggs add protein and make this a satisfying one-pan meal.",
    imagePath: "/recipes/shakshuka.jpg",
    featured: false,
  },
  {
    title: "Fluffy Berry Buttermilk Pancakes",
    category: "Breakfast",
    prepMinutes: 10,
    cookMinutes: 15,
    servings: 4,
    calories: 365,
    ingredients: [
      "220 g all-purpose flour",
      "2 tbsp light brown sugar",
      "2 tsp baking powder",
      "½ tsp baking soda",
      "¼ tsp fine salt",
      "300 ml buttermilk",
      "1 large egg",
      "3 tbsp melted butter",
      "150 g mixed berries",
      "Maple syrup, to serve",
    ],
    instructions: [
      "Whisk flour, sugar, baking powder, baking soda, and salt in a large bowl.",
      "In another bowl, whisk buttermilk, egg, and melted butter. Fold wet ingredients into dry just until combined.",
      "Heat a lightly buttered pan over medium-low heat. Pour in small rounds of batter and add a few berries.",
      "Flip when bubbles appear on top. Cook until golden, then serve warm with more berries and maple syrup.",
    ],
    healthBenefits:
      "A generous handful of berries adds fruit and natural tartness; serving with yogurt is an easy way to add extra protein.",
    imagePath: "/recipes/berry-pancakes.jpg",
    featured: false,
  },
  {
    title: "Roasted Vegetable & Tahini Bowl",
    category: "Healthy",
    prepMinutes: 20,
    cookMinutes: 30,
    servings: 4,
    calories: 430,
    ingredients: [
      "1 large sweet potato, cubed",
      "1 head broccoli, cut into florets",
      "1 red onion, cut into wedges",
      "2 tbsp olive oil",
      "250 g cooked quinoa",
      "1 can (400 g) chickpeas, drained",
      "3 tbsp tahini",
      "1 lemon",
      "2 tbsp warm water",
      "Toasted pumpkin seeds",
    ],
    instructions: [
      "Heat the oven to 220°C (425°F). Toss sweet potato, broccoli, and onion with olive oil, salt, and pepper.",
      "Roast on a large tray for 25–30 minutes, turning once, until the edges are browned.",
      "Whisk tahini with lemon juice, warm water, and a pinch of salt until smooth.",
      "Divide quinoa and chickpeas between bowls. Add roasted vegetables, drizzle with tahini, and finish with pumpkin seeds.",
    ],
    healthBenefits:
      "Quinoa and chickpeas bring plant-based protein and fiber; the colorful vegetables make this bowl easy to vary with the seasons.",
    imagePath: "/recipes/roasted-vegetable-bowl.jpg",
    featured: false,
  },
  {
    title: "Dark Chocolate & Raspberry Tart",
    category: "Desserts",
    prepMinutes: 25,
    cookMinutes: 20,
    servings: 10,
    calories: 395,
    ingredients: [
      "200 g chocolate biscuits",
      "80 g unsalted butter, melted",
      "250 ml double cream",
      "250 g dark chocolate, chopped",
      "1 tbsp honey",
      "1 tsp vanilla extract",
      "125 g fresh raspberries",
      "Flaky sea salt",
    ],
    instructions: [
      "Crush the biscuits into fine crumbs and mix with melted butter. Press firmly into a 23 cm tart tin and chill.",
      "Warm cream until steaming but not boiling. Pour it over chopped chocolate and leave for 2 minutes.",
      "Stir gently until glossy, then mix in honey and vanilla. Pour into the chilled biscuit shell.",
      "Refrigerate for at least 3 hours. Top with raspberries and a light pinch of flaky salt before slicing.",
    ],
    healthBenefits:
      "A small slice makes a rich dessert feel special; raspberries add bright fruit flavor that balances the dark chocolate.",
    imagePath: "/recipes/chocolate-tart.jpg",
    featured: false,
  },
  {
    title: "Creamy Green Breakfast Smoothie",
    category: "Drinks",
    prepMinutes: 8,
    cookMinutes: 0,
    servings: 2,
    calories: 245,
    ingredients: [
      "1 ripe banana",
      "1 small avocado",
      "2 packed handfuls baby spinach",
      "250 ml oat milk",
      "2 tbsp rolled oats",
      "1 tbsp almond butter",
      "½ lime, juiced",
      "Ice, as needed",
    ],
    instructions: [
      "Add banana, avocado, spinach, oat milk, oats, almond butter, and lime juice to a blender.",
      "Blend until completely smooth, adding a splash of oat milk if you prefer a thinner texture.",
      "Add a handful of ice and blend again until chilled.",
      "Pour into two glasses and enjoy straight away.",
    ],
    healthBenefits:
      "Spinach adds leafy greens and the oats, avocado, and nut butter make this smoothie more filling than fruit alone.",
    imagePath: "/recipes/green-smoothie.jpg",
    featured: false,
  },
];

const sampleFoods = [
  {
    name: "Blueberries",
    caloriesPer100g: 57,
    benefits:
      "A colorful source of fiber and vitamin C. Enjoy fresh with breakfast, or fold into oats and baking.",
  },
  {
    name: "Lentils",
    caloriesPer100g: 116,
    benefits:
      "Cooked lentils provide plant-based protein and fiber, making them a hearty addition to soups, salads, and bowls.",
  },
  {
    name: "Spinach",
    caloriesPer100g: 23,
    benefits:
      "A leafy green with folate and vitamins A and K. Add it raw to salads or stir it into warm dishes at the end.",
  },
  {
    name: "Avocado",
    caloriesPer100g: 160,
    benefits:
      "Avocado contains fiber and mostly unsaturated fats. Its creamy texture works well in toast, salads, and smoothies.",
  },
  {
    name: "Rolled oats",
    caloriesPer100g: 379,
    benefits:
      "Oats offer soluble fiber and make a versatile base for breakfast, baking, and savory dishes.",
  },
  {
    name: "Fresh ginger",
    caloriesPer100g: 80,
    benefits:
      "Fresh ginger adds a fragrant, warming flavor to teas, marinades, soups, and stir-fries.",
  },
];

export async function seedDatabase(): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(73190421)`);
    const [alreadySeeded] = await tx
      .select({ key: appSeedsTable.key })
      .from(appSeedsTable)
      .where(eq(appSeedsTable.key, seedKey))
      .limit(1);
    if (alreadySeeded) return;

    await tx.insert(recipesTable).values(sampleRecipes);
    await tx.insert(foodsTable).values(sampleFoods);
    await tx.insert(appSeedsTable).values({ key: seedKey });
  });
}
