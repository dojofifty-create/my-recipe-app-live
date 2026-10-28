import { type ButtonHTMLAttributes, type FormEvent, type ReactNode, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Link, Route, Router as WouterRouter, Switch, useLocation, useParams } from 'wouter';
import { useAuth } from '@workspace/replit-auth-web';
import {
  ArrowDown, ArrowLeft, ArrowRight, Bookmark, Check, ChefHat, ChevronDown, Clock3, Heart,
  Leaf, Menu, Minus, Plus, Printer, Search, Send, ShieldAlert, Sparkles, UploadCloud, X,
} from 'lucide-react';
import {
  getGetFeaturedRecipeQueryKey, getGetPopularRecipesQueryKey, getGetRecipeQueryKey,
  getGetAdminSummaryQueryKey, getListFavoritesQueryKey, getListFoodsQueryKey,
  getListRecipesQueryKey, useCreateFood, useCreateRecipe, useDeleteFood, useDeleteRecipe,
  useGetAdminAccess, useGetAdminSummary, useGetFeaturedRecipe, useGetPopularRecipes,
  useGetRecipe, useListFavorites, useListFoods, useListRecipes, useRemoveFavorite,
  useRequestUploadUrl, useSaveFavorite, useSendContactMessage, useUpdateFood, useUpdateRecipe,
} from '@workspace/api-client-react';
import type { ContactInput, Food, Recipe, RecipeCategory, RecipeInput, UploadRequest } from '@workspace/api-client-react';
import './site.css';

const client = new QueryClient();
const categories: RecipeCategory[] = ['Breakfast', 'Lunch', 'Dinner', 'Desserts', 'Healthy', 'Drinks', 'Snacks'];
const photoFor = (recipe: Recipe) => {
  if (recipe.imagePath) return recipe.imagePath.startsWith('/recipes/') ? recipe.imagePath : `/api/storage${recipe.imagePath}`;
  const title = recipe.title.toLowerCase();
  const filename = title.includes('salmon') ? 'lemon-herb-salmon.jpg'
    : title.includes('shakshuka') || title.includes('egg') ? 'shakshuka.jpg'
      : title.includes('pancake') || recipe.category === 'Breakfast' ? 'berry-pancakes.jpg'
        : title.includes('tart') || title.includes('chocolate') || recipe.category === 'Desserts' ? 'chocolate-tart.jpg'
          : title.includes('smoothie') || recipe.category === 'Drinks' ? 'green-smoothie.jpg' : 'roasted-vegetable-bowl.jpg';
  return `/recipes/${filename}`;
};
const formatError = (error: unknown) => error instanceof Error ? error.message : 'Something went wrong. Please try again.';

