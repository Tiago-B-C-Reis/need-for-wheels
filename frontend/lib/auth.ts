const AUTH_API_BASE = "/api/auth"

type RequestInitWithBody = RequestInit & { body?: BodyInit | null }

type TokenResponse = {
  access_token: string
  token_type: string
}

export type AuthTokens = {
  accessToken: string
  tokenType: string
}

async function request<TResponse>(path: string, init: RequestInitWithBody): Promise<TResponse> {
  let res: Response
  try {
    res = await fetch(`${AUTH_API_BASE}${path}`, {
      ...init,
      headers: {
        "content-type": "application/json",
        ...(init.headers || {}),
      },
    })
  } catch (err: any) {
    throw new Error(err?.message || "Unable to reach authentication service")
  }

  const payload = await res.json().catch(() => null)

  if (!res.ok) {
    const detail = typeof payload === "object" && payload?.detail ? payload.detail : res.statusText
    throw new Error(detail || "Request failed")
  }

  return payload as TResponse
}

export async function registerUser(input: { email: string; password: string; displayName?: string | null }) {
  return request<{ message: string; verification_token: string }>("/register", {
    method: "POST",
    body: JSON.stringify({
      email: input.email,
      password: input.password,
      display_name: input.displayName,
    }),
  })
}

export async function loginUser(input: { email: string; password: string }): Promise<AuthTokens> {
  const result = await request<TokenResponse>("/login", {
    method: "POST",
    body: JSON.stringify(input),
  })
  return { accessToken: result.access_token, tokenType: result.token_type }
}

export async function verifyEmailToken(token: string) {
  return request<{ message: string }>("/verify", {
    method: "POST",
    body: JSON.stringify({ token }),
  })
}

type OAuthOptions =
  | { token: string; tokenType?: "id_token" | "access_token" }
  | { code: string; redirectUri?: string }

export async function oauthSignIn(
  provider: "google" | "apple",
  options: OAuthOptions,
): Promise<AuthTokens & { email: string; provider: string }> {
  const body: Record<string, unknown> = { provider }
  if ("token" in options) {
    body.token = options.token
    body.token_type = options.tokenType ?? "id_token"
  }
  if ("code" in options) {
    body.code = options.code
    if (options.redirectUri) body.redirect_uri = options.redirectUri
  }
  const result = await request<{ access_token: string; token_type: string; email: string; provider: string }>("/oauth", {
    method: "POST",
    body: JSON.stringify(body),
  })
  return {
    accessToken: result.access_token,
    tokenType: result.token_type,
    email: result.email,
    provider: result.provider,
  }
}
