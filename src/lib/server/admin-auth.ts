import { createHash, createHmac, timingSafeEqual } from "node:crypto"
import { getServerSession, type NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { headers } from "next/headers"
import { NextResponse } from "next/server"

export function authConfigured() {
  if (!process.env.ADMIN_PASSWORD || !process.env.NEXTAUTH_SECRET || !process.env.NEXTAUTH_URL) return false
  try {
    const url = new URL(process.env.NEXTAUTH_URL)
    return process.env.NODE_ENV === "production"
      ? url.protocol === "https:"
      : ["http:", "https:"].includes(url.protocol)
  } catch { return false }
}

function passwordVersion() {
  return createHmac("sha256", process.env.NEXTAUTH_SECRET ?? "")
    .update(process.env.ADMIN_PASSWORD ?? "").digest("hex")
}

// One shared administrator account: limit guesses across this server process.
let attempts = 0
let resetAt = 0
export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  useSecureCookies: process.env.NODE_ENV === "production",
  pages: { signIn: "/?view=admin" },
  providers: [CredentialsProvider({
    name: "Admin password",
    credentials: { password: { label: "Password", type: "password" } },
    async authorize(credentials) {
      if (!authConfigured()) return null
      if (Date.now() >= resetAt) { attempts = 0; resetAt = Date.now() + 60_000 }
      if (++attempts > 10) return null
      const password = credentials?.password
      if (!password || password.length > 1024) return null
      const digest = (value: string) => createHash("sha256").update(value).digest()
      if (!timingSafeEqual(digest(password), digest(process.env.ADMIN_PASSWORD!))) return null
      return { id: "admin", name: "Administrator" }
    },
  })],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.passwordVersion = passwordVersion()
        token.adminExpires = Date.now() + 8 * 60 * 60 * 1000
      }
      if (!authConfigured() || token.passwordVersion !== passwordVersion() ||
          typeof token.adminExpires !== "number" || Date.now() >= token.adminExpires) return {}
      return token
    },
    async session({ session, token }) {
      // A revoked token must never expose an authenticated user.
      session.user = token.sub === "admin" ? { name: "Administrator" } : undefined
      return session
    },
  },
}

export async function isAdmin() {
  if (!authConfigured()) return false
  return Boolean((await getServerSession(authOptions))?.user)
}

export async function requireAdmin(write = false) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Please sign in to administer the archive." }, { status: 401 })
  }
  if (write) {
    const requestHeaders = await headers()
    const origin = requestHeaders.get("origin")
    const expected = process.env.NEXTAUTH_URL
    // Require an explicit same-origin browser request for cookie-authenticated writes.
    if (!expected || !origin || origin !== new URL(expected).origin) {
      return NextResponse.json({ error: "Invalid request origin." }, { status: 403 })
    }
  }
  return null
}
