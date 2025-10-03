"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google"
import { Particles } from "@/components/ui/particles"
import { loginUser, oauthSignIn, registerUser, verifyEmailToken } from "@/lib/auth"

declare global {
  interface Window {
    AppleID?: {
      auth: {
        init: (options: Record<string, unknown>) => void
        signIn: () => Promise<{
          authorization?: { id_token?: string; code?: string }
        }>
      }
    }
  }
}

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""
const appleClientId = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID || ""
const appleRedirectUri = process.env.NEXT_PUBLIC_APPLE_REDIRECT_URI || ""

function GoogleButton({
  onAuth,
  setError,
}: {
  onAuth: (payload: { token: string; tokenType: "id_token" | "access_token" }) => Promise<void>
  setError: (msg: string) => void
}) {
  const login = useGoogleLogin({
    flow: "implicit",
    scope: "openid email profile",
    prompt: "select_account",
    onSuccess: async (tokenResponse) => {
      try {
        const idToken = (tokenResponse as unknown as { id_token?: string }).id_token
        if (idToken) {
          await onAuth({ token: idToken, tokenType: "id_token" })
          return
        }
        if (tokenResponse.access_token) {
          await onAuth({ token: tokenResponse.access_token, tokenType: "access_token" })
          return
        }
        setError("Google login did not return an access or ID token")
      } catch (err: any) {
        setError(err?.message || "Google login failed")
      }
    },
    onError: () => setError("Google login failed"),
  })

  return (
    <button
      type="button"
      onClick={() => login()}
      className="flex items-center justify-center gap-3 rounded-full border border-slate-400 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-slate-900 hover:bg-slate-900 hover:text-white dark:border-slate-600 dark:text-white dark:hover:bg-white dark:hover:text-black"
    >
      <svg className="h-4 w-4" viewBox="0 0 48 48" aria-hidden>
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12
	 c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24
	 c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657
	 C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36
	 c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571
	 c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
      </svg>
      <span>Log in with Google</span>
    </button>
  )
}

