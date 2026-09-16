"use client"

import { useState, type FormEvent, type ReactNode } from "react"
import { SessionProvider, signIn, signOut, useSession } from "next-auth/react"
import { useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { useRouter } from "next/navigation"

function Gate({ children }: { children: ReactNode }) {
  const { data: session, status, update } = useSession()
  const queryClient = useQueryClient()
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  async function login(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError("")
    try {
      const providers = await fetch("/api/auth/providers", { cache: "no-store" })
      if (!providers.ok) throw new Error("Sign-in unavailable")
      const result = await signIn("credentials", { password, redirect: false })
      setPassword("")
      if (!result?.ok || result.error) {
        setError("Unable to sign in. Check your password and try again in a minute. If this persists, contact the site owner.")
      } else {
        queryClient.clear()
        await update()
      }
    } catch {
      setError("Sign-in is unavailable. Please try again or contact the site owner.")
    } finally { setBusy(false) }
  }

  if (status === "loading") return <div className="min-h-screen bg-gray-50 p-12 text-gray-700">Checking admin session…</div>
  if (session?.user) return <>
    <div className="flex justify-end border-b bg-white px-6 py-2 text-gray-900">
      <button disabled={busy} className="text-sm underline disabled:opacity-50" onClick={async () => {
        setBusy(true)
        try {
          await signOut({ redirect: false })
          queryClient.clear()
          router.replace("/?view=admin")
          setBusy(false)
        } catch { setError("Unable to sign out. Please try again."); setBusy(false) }
      }}>Log out</button>
      {error && <p role="alert" className="ml-4 text-red-700">{error}</p>}
    </div>
    {children}
  </>
  return <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 text-gray-900">
    <form onSubmit={login} className="w-full max-w-sm space-y-5 rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
      <div><p className="text-xs tracking-widest text-gray-500">MATRIX / ADMIN</p>
        <h1 className="mt-2 text-2xl font-semibold">Admin sign-in</h1>
        <p className="mt-2 text-sm text-gray-600">Enter the admin password to manage the archive.</p></div>
      <div><label htmlFor="admin-password" className="mb-2 block text-sm font-medium">Password</label>
        <input id="admin-password" type="password" autoComplete="current-password" required maxLength={1024}
          value={password} onChange={event => setPassword(event.target.value)} autoFocus
          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-emerald-600" /></div>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <button disabled={busy} className="w-full rounded-md bg-gray-900 px-4 py-2 text-white disabled:opacity-50">{busy ? "Signing in…" : "Sign in"}</button>
      <Link href="/" className="block text-center text-sm text-gray-600 underline">Back to the archive</Link>
    </form>
  </main>
}

export function AdminAuthGate({ children }: { children: ReactNode }) {
  return <SessionProvider refetchInterval={60} refetchOnWindowFocus><Gate>{children}</Gate></SessionProvider>
}