function Button({ children, className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={`button ${className}`} {...props}>{children}</button>;
}
function Skeleton({ className = '' }: { className?: string }) { return <div className={`skeleton ${className}`} aria-hidden="true" />; }
function SectionHeading({ kicker, title, copy, action }: { kicker: string; title: string; copy?: string; action?: ReactNode }) {
  return <div className="section-heading"><div><p className="eyebrow">{kicker}</p><h2>{title}</h2>{copy && <p className="section-copy">{copy}</p>}</div>{action}</div>;
}
function Alert({ children, onRetry }: { children: ReactNode; onRetry?: () => void }) {
  return <div className="alert" role="alert"><ShieldAlert size={18} /><span>{children}</span>{onRetry && <button onClick={onRetry} className="text-action" data-testid="button-retry">Try again</button>}</div>;
}
function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, isAuthenticated, login, logout } = useAuth();
  const nav = [
    { href: '/', label: 'Recipes' }, { href: '/food-benefits', label: 'Food benefits' },
    { href: '/about', label: 'Our table' }, { href: '/contact', label: 'Contact' },
  ];
  return <header className="site-header">
    <div className="header-inner">
      <Link href="/" className="brand" data-testid="link-home-logo"><span className="brand-mark"><ChefHat size={20} /></span><span>Savor <i>&</i> Gather</span></Link>
      <button className="mobile-menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} data-testid="button-mobile-menu">{menuOpen ? <X /> : <Menu />}</button>
      <nav className={`main-nav ${menuOpen ? 'is-open' : ''}`} aria-label="Main navigation">
        {nav.map(item => <Link key={item.href} href={item.href} className="nav-link" onClick={() => setMenuOpen(false)} data-testid={`link-nav-${item.label.toLowerCase().replaceAll(' ', '-')}`}>{item.label}</Link>)}
        {isAuthenticated && <Link href="/favorites" className="nav-link" onClick={() => setMenuOpen(false)} data-testid="link-nav-favorites">Saved recipes</Link>}
        {isAuthenticated && <Link href="/admin" className="nav-link nav-admin" onClick={() => setMenuOpen(false)} data-testid="link-nav-admin">Admin</Link>}
        <button className="nav-login" onClick={() => isAuthenticated ? logout() : login()} data-testid="button-auth">{isAuthenticated ? `Log out${user?.firstName ? `, ${user.firstName}` : ''}` : 'Log in'}</button>
      </nav>
    </div>
  </header>;
}
function Footer() {
  return <footer className="site-footer">
    <div className="footer-top"><div className="footer-brand"><Link href="/" className="brand" data-testid="link-footer-home"><span className="brand-mark"><ChefHat size={19} /></span><span>Savor <i>&</i> Gather</span></Link><p>Good food, shared generously.</p></div>
      <div className="footer-links"><Link href="/">Recipes</Link><Link href="/food-benefits">Food benefits</Link><Link href="/about">Our table</Link><Link href="/contact">Contact</Link></div>
      <div className="footer-note"><span className="sun-stamp"><Leaf size={20} /></span><p>A little more joy<br />at the dinner table.</p></div>
    </div><div className="footer-bottom"><span>© {new Date().getFullYear()} Savor & Gather</span><span>Made for the love of a good meal.</span></div>
  </footer>;
}
function Shell({ children }: { children: ReactNode }) {
  return <div className="grain"><Header /><main>{children}</main><Footer /></div>;
}
function RecipeCard({ recipe, onFavorite, favorite = false }: { recipe: Recipe; onFavorite?: (recipe: Recipe) => void; favorite?: boolean }) {
  return <article className="recipe-card" data-testid={`card-recipe-${recipe.id}`}>
    <Link href={`/recipe/${recipe.id}`} className="recipe-image-link" data-testid={`link-recipe-${recipe.id}`}>
      <img className="recipe-photo" src={photoFor(recipe)} alt={recipe.title} loading="lazy" data-testid={`img-recipe-${recipe.id}`} />
      <span className="photo-category">{recipe.category}</span>
    </Link>
    {onFavorite && <button className={`save-button ${favorite ? 'is-saved' : ''}`} aria-label={favorite ? 'Remove from saved recipes' : 'Save recipe'} onClick={() => onFavorite(recipe)} data-testid={`button-favorite-${recipe.id}`}><Heart size={18} fill={favorite ? 'currentColor' : 'none'} /></button>}
    <div className="recipe-card-body"><Link href={`/recipe/${recipe.id}`} className="recipe-title-link" data-testid={`link-title-${recipe.id}`}><h3>{recipe.title}</h3></Link>
      <div className="recipe-meta"><span><Clock3 size={14} /> {recipe.prepMinutes + recipe.cookMinutes} min</span><span>{recipe.calories} cal</span></div>
    </div>
  </article>;
}
function RecipeGrid({ recipes, favoriteIds, onFavorite }: { recipes: Recipe[]; favoriteIds?: Set<number>; onFavorite?: (recipe: Recipe) => void }) {
  return <div className="recipe-grid">{recipes.map(recipe => <RecipeCard key={recipe.id} recipe={recipe} onFavorite={onFavorite} favorite={favoriteIds?.has(recipe.id)} />)}</div>;
}
function HomePage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<RecipeCategory | ''>('');
  const { isAuthenticated, login } = useAuth();
  const queryClient = useQueryClient();
  const searchParams = useMemo(() => ({ ...(search.trim() ? { q: search.trim() } : {}), ...(category ? { category } : {}) }), [search, category]);
  const recipes = useListRecipes(searchParams);
  const featured = useGetFeaturedRecipe();
  const popular = useGetPopularRecipes({ limit: 6 });
  const favorites = useListFavorites({ query: { enabled: isAuthenticated, queryKey: getListFavoritesQueryKey() } });
  const saveFavorite = useSaveFavorite();
  const removeFavorite = useRemoveFavorite();
  const savedIds = new Set((favorites.data ?? []).map(recipe => recipe.id));
  const flipFavorite = (recipe: Recipe) => {
    if (!isAuthenticated) { login(); return; }
    const mutation = savedIds.has(recipe.id) ? removeFavorite : saveFavorite;
    mutation.mutate({ id: recipe.id }, { onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getListFavoritesQueryKey() });
      queryClient.invalidateQueries({ queryKey: getListRecipesQueryKey() });
    } });
  };
  const featuredRecipe = featured.data;
  return <div className="page-enter">
    <section className="hero-wrap">
      <div className="hero-copy"><p className="eyebrow"><span className="eyebrow-line" /> A recipe collection for real life</p><h1>Make room<br />for <em>something</em><br />delicious.</h1><p className="hero-description">Thoughtful recipes, simple ingredients, and little reasons to gather around the table.</p>
        <a href="#discover" className="button button-primary hero-cta" data-testid="link-discover-recipes">Find your next favorite <ArrowDown size={16} /></a>
        <div className="hero-footnote"><span className="hero-dot" /><span>Made for the everyday good stuff</span></div>
      </div>
      <div className="hero-art"><div className="hero-photo-frame"><img src={featuredRecipe ? photoFor(featuredRecipe) : '/recipes/lemon-herb-salmon.jpg'} alt={featuredRecipe?.title ?? 'A bright, fresh dinner at the table'} data-testid="img-hero-featured" /></div>
        <div className="hero-note"><span className="note-label">A little inspiration</span><span className="note-script">Gather around.</span></div><span className="hero-number">01 / 06</span>
      </div>
    </section>
    <section className="search-panel" id="discover"><div className="search-heading"><div><p className="eyebrow">Find something lovely</p><h2>What sounds good?</h2></div><span className="search-flourish"><Sparkles size={19} /></span></div>
      <div className="search-controls"><label className="search-box"><Search size={19} /><input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Try “weeknight pasta” or “something sweet”" aria-label="Search recipes" data-testid="input-recipe-search" />{search && <button className="clear-search" onClick={() => setSearch('')} aria-label="Clear search" data-testid="button-clear-search"><X size={16} /></button>}</label>
        <label className="category-select"><span className="sr-only">Filter by category</span><select value={category} onChange={event => setCategory(event.target.value as RecipeCategory | '')} data-testid="select-recipe-category"><option value="">All categories</option>{categories.map(value => <option value={value} key={value}>{value}</option>)}</select><ChevronDown size={16} /></label>
      </div>
      <div className="category-pills">{categories.map((item, index) => <button key={item} className={`category-pill ${category === item ? 'active' : ''}`} onClick={() => setCategory(category === item ? '' : item)} data-testid={`filter-category-${index}`}>{item}</button>)}</div>
    </section>
    <section className="content-section recipe-results"><SectionHeading kicker={search || category ? 'Your search' : 'Fresh from our kitchen'} title={search || category ? 'Recipes to explore' : 'A few favorites'} copy={search || category ? 'A good place to start.' : 'The dishes our readers come back to, again and again.'} />
      {recipes.isLoading ? <div className="recipe-grid">{[0,1,2].map(item => <Skeleton key={item} className="recipe-skeleton" />)}</div> : recipes.isError ? <Alert onRetry={() => recipes.refetch()}>{formatError(recipes.error)}</Alert> : recipes.data?.length ? <RecipeGrid recipes={recipes.data} favoriteIds={savedIds} onFavorite={flipFavorite} /> : <div className="empty-state"><span className="empty-icon"><Search /></span><h3>No recipes found just yet</h3><p>Try another ingredient or clear your filters to see everything.</p><Button onClick={() => { setSearch(''); setCategory(''); }} data-testid="button-reset-search">Clear filters</Button></div>}
    </section>
    {!search && !category && <section className="featured-strip">{featured.isLoading ? <Skeleton className="featured-skeleton" /> : featured.isError ? <Alert onRetry={() => featured.refetch()}>{formatError(featured.error)}</Alert> : featuredRecipe && <div className="featured-card"><img src={photoFor(featuredRecipe)} alt={featuredRecipe.title} loading="lazy" data-testid="img-featured-recipe" /><div className="featured-overlay"><p className="eyebrow">The one to make this week</p><h2>{featuredRecipe.title}</h2><p>{featuredRecipe.healthBenefits}</p><Link href={`/recipe/${featuredRecipe.id}`} className="button button-light" data-testid="link-featured-recipe">See the recipe <ArrowRight size={16} /></Link></div><span className="featured-side-label">EDITOR'S TABLE · {featuredRecipe.category}</span></div>}</section>}
    {!search && !category && <section className="content-section popular-section"><SectionHeading kicker="Worth a second helping" title="Reader favorites" copy="A handful of well-loved ideas for whatever the day brings." action={<Link href="#discover" className="text-action" data-testid="link-browse-all">Browse all <ArrowRight size={16} /></Link>} />
      {popular.isLoading ? <div className="recipe-grid">{[0,1,2].map(item => <Skeleton key={item} className="recipe-skeleton" />)}</div> : popular.isError ? <Alert onRetry={() => popular.refetch()}>{formatError(popular.error)}</Alert> : popular.data?.length ? <RecipeGrid recipes={popular.data} favoriteIds={savedIds} onFavorite={flipFavorite} /> : <p className="quiet-empty">Popular recipes will find their way here soon.</p>}
    </section>}
    <section className="benefit-band"><div className="benefit-band-mark"><Leaf size={30} /></div><div><p className="eyebrow">A little more than delicious</p><h2>Good food has a way of taking care of us.</h2><p>Get to know the ingredients in your kitchen and the good things they bring to the table.</p></div><Link href="/food-benefits" className="button button-outline" data-testid="link-food-benefits">Explore food benefits <ArrowRight size={16} /></Link></section>
  </div>;
}
function RecipePage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const recipe = useGetRecipe(id);
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [showLogin, setShowLogin] = useState(false);
  const auth = useAuth();
  const queryClient = useQueryClient();
  const favorites = useListFavorites({ query: { enabled: auth.isAuthenticated, queryKey: getListFavoritesQueryKey() } });
  const save = useSaveFavorite();
  const remove = useRemoveFavorite();
  if (!Number.isFinite(id) || id < 1) return <NotFoundPage />;
  if (recipe.isLoading) return <div className="page-shell page-enter"><Skeleton className="detail-skeleton" /></div>;
  if (recipe.isError || !recipe.data) return <div className="page-shell"><Alert onRetry={() => recipe.refetch()}>{recipe.error ? formatError(recipe.error) : 'We could not find that recipe.'}</Alert><Link href="/" className="text-action"><ArrowLeft size={15} /> Back to recipes</Link></div>;
  const item = recipe.data;
  const isSaved = favorites.data?.some(saved => saved.id === item.id) ?? false;
  const toggleSaved = () => {
    if (!auth.isAuthenticated) { setShowLogin(true); return; }
    (isSaved ? remove : save).mutate({ id: item.id }, { onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getListFavoritesQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetRecipeQueryKey(id) });
    } });
  };
  return <div className="page-enter recipe-detail">
    <div className="detail-breadcrumb"><Link href="/" data-testid="link-back-recipes"><ArrowLeft size={15} /> All recipes</Link><span>/</span><span>{item.category}</span></div>
    <section className="detail-hero"><div className="detail-hero-image"><img src={photoFor(item)} alt={item.title} data-testid="img-recipe-detail" /></div><div className="detail-intro"><p className="eyebrow">{item.category} · FROM OUR TABLE</p><h1 data-testid="text-recipe-title">{item.title}</h1><p className="detail-summary">{item.healthBenefits}</p><div className="detail-stats"><div><Clock3 /><span><b>{item.prepMinutes + item.cookMinutes}</b> minutes</span></div><div><ChefHat /><span><b>{item.servings}</b> servings</span></div><div><Leaf /><span><b>{item.calories}</b> calories</span></div></div><div className="detail-actions"><Button className={`button-save ${isSaved ? 'saved' : ''}`} onClick={toggleSaved} data-testid="button-save-recipe"><Heart size={17} fill={isSaved ? 'currentColor' : 'none'} /> {isSaved ? 'Saved to favorites' : 'Save this recipe'}</Button><Button className="button-print" onClick={() => window.print()} data-testid="button-print-recipe"><Printer size={17} /> Print</Button></div>{showLogin && <div className="login-callout"><span>Save this one for later</span><p>Log in to keep your favorite recipes close.</p><button className="text-action" onClick={auth.login} data-testid="button-login-prompt">Log in to save <ArrowRight size={14} /></button><button className="callout-close" aria-label="Dismiss" onClick={() => setShowLogin(false)}><X size={14} /></button></div>}</div></section>
    <div className="recipe-detail-grid"><section className="ingredients-panel"><div className="detail-section-head"><div><p className="eyebrow">Get everything ready</p><h2>Ingredients</h2></div><span>{item.ingredients.length} items</span></div><p className="check-hint">Tap an ingredient as you gather it.</p><div className="ingredient-list">{item.ingredients.map((ingredient, index) => <label className={`ingredient-row ${checked.has(index) ? 'checked' : ''}`} key={`${index}-${ingredient}`} data-testid={`row-ingredient-${index}`}><input type="checkbox" checked={checked.has(index)} onChange={() => setChecked(previous => { const next = new Set(previous); next.has(index) ? next.delete(index) : next.add(index); return next; })} data-testid={`checkbox-ingredient-${index}`} /><span className="custom-check"><Check size={12} /></span><span>{ingredient}</span></label>)}</div></section>
      <section className="method-panel"><div className="detail-section-head"><div><p className="eyebrow">One step at a time</p><h2>Let's cook</h2></div><span>{item.instructions.length} steps</span></div><ol className="instruction-list">{item.instructions.map((instruction, index) => <li key={`${index}-${instruction}`} data-testid={`step-instruction-${index}`}><span className="step-number">{String(index + 1).padStart(2, '0')}</span><p>{instruction}</p></li>)}</ol></section></div>
    <div className="health-note"><span><Leaf size={21} /></span><div><p className="eyebrow">Why we love it</p><p>{item.healthBenefits}</p></div></div>
  </div>;
}
function FoodBenefitsPage() {
  const [search, setSearch] = useState('');
  const params = useMemo(() => search.trim() ? { q: search.trim() } : {}, [search]);
  const foods = useListFoods(params);
  return <div className="page-shell page-enter">
    <section className="page-intro food-intro"><p className="eyebrow">The good in your groceries</p><h1>Know your<br /><em>good stuff.</em></h1><p>A practical little guide to the ingredients you cook with—and the ways they can support you.</p></section>
    <div className="food-search-wrap"><label className="search-box"><Search size={19} /><input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search a food or benefit" aria-label="Search foods" data-testid="input-food-search" />{search && <button className="clear-search" onClick={() => setSearch('')} aria-label="Clear food search" data-testid="button-clear-food-search"><X size={16} /></button>}</label></div>
    <section className="food-results"><div className="food-list-header"><span>Ingredient</span><span>Per 100g</span><span>Good to know</span></div>
      {foods.isLoading ? [0,1,2].map(item => <Skeleton key={item} className="food-skeleton" />) : foods.isError ? <Alert onRetry={() => foods.refetch()}>{formatError(foods.error)}</Alert> : foods.data?.length ? foods.data.map((food, index) => <FoodRow key={food.id} food={food} index={index} />) : <div className="empty-state"><span className="empty-icon"><Leaf /></span><h3>No ingredient notes found</h3><p>Try a different search, or come back as our kitchen notes grow.</p></div>}
    </section>
    <div className="food-disclaimer"><span><Leaf size={18} /></span><p>Food benefits are here for general information and inspiration, not a substitute for personal medical advice.</p></div>
  </div>;
}
function FoodRow({ food, index }: { food: Food; index: number }) {
  return <article className="food-row" data-testid={`row-food-${food.id}`}><span className="food-index">{String(index + 1).padStart(2, '0')}</span><h2 data-testid={`text-food-name-${food.id}`}>{food.name}</h2><span className="food-calories">{food.caloriesPer100g} <small>kcal</small></span><p>{food.benefits}</p></article>;
}
function AboutPage() {
  return <div className="page-enter about-page"><section className="about-hero"><div><p className="eyebrow">A note from our kitchen</p><h1>Food tastes better<br />when it's <em>shared.</em></h1><p>We believe the best meals are the ones that bring people a little closer—and don't ask you to spend all day getting there.</p></div><div className="about-image"><img src="/recipes/roasted-vegetable-bowl.jpg" alt="A colorful bowl of roasted vegetables on a gathered table" data-testid="img-about-table" /><span>Made for the everyday good stuff</span></div></section>
    <section className="about-story"><p className="eyebrow">A table for everyone</p><h2>Our kind of cooking is<br /><em>thoughtful, not fussy.</em></h2><div className="story-columns"><p>Savor & Gather is a collection of approachable recipes for the meals that make up a life: the quick dinners, slow Sundays, celebrations, and snacks eaten standing by the counter.</p><p>We share clear steps, familiar ingredients, and a little context about the food we love. Come as you are; there is always room at this table.</p></div></section>
    <div className="about-values"><div><span>01</span><h3>Good food, made doable</h3><p>Recipes that fit real kitchens and real weeks.</p></div><div><span>02</span><h3>Curiosity over rules</h3><p>Learn about ingredients without the lectures.</p></div><div><span>03</span><h3>Better together</h3><p>Every recipe is an invitation to share.</p></div></div>
    <section className="about-cta"><p className="eyebrow">There is always something simmering</p><h2>Let's find your next favorite.</h2><Link href="/" className="button button-primary" data-testid="link-about-recipes">Explore the recipes <ArrowRight size={16} /></Link></section>
  </div>;
}
function ContactPage() {
  const mutation = useSendContactMessage();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const data: ContactInput = { name: String(form.get('name')).trim(), email: String(form.get('email')).trim(), subject: String(form.get('subject')).trim(), message: String(form.get('message')).trim() };
    setError('');
    mutation.mutate({ data }, { onSuccess: () => { setSent(true); formElement.reset(); }, onError: err => setError(formatError(err)) });
  };
  return <div className="page-shell page-enter contact-page"><section className="contact-intro"><p className="eyebrow">We're glad you're here</p><h1>Pull up<br /><em>a chair.</em></h1><p>Have a question, a kitchen story, or a recipe you'd love to see? Send us a note.</p><div className="contact-aside"><span className="sun-stamp"><Send size={18} /></span><p>We read every message and will be in touch as soon as we can.</p></div></section>
    <section className="contact-form-wrap"><p className="eyebrow">A note to our kitchen</p><h2>What's on your mind?</h2>{sent ? <div className="success-state" role="status" data-testid="status-contact-success"><span><Check size={22} /></span><h3>Your note is on its way.</h3><p>Thanks for stopping by. We appreciate you reaching out.</p><Button onClick={() => setSent(false)} data-testid="button-send-another">Send another note</Button></div> : <form className="contact-form" onSubmit={submit} data-testid="form-contact">
      <label>Your name<input name="name" required minLength={2} maxLength={100} placeholder="How should we greet you?" data-testid="input-contact-name" /></label>
      <label>Email address<input name="email" type="email" required maxLength={254} placeholder="you@example.com" data-testid="input-contact-email" /></label>
      <label>Subject<input name="subject" required minLength={2} maxLength={160} placeholder="A little about your note" data-testid="input-contact-subject" /></label>
      <label>Your message<textarea name="message" required minLength={5} maxLength={5000} rows={5} placeholder="Tell us what's cooking..." data-testid="input-contact-message" /></label>
      {error && <Alert>{error}</Alert>}
      <Button type="submit" className="button-primary" disabled={mutation.isPending} data-testid="button-submit-contact">{mutation.isPending ? 'Sending your note…' : 'Send your note'} <ArrowRight size={16} /></Button>
    </form>}</section></div>;
}
function FavoritesPage() {
  const { isAuthenticated, isLoading, login } = useAuth();
  const favorites = useListFavorites({ query: { enabled: isAuthenticated, queryKey: getListFavoritesQueryKey() } });
  const remove = useRemoveFavorite();
  const queryClient = useQueryClient();
  if (isLoading) return <div className="page-shell"><Skeleton className="detail-skeleton" /></div>;
  if (!isAuthenticated) return <div className="page-shell page-enter auth-empty"><span className="empty-icon"><Bookmark /></span><p className="eyebrow">Your own little recipe box</p><h1>Save the good ones.</h1><p>Log in to keep the dishes you love close by, whenever you need them.</p><Button className="button-primary" onClick={login} data-testid="button-login-favorites">Log in to see saved recipes <ArrowRight size={16} /></Button></div>;
  return <div className="page-shell page-enter favorites-page"><div className="page-intro compact"><p className="eyebrow">Your own little recipe box</p><h1>Saved with <em>love.</em></h1><p>A home for the recipes you want to make again.</p></div>
    {favorites.isLoading ? <div className="recipe-grid">{[0,1,2].map(item => <Skeleton key={item} className="recipe-skeleton" />)}</div> : favorites.isError ? <Alert onRetry={() => favorites.refetch()}>{formatError(favorites.error)}</Alert> : favorites.data?.length ? <RecipeGrid recipes={favorites.data} favoriteIds={new Set(favorites.data.map(recipe => recipe.id))} onFavorite={recipe => remove.mutate({ id: recipe.id }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListFavoritesQueryKey() }) })} /> : <div className="empty-state"><span className="empty-icon"><Heart /></span><h3>Your recipe box is waiting</h3><p>Tap the heart on a recipe to keep it here for later.</p><Link href="/" className="button button-primary" data-testid="link-find-recipes">Find a recipe <ArrowRight size={16} /></Link></div>}</div>;
}
function UploadField({ value, onChange }: { value: string; onChange: (path: string) => void }) {
  const requestUpload = useRequestUploadUrl();
  const [dragging, setDragging] = useState(false);
  const [notice, setNotice] = useState('');
  const uploadFile = async (file?: File) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 10485760) { setNotice('Choose a JPG, PNG, or WebP image under 10 MB.'); return; }
    setNotice('Uploading image…');
    const request: UploadRequest = { name: file.name, size: file.size, contentType: file.type as UploadRequest['contentType'] };
    requestUpload.mutate({ data: request }, { onSuccess: async response => {
      try {
        const result = await fetch(response.uploadURL, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
        if (!result.ok) throw new Error('The image could not be uploaded.');
        onChange(response.objectPath);
        setNotice('Image ready.');
      } catch (error) { setNotice(formatError(error)); }
    }, onError: error => setNotice(formatError(error)) });
  };
  return <div className={`upload-field ${dragging ? 'dragging' : ''}`} onDragOver={event => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={event => { event.preventDefault(); setDragging(false); void uploadFile(event.dataTransfer.files[0]); }} data-testid="upload-recipe-image">
    {value ? <div className="upload-preview"><img src={value.startsWith('/recipes/') ? value : `/api/storage${value}`} alt="Recipe upload preview" /><button type="button" onClick={() => { onChange(''); setNotice('Image removed.'); }} aria-label="Remove image" data-testid="button-remove-image"><X size={15} /></button></div> : <label className="upload-prompt"><UploadCloud size={22} /><span><b>Drop a photo here</b> or browse from your device</span><small>JPG, PNG, or WebP · up to 10 MB</small><input type="file" accept="image/jpeg,image/png,image/webp" onChange={event => void uploadFile(event.target.files?.[0])} data-testid="input-recipe-image" /></label>}
    {requestUpload.isPending && <span className="upload-status">Preparing your upload…</span>}
    {notice && <span className={`upload-status ${notice.includes('could not') || notice.includes('Choose') ? 'error-text' : ''}`} role="status" data-testid="status-upload">{notice}</span>}
  </div>;
}
type DraftRecipe = { title: string; category: RecipeCategory; prepMinutes: string; cookMinutes: string; servings: string; calories: string; ingredients: string[]; instructions: string[]; healthBenefits: string; imagePath: string; featured: boolean };
const blankDraft = (): DraftRecipe => ({ title: '', category: 'Dinner', prepMinutes: '15', cookMinutes: '25', servings: '4', calories: '400', ingredients: [''], instructions: [''], healthBenefits: '', imagePath: '', featured: false });
function RecipeAdminForm({ editing, onDone, onCancel }: { editing?: Recipe; onDone: () => void; onCancel: () => void }) {
  const create = useCreateRecipe();
  const update = useUpdateRecipe();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<DraftRecipe>(() => editing ? { title: editing.title, category: editing.category, prepMinutes: String(editing.prepMinutes), cookMinutes: String(editing.cookMinutes), servings: String(editing.servings), calories: String(editing.calories), ingredients: editing.ingredients, instructions: editing.instructions, healthBenefits: editing.healthBenefits, imagePath: editing.imagePath ?? '', featured: editing.featured } : blankDraft());
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const set = (key: keyof DraftRecipe, value: DraftRecipe[keyof DraftRecipe]) => setDraft(current => ({ ...current, [key]: value }));
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const data: RecipeInput = { ...draft, prepMinutes: Number(draft.prepMinutes), cookMinutes: Number(draft.cookMinutes), servings: Number(draft.servings), calories: Number(draft.calories), ingredients: draft.ingredients.map(item => item.trim()).filter(Boolean), instructions: draft.instructions.map(item => item.trim()).filter(Boolean), healthBenefits: draft.healthBenefits.trim(), imagePath: draft.imagePath || null };
    if (!data.ingredients.length || !data.instructions.length) { setError('Add at least one ingredient and one cooking step.'); return; }
    setError(''); setSuccess('');
    const onSuccess = () => { setSuccess(editing ? 'Recipe updated.' : 'Recipe added.'); queryClient.invalidateQueries({ queryKey: getListRecipesQueryKey() }); queryClient.invalidateQueries({ queryKey: getGetFeaturedRecipeQueryKey() }); queryClient.invalidateQueries({ queryKey: getGetPopularRecipesQueryKey() }); queryClient.invalidateQueries({ queryKey: getGetAdminSummaryQueryKey() }); onDone(); };
    if (editing) update.mutate({ id: editing.id, data }, { onSuccess, onError: err => setError(formatError(err)) });
    else create.mutate({ data }, { onSuccess, onError: err => setError(formatError(err)) });
  };
  const pending = create.isPending || update.isPending;
  return <form className="admin-form" onSubmit={submit} data-testid="form-admin-recipe">
    <div className="admin-form-head"><div><p className="eyebrow">{editing ? 'Edit a kitchen note' : 'Add to the collection'}</p><h2>{editing ? 'Update recipe' : 'New recipe'}</h2></div><button type="button" className="icon-button" aria-label="Close editor" onClick={onCancel} data-testid="button-close-recipe-form"><X size={18} /></button></div>
    <div className="admin-form-layout"><div className="admin-form-fields">
      <label>Recipe title<input required minLength={2} maxLength={160} value={draft.title} onChange={event => set('title', event.target.value)} placeholder="e.g. Lemon herb salmon" data-testid="input-admin-title" /></label>
      <div className="form-two"><label>Category<select value={draft.category} onChange={event => set('category', event.target.value as RecipeCategory)} data-testid="select-admin-category">{categories.map(item => <option key={item}>{item}</option>)}</select></label><label>Calories<input type="number" min="0" max="10000" required value={draft.calories} onChange={event => set('calories', event.target.value)} data-testid="input-admin-calories" /></label></div>
      <div className="form-three"><label>Prep minutes<input type="number" min="0" max="1440" required value={draft.prepMinutes} onChange={event => set('prepMinutes', event.target.value)} data-testid="input-admin-prep" /></label><label>Cook minutes<input type="number" min="0" max="1440" required value={draft.cookMinutes} onChange={event => set('cookMinutes', event.target.value)} data-testid="input-admin-cook" /></label><label>Servings<input type="number" min="1" max="100" required value={draft.servings} onChange={event => set('servings', event.target.value)} data-testid="input-admin-servings" /></label></div>
      <div className="dynamic-list"><div className="admin-list-label"><b>Ingredients</b><button type="button" className="text-action" onClick={() => set('ingredients', [...draft.ingredients, ''])} data-testid="button-add-ingredient"><Plus size={14} /> Add ingredient</button></div>{draft.ingredients.map((ingredient, index) => <div className="dynamic-input" key={`ingredient-${index}`}><span>{String(index + 1).padStart(2, '0')}</span><input required value={ingredient} onChange={event => set('ingredients', draft.ingredients.map((item, i) => i === index ? event.target.value : item))} placeholder="1 tbsp olive oil" data-testid={`input-admin-ingredient-${index}`} /><button type="button" aria-label="Remove ingredient" disabled={draft.ingredients.length === 1} onClick={() => set('ingredients', draft.ingredients.filter((_, i) => i !== index))} data-testid={`button-remove-ingredient-${index}`}><Minus size={14} /></button></div>)}</div>
      <div className="dynamic-list"><div className="admin-list-label"><b>Cooking steps</b><button type="button" className="text-action" onClick={() => set('instructions', [...draft.instructions, ''])} data-testid="button-add-step"><Plus size={14} /> Add step</button></div>{draft.instructions.map((instruction, index) => <div className="dynamic-input step-input" key={`step-${index}`}><span>{String(index + 1).padStart(2, '0')}</span><textarea required value={instruction} rows={2} onChange={event => set('instructions', draft.instructions.map((item, i) => i === index ? event.target.value : item))} placeholder="Describe what to do…" data-testid={`input-admin-step-${index}`} /><button type="button" aria-label="Remove step" disabled={draft.instructions.length === 1} onClick={() => set('instructions', draft.instructions.filter((_, i) => i !== index))} data-testid={`button-remove-step-${index}`}><Minus size={14} /></button></div>)}</div>
      <label>Why it's good for you<textarea required minLength={1} maxLength={2000} rows={3} value={draft.healthBenefits} onChange={event => set('healthBenefits', event.target.value)} placeholder="A short, practical benefit note" data-testid="input-admin-benefits" /></label>
      <label className="featured-toggle"><input type="checkbox" checked={draft.featured} onChange={event => set('featured', event.target.checked)} data-testid="checkbox-admin-featured" /><span>Feature this recipe on the home page</span></label>
    </div><aside className="admin-form-aside"><div className="live-preview"><p className="eyebrow">Live card preview</p><div className="preview-photo">{draft.imagePath ? <img src={draft.imagePath.startsWith('/recipes/') ? draft.imagePath : `/api/storage${draft.imagePath}`} alt="" /> : <img src="/recipes/lemon-herb-salmon.jpg" alt="" />}</div><span className="photo-category">{draft.category}</span><h3>{draft.title || 'Your recipe title'}</h3><div className="recipe-meta"><span><Clock3 size={14} /> {Number(draft.prepMinutes) + Number(draft.cookMinutes)} min</span><span>{draft.calories || '0'} cal</span></div></div><UploadField value={draft.imagePath} onChange={value => set('imagePath', value)} /></aside></div>
    {error && <Alert>{error}</Alert>}{success && <p className="form-success" role="status">{success}</p>}<div className="form-actions"><Button type="button" className="button-outline" onClick={onCancel} data-testid="button-cancel-recipe">Cancel</Button><Button type="submit" className="button-primary" disabled={pending} data-testid="button-submit-recipe">{pending ? 'Saving…' : editing ? 'Save changes' : 'Add recipe'} <ArrowRight size={16} /></Button></div>
  </form>;
}
function FoodAdminForm({ editing, onDone, onCancel }: { editing?: Food; onDone: () => void; onCancel: () => void }) {
  const create = useCreateFood(); const update = useUpdateFood(); const queryClient = useQueryClient();
  const [name, setName] = useState(editing?.name ?? ''); const [calories, setCalories] = useState(String(editing?.caloriesPer100g ?? '')); const [benefits, setBenefits] = useState(editing?.benefits ?? ''); const [error, setError] = useState('');
  const submit = (event: FormEvent) => { event.preventDefault(); const data = { name: name.trim(), caloriesPer100g: Number(calories), benefits: benefits.trim() }; const success = () => { queryClient.invalidateQueries({ queryKey: getListFoodsQueryKey() }); queryClient.invalidateQueries({ queryKey: getGetAdminSummaryQueryKey() }); onDone(); }; if (editing) update.mutate({ id: editing.id, data }, { onSuccess: success, onError: err => setError(formatError(err)) }); else create.mutate({ data }, { onSuccess: success, onError: err => setError(formatError(err)) }); };
  return <form className="food-admin-form" onSubmit={submit} data-testid="form-admin-food"><div className="admin-form-head"><div><p className="eyebrow">{editing ? 'Update ingredient' : 'Add an ingredient'}</p><h2>{editing ? 'Edit food note' : 'New food note'}</h2></div><button type="button" className="icon-button" aria-label="Close food editor" onClick={onCancel}><X size={18} /></button></div><label>Food name<input required minLength={2} maxLength={100} value={name} onChange={event => setName(event.target.value)} data-testid="input-admin-food-name" /></label><label>Calories per 100g<input required type="number" min="0" max="900" value={calories} onChange={event => setCalories(event.target.value)} data-testid="input-admin-food-calories" /></label><label>Benefits<textarea required minLength={1} maxLength={2000} rows={4} value={benefits} onChange={event => setBenefits(event.target.value)} data-testid="input-admin-food-benefits" /></label>{error && <Alert>{error}</Alert>}<div className="form-actions"><Button type="button" className="button-outline" onClick={onCancel}>Cancel</Button><Button type="submit" className="button-primary" disabled={create.isPending || update.isPending} data-testid="button-submit-food">{create.isPending || update.isPending ? 'Saving…' : editing ? 'Save changes' : 'Add food'}</Button></div></form>;
}
function AdminPage() {
  const access = useGetAdminAccess();
  if (access.isLoading) return <div className="page-shell"><Skeleton className="detail-skeleton" /></div>;
  if (access.isError) return <div className="page-shell"><Alert onRetry={() => access.refetch()}>{formatError(access.error)}</Alert></div>;
  if (!access.data?.isAdmin) return <div className="page-shell page-enter admin-denied"><span className="empty-icon"><ShieldAlert /></span><p className="eyebrow">This area is private</p><h1>Access is limited.</h1><p>Management tools are available to authorized team members only.</p><Link href="/" className="button button-outline" data-testid="link-admin-home"><ArrowLeft size={15} /> Back to the recipes</Link></div>;
  return <AdminDashboard />;
}
function AdminDashboard() {
  const summary = useGetAdminSummary(); const recipes = useListRecipes(); const foods = useListFoods();
  const [tab, setTab] = useState<'recipes' | 'foods'>('recipes');
  const [editRecipe, setEditRecipe] = useState<Recipe | undefined>(); const [editFood, setEditFood] = useState<Food | undefined>();
  const [recipeFormOpen, setRecipeFormOpen] = useState(false); const [foodFormOpen, setFoodFormOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const queryClient = useQueryClient(); const deleteRecipe = useDeleteRecipe(); const deleteFood = useDeleteFood();
  const showRecipeForm = (item?: Recipe) => { setEditRecipe(item); setRecipeFormOpen(true); setFoodFormOpen(false); };
  const showFoodForm = (item?: Food) => { setEditFood(item); setFoodFormOpen(true); setRecipeFormOpen(false); };
  const deleteRecipeItem = (item: Recipe) => { if (window.confirm(`Delete “${item.title}”? This cannot be undone.`)) deleteRecipe.mutate({ id: item.id }, { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListRecipesQueryKey() }); queryClient.invalidateQueries({ queryKey: getGetFeaturedRecipeQueryKey() }); queryClient.invalidateQueries({ queryKey: getGetPopularRecipesQueryKey() }); queryClient.invalidateQueries({ queryKey: getGetAdminSummaryQueryKey() }); setNotice(`${item.title} was removed.`); }, onError: err => setNotice(formatError(err)) }); };
  const deleteFoodItem = (item: Food) => { if (window.confirm(`Delete ${item.name}? This cannot be undone.`)) deleteFood.mutate({ id: item.id }, { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListFoodsQueryKey() }); queryClient.invalidateQueries({ queryKey: getGetAdminSummaryQueryKey() }); setNotice(`${item.name} was removed.`); }, onError: err => setNotice(formatError(err)) }); };
  return <div className="page-shell page-enter admin-page"><div className="admin-heading"><div><p className="eyebrow">Kitchen desk</p><h1>Good things, <em>in progress.</em></h1></div><span className="admin-mark"><ChefHat size={24} /></span></div>
    {summary.isLoading ? <div className="summary-grid">{[0,1,2].map(item => <Skeleton key={item} className="summary-skeleton" />)}</div> : summary.isError ? <Alert onRetry={() => summary.refetch()}>{formatError(summary.error)}</Alert> : <div className="summary-grid"><div><span>Recipes</span><strong data-testid="text-admin-recipe-count">{summary.data?.recipeCount ?? 0}</strong></div><div><span>Food notes</span><strong data-testid="text-admin-food-count">{summary.data?.foodCount ?? 0}</strong></div><div><span>Community saves</span><strong data-testid="text-admin-favorite-count">{summary.data?.favoriteCount ?? 0}</strong></div></div>}
    <div className="admin-toolbar"><div className="admin-tabs" role="tablist"><button className={tab === 'recipes' ? 'active' : ''} role="tab" aria-selected={tab === 'recipes'} onClick={() => { setTab('recipes'); setNotice(''); }} data-testid="tab-admin-recipes">Recipes</button><button className={tab === 'foods' ? 'active' : ''} role="tab" aria-selected={tab === 'foods'} onClick={() => { setTab('foods'); setNotice(''); }} data-testid="tab-admin-foods">Food benefits</button></div>
      <Button className="button-primary" onClick={() => tab === 'recipes' ? showRecipeForm() : showFoodForm()} data-testid="button-admin-add">{tab === 'recipes' ? <><Plus size={16} /> Add recipe</> : <><Plus size={16} /> Add food note</>}</Button></div>
    {notice && <p className="admin-notice" role="status" data-testid="status-admin-notice">{notice}</p>}
    {recipeFormOpen && <RecipeAdminForm editing={editRecipe} onCancel={() => setRecipeFormOpen(false)} onDone={() => { setRecipeFormOpen(false); setNotice(editRecipe ? 'Recipe updated.' : 'Recipe added.'); }} />}
    {foodFormOpen && <FoodAdminForm editing={editFood} onCancel={() => setFoodFormOpen(false)} onDone={() => { setFoodFormOpen(false); setNotice(editFood ? 'Food note updated.' : 'Food note added.'); }} />}
    {tab === 'recipes' ? <section className="admin-table-wrap"><div className="admin-table-head"><span>Recipe</span><span>Category</span><span>Time</span><span>Actions</span></div>{recipes.isLoading ? [0,1,2].map(item => <Skeleton key={item} className="table-skeleton" />) : recipes.isError ? <Alert onRetry={() => recipes.refetch()}>{formatError(recipes.error)}</Alert> : recipes.data?.length ? recipes.data.map(item => <div className="admin-table-row" key={item.id} data-testid={`row-admin-recipe-${item.id}`}><div className="admin-recipe-cell"><img src={photoFor(item)} alt="" /><span><b>{item.title}</b>{item.featured && <small>Featured</small>}</span></div><span className="table-category">{item.category}</span><span>{item.prepMinutes + item.cookMinutes} min</span><div className="table-actions"><button onClick={() => showRecipeForm(item)} data-testid={`button-edit-recipe-${item.id}`}>Edit</button><button className="danger-action" onClick={() => deleteRecipeItem(item)} disabled={deleteRecipe.isPending} data-testid={`button-delete-recipe-${item.id}`}>Delete</button></div></div>) : <div className="empty-state compact-empty"><h3>No recipes to manage</h3><p>Add the first recipe to your collection.</p></div>}</section>
      : <section className="admin-table-wrap"><div className="food-admin-table-head"><span>Food</span><span>Calories / 100g</span><span>Benefits</span><span>Actions</span></div>{foods.isLoading ? [0,1,2].map(item => <Skeleton key={item} className="table-skeleton" />) : foods.isError ? <Alert onRetry={() => foods.refetch()}>{formatError(foods.error)}</Alert> : foods.data?.length ? foods.data.map(item => <div className="food-admin-row" key={item.id} data-testid={`row-admin-food-${item.id}`}><b>{item.name}</b><span>{item.caloriesPer100g} kcal</span><p>{item.benefits}</p><div className="table-actions"><button onClick={() => showFoodForm(item)} data-testid={`button-edit-food-${item.id}`}>Edit</button><button className="danger-action" onClick={() => deleteFoodItem(item)} disabled={deleteFood.isPending} data-testid={`button-delete-food-${item.id}`}>Delete</button></div></div>) : <div className="empty-state compact-empty"><h3>No food notes to manage</h3><p>Add an ingredient note for visitors to discover.</p></div>}</section>}
  </div>;
}
function NotFoundPage() {
  return <div className="page-shell page-enter not-found"><span className="not-found-number">404</span><p className="eyebrow">We've lost the recipe</p><h1>This page isn't<br /><em>on the menu.</em></h1><p>It may have moved, or perhaps it never made it out of the kitchen.</p><Link href="/" className="button button-primary" data-testid="link-notfound-home"><ArrowLeft size={15} /> Back to the table</Link></div>;
}
function Routes() {
  const [location] = useLocation();
  return <Shell><div key={location} className="route-view"><Switch>
    <Route path="/" component={HomePage} />
    <Route path="/recipe/:id" component={RecipePage} />
    <Route path="/food-benefits" component={FoodBenefitsPage} />
    <Route path="/about" component={AboutPage} />
    <Route path="/contact" component={ContactPage} />
    <Route path="/favorites" component={FavoritesPage} />
    <Route path="/admin" component={AdminPage} />
    <Route component={NotFoundPage} />
  </Switch></div></Shell>;
}
function App() {
  return <QueryClientProvider client={client}><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Routes /></WouterRouter></QueryClientProvider>;
}
export default App;