function AppleButton({
  onResult,
  disabled,
  setError,
}: {
  onResult: (payload: { token?: string; code?: string }) => Promise<void>
  disabled: boolean
  setError: (msg: string) => void
}) {
  const handleClick = async () => {
    if (disabled) return
    try {
      if (typeof window === "undefined" || !window.AppleID?.auth) {
        setError("Apple sign-in not available. Check configuration.")
        return
      }
      const response = await window.AppleID.auth.signIn()
      const idToken = response?.authorization?.id_token
      const code = response?.authorization?.code
      if (idToken) {
        await onResult({ token: idToken })
      } else if (code) {
        await onResult({ code })
      } else {
        setError("Apple sign-in did not return credentials")
      }
    } catch (err: any) {
      if (err?.error === "popup_closed_by_user") {
        return
      }
      setError(err?.message || "Apple sign-in failed")
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className="flex items-center justify-center gap-2 rounded-full bg-black px-4 py-2 text-sm font-semibold text-white transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black"
    >
      <span className="text-lg"></span>
      <span>{disabled ? "Apple setup required" : "Log in with Apple"}</span>
    </button>
  )
}

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [verificationToken, setVerificationToken] = useState<string>("")
  const [showVerification, setShowVerification] = useState(false)
  const [loading, setLoading] = useState(false)

  const canUseGoogle = Boolean(googleClientId)
  const canUseApple = Boolean(appleClientId && appleRedirectUri)

  useEffect(() => {
    if (!canUseApple || typeof window === "undefined") return

    const initApple = () => {
      try {
        window.AppleID?.auth.init({
          clientId: appleClientId,
          scope: "name email",
          redirectURI: appleRedirectUri,
          usePopup: true,
        })
      } catch (err) {
        console.error("Apple sign-in init failed", err)
      }
    }

    const existing = document.getElementById("apple-signin-sdk") as HTMLScriptElement | null
    if (existing) {
      if (window.AppleID?.auth) {
        initApple()
      } else {
        existing.addEventListener("load", initApple, { once: true })
      }
      return () => existing.removeEventListener("load", initApple)
    }

    const script = document.createElement("script")
    script.id = "apple-signin-sdk"
    script.src = "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js"
    script.async = true
    script.onload = initApple
    script.onerror = () => console.error("Failed to load Apple sign-in script")
    document.body.appendChild(script)
    return () => {
      script.removeEventListener("load", initApple)
    }
  }, [canUseApple])

  const resetMessages = () => {
    setError(null)
    setSuccess(null)
  }

  const handleSubmit = async (evt: React.FormEvent<HTMLFormElement>) => {
    evt.preventDefault()
    resetMessages()
    setLoading(true)
    try {
      if (mode === "login") {
        const result = await loginUser({ email, password })
        setSuccess(`Logged in! Token: ${result.accessToken.slice(0, 24)}...`)
      } else {
        const result = await registerUser({ email, password, displayName })
        setSuccess(result.message)
        setVerificationToken("")
        setShowVerification(true)
      }
    } catch (err: any) {
      setError(err?.message || "Request failed")
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    if (!verificationToken) return
    resetMessages()
    setLoading(true)
    try {
      const res = await verifyEmailToken(verificationToken)
      setSuccess(res.message)
      setMode("login")
      setShowVerification(false)
      setVerificationToken("")
      setPassword("")
    } catch (err: any) {
      setError(err?.message || "Verification failed")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async ({ token, tokenType }: { token: string; tokenType: "id_token" | "access_token" }) => {
    resetMessages()
    const res = await oauthSignIn("google", { token, tokenType })
    setSuccess(`Google account linked for ${res.email}`)
  }

  const handleApple = async ({ token, code }: { token?: string; code?: string }) => {
    resetMessages()
    if (token) {
      const res = await oauthSignIn("apple", { token })
      setSuccess(`Apple account linked for ${res.email}`)
      return
    }
    if (code) {
      setError("Apple sign-in returned an authorization code but no identity token. Update your Apple configuration to include the email scope.")
      return
    }
    setError("Apple sign-in did not return credentials")
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-50 dark:bg-black">
      <Particles className="absolute inset-0" quantity={100} ease={70} color="#94a3b8" />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-4 py-16">
        <header className="absolute left-0 right-0 top-10 flex w-full justify-between px-6 text-sm font-semibold text-slate-600 dark:text-slate-300">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-current px-4 py-1 transition hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black"
          >
            <span aria-hidden>←</span>
            <span>Home</span>
          </Link>
          <Link
            href="/gallery"
            className="hidden items-center gap-2 rounded-full px-4 py-1 underline underline-offset-4 hover:text-black dark:hover:text-white md:inline-flex"
          >
            Gallery
          </Link>
        </header>
        <div className="w-full max-w-4xl rounded-3xl bg-white/90 shadow-2xl ring-1 ring-black/5 backdrop-blur dark:bg-zinc-900/80 dark:ring-white/10">
          <div className="grid gap-10 p-10 md:grid-cols-[1.1fr_1fr]">
            <section>
              <p className="text-sm font-semibold uppercase tracking-wide text-teal-600">Need for Wheels</p>
              <h1 className="mt-2 text-3xl font-bold">Welcome back</h1>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Sign in with your favorite provider or use email and password. New accounts require email confirmation.
              </p>
              <div className="mt-6 flex flex-col gap-3">
                {canUseGoogle ? (
                  <GoogleOAuthProvider clientId={googleClientId}>
                    <GoogleButton onAuth={handleGoogle} setError={setError} />
                  </GoogleOAuthProvider>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="flex items-center justify-center gap-3 rounded-full border border-dashed border-slate-400 px-4 py-2 text-sm font-semibold text-slate-400"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 48 48" aria-hidden>
                      <path fill="#BDBDBD" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12
	 c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24
	 c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                    </svg>
                    <span>Google sign-in unavailable</span>
                  </button>
                )}
                <AppleButton onResult={handleApple} disabled={!canUseApple} setError={setError} />
              </div>
              <div className="mt-8 rounded-2xl bg-slate-100/70 p-6 text-sm text-slate-600 dark:bg-zinc-800/80 dark:text-slate-300">
                <p className="font-semibold text-slate-900 dark:text-white">How email confirmation works</p>
                <ol className="mt-3 list-decimal space-y-2 pl-5">
                  <li>Register with your email address.</li>
                  <li>Check your inbox for the verification link (or use the token shown here in development).</li>
                  <li>Paste the verification token below to activate your account.</li>
                </ol>
              </div>
            </section>
            <section className="flex flex-col justify-between gap-6">
              <div>
                <div className="flex items-center justify-between text-sm font-semibold text-slate-500 dark:text-slate-300">
                  <button
                    type="button"
                    onClick={() => {
                      setMode("login")
                      resetMessages()
                      setShowVerification(false)
                    }}
                    className={`transition ${mode === "login" ? "text-black dark:text-white" : "hover:text-black/70 dark:hover:text-white/70"}`}
                  >
                    Log in
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("register")
                      resetMessages()
                      setShowVerification(false)
                      setVerificationToken("")
                    }}
                    className={`transition ${mode === "register" ? "text-black dark:text-white" : "hover:text-black/70 dark:hover:text-white/70"}`}
                  >
                    Create account
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
                  {mode === "register" && (
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Name</label>
                      <input
                        value={displayName}
                        onChange={(evt) => setDisplayName(evt.target.value)}
                        type="text"
                        placeholder="Your name"
                        className="rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-900 outline-none ring-teal-500 transition focus:ring-2 dark:border-slate-700 dark:bg-zinc-900 dark:text-white"
                      />
                    </div>
                  )}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</label>
                    <input
                      value={email}
                      onChange={(evt) => setEmail(evt.target.value)}
                      type="email"
                      placeholder="Email"
                      required
                      className="rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-900 outline-none ring-teal-500 transition focus:ring-2 dark:border-slate-700 dark:bg-zinc-900 dark:text-white"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Password</label>
                    <input
                      value={password}
                      onChange={(evt) => setPassword(evt.target.value)}
                      type="password"
                      placeholder="Password"
                      minLength={8}
                      required
                      className="rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-900 outline-none ring-teal-500 transition focus:ring-2 dark:border-slate-700 dark:bg-zinc-900 dark:text-white"
                    />
                  </div>
                  {mode === "login" && (
                    <p className="text-right text-xs font-semibold text-slate-500 underline underline-offset-2 hover:text-slate-700 dark:text-slate-300 dark:hover:text-white">
                      Forgot password?
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-2 rounded-full bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-teal-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? "Please wait..." : mode === "login" ? "Log in" : "Create account"}
                  </button>
                </form>
              </div>
              {mode === "register" && !showVerification && (
                <button
                  type="button"
                  onClick={() => setShowVerification(true)}
                  className="rounded-full border border-teal-500 px-4 py-2 text-xs font-semibold text-teal-600 transition hover:bg-teal-50 dark:hover:bg-zinc-800"
                >
                  Have a verification token?
                </button>
              )}
              {showVerification && (
                <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-300">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-slate-700 dark:text-white">Verify email token</p>
                    {mode === "register" && (
                      <button
                        type="button"
                        onClick={() => setShowVerification(false)}
                        className="text-[11px] font-semibold text-slate-500 underline underline-offset-2 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white"
                      >
                        Hide
                      </button>
                    )}
                  </div>
                  <p className="mt-1">Enter the code we emailed you to activate your account.</p>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <input
                      value={verificationToken}
                      onChange={(evt) => setVerificationToken(evt.target.value)}
                      placeholder="Verification token"
                      className="flex-1 rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-900 outline-none ring-teal-500 transition focus:ring-2 dark:border-slate-700 dark:bg-zinc-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={handleVerify}
                      className="rounded-full border border-teal-500 px-4 py-2 text-xs font-semibold text-teal-600 transition hover:bg-teal-50 dark:hover:bg-zinc-800"
                    >
                      Verify
                    </button>
                  </div>
                </div>
              )}
              {(error || success) && (
                <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 text-sm dark:border-zinc-700 dark:bg-zinc-800/80">
                  {error && <p className="text-red-600 dark:text-red-400">{error}</p>}
                  {success && <p className="text-emerald-600 dark:text-emerald-400">{success}</p>}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}
