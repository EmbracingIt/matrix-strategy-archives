import NextAuth from "next-auth"
import { NextResponse } from "next/server"
import { authConfigured, authOptions } from "@/lib/server/admin-auth"

const handler = NextAuth(authOptions)
const guardedHandler: typeof handler = (...args) => {
  if (!authConfigured()) {
    return NextResponse.json({ error: "Admin sign-in is not configured. Contact the site owner." }, { status: 503 })
  }
  return handler(...args)
}
export { guardedHandler as GET, guardedHandler as POST }
