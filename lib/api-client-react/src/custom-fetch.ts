export type CustomFetchOptions = RequestInit & {
  responseType?: "json" | "text" | "blob" | "auto";
};

export type ErrorType<T = unknown> = ApiError<T>;
export type BodyType<T> = T;
export type AuthTokenGetter = () => Promise<string | null> | string | null;

const SUPABASE_URL = "https://gqdvpvorwysjkqjcpyyf.supabase.co";
const SUPABASE_ANON_KEY = "Sb_publishable_5PEB8Po2zx1lYm1vWzV06Q_JQU7rCx6";

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

async function requestSupabase(endpoint: string, options: RequestInit = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
    ...options,
    headers: {
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      "Prefer": options.method === "POST" ? "return=representation" : "return=minimal",
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    throw new ApiError(`Supabase request failed: ${res.statusText}`);
  }
  return res.json().catch(() => null);
}

export async function customFetch<T = unknown>(
  input: RequestInfo | URL,
  options: CustomFetchOptions = {},
): Promise<T> {
  const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
  const method = (options.method || "GET").toUpperCase();

  // جلب وصفة مميزة
  if (url.includes("/api/recipes/featured")) {
    const data = await requestSupabase("recipes?isFeatured=eq.true&limit=1");
    if (data && data.length > 0) return data[0] as T;
    const fallback = await requestSupabase("recipes?limit=1");
    return (fallback && fallback[0] ? fallback[0] : null) as T;
  }

  // جلب الوصفات الشائعة
  if (url.includes("/api/recipes/popular")) {
    const data = await requestSupabase("recipes?isPopular=eq.true&order=id.desc");
    return (data || []) as T;
  }

  // إضافة وصفة جديدة
  if (url.includes("/api/recipes") && method === "POST") {
    const bodyData = typeof options.body === "string" ? JSON.parse(options.body) : options.body;
    const inserted = await requestSupabase("recipes", {
      method: "POST",
      body: JSON.stringify(bodyData),
    });
    return (inserted && inserted[0] ? inserted[0] : inserted) as T;
  }

  // جلب تفاصيل وصفة واحدة برقمها
  if (url.includes("/api/recipes/")) {
    const id = url.split("/api/recipes/")[1];
    const data = await requestSupabase(`recipes?id=eq.${id}&limit=1`);
    return (data && data[0] ? data[0] : null) as T;
  }

  // جلب كافة الوصفات
  if (url.includes("/api/recipes")) {
    const data = await requestSupabase("recipes?order=id.desc");
    return (data || []) as T;
  }

  // مسارات إضافية
  if (url.includes("/api/favorites")) {
    return [] as T;
  }

  if (url.includes("/api/foods")) {
    return [] as T;
  }

  if (url.includes("/api/admin")) {
    const data = await requestSupabase("recipes");
    return { recipesCount: (data || []).length, usersCount: 1 } as T;
  }

  return [] as T;
}
