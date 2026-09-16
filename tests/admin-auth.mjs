// Integration checks against a temporary local Next server; no database writes.
// Run: node tests/admin-auth.mjs
import assert from "node:assert/strict"
import { randomBytes, createHmac } from "node:crypto"
import { createRequire } from "node:module"
import { spawn, execFileSync } from "node:child_process"
import { createWriteStream } from "node:fs"
import { setTimeout as delay } from "node:timers/promises"

const origin = "http://localhost:3107"
const password = randomBytes(32).toString("hex")
const secret = randomBytes(32).toString("hex")
const unconfigured = process.argv.includes("--unconfigured")
const { encode } = createRequire(import.meta.url)("next-auth/jwt")
const log = createWriteStream("local-admin-auth-test.log")
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--webpack", "-p", "3107"], {
  env: { ...process.env, ADMIN_PASSWORD: unconfigured ? "" : password, NEXTAUTH_SECRET: secret, NEXTAUTH_URL: origin },
  stdio: ["ignore", "pipe", "pipe"],
})
server.stdout.pipe(log)
server.stderr.pipe(log)
let jar = new Map()
async function request(path, options = {}) {
  const response = await fetch(origin + path, { ...options, redirect: "manual", headers: {
    cookie: [...jar].map(([k, v]) => `${k}=${v}`).join("; "), ...options.headers,
  } })
  for (const cookie of response.headers.getSetCookie()) {
    const [pair] = cookie.split(";")
    const split = pair.indexOf("=")
    jar.set(pair.slice(0, split), pair.slice(split + 1))
  }
  return response
}
async function login(value) {
  const { csrfToken } = await (await request("/api/auth/csrf")).json()
  return request("/api/auth/callback/credentials", { method: "POST", headers: {
    "content-type": "application/x-www-form-urlencoded", origin,
  }, body: new URLSearchParams({ csrfToken, password: value, json: "true" }) })
}
try {
  let ready = false
  for (let i = 0; i < 90; i++) {
    try { if ((await request("/api/auth/csrf")).status === (unconfigured ? 503 : 200)) { ready = true; break } } catch {}
    await delay(1000)
  }
  assert.ok(ready, "Temporary server must start")
  for (const path of ["/", "/?view=admin"]) {
    const page = await request(path)
    assert.equal(page.status, 200, "Public and admin entry pages compile and load")
    assert.ok(!(await page.text()).includes(password), "Password never appears in HTML")
  }
  const writes = [
    ["POST", "/api/assets"], ["PUT", "/api/assets/test"], ["DELETE", "/api/assets/test"],
    ["POST", "/api/networks"], ["PUT", "/api/networks/test"],
    ["POST", "/api/protocols"], ["PUT", "/api/protocols/test"],
    ["POST", "/api/strategies"], ["PUT", "/api/strategies/test"], ["DELETE", "/api/strategies/test"],
    ["POST", "/api/strategies/test/observations"], ["POST", "/api/observations/simulate"],
    ["POST", "/api/strategies/test/revisions/test/restore"],
  ]
  for (const [method, path] of writes) assert.equal((await request(path, { method })).status, 401, path)
  for (const path of ["/api/strategies?status=ALL", "/api/strategies?status=DRAFT", "/api/strategies/test/revisions"]) {
    assert.equal((await request(path)).status, 401, path)
  }
  assert.equal((await request("/api/match", { method: "POST", headers: { "content-type": "application/json" }, body: "null" })).status, 400, "Public matching reaches validation without login")
  if (unconfigured) {
    assert.equal((await request("/api/auth/session")).status, 503)
    console.log("PASS: missing password fails closed; public matching remains accessible.")
  } else {
  assert.equal((await login("wrong-password")).status, 401)
  assert.equal((await (await request("/api/auth/session")).json()).user, undefined)
  const accepted = await login(password)
  assert.equal(accepted.status, 200)
  const cookies = accepted.headers.getSetCookie().join(";")
  assert.match(cookies, /HttpOnly/i)
  assert.match(cookies, /SameSite=Lax/i)
  assert.ok((await (await request("/api/auth/session")).json()).user)
  const invalidPayload = { method: "POST", headers: { "content-type": "application/json", origin }, body: "{}" }
  assert.equal((await request("/api/assets", invalidPayload)).status, 400, "Authenticated write reaches validation")
  assert.equal((await request("/api/assets", { ...invalidPayload, headers: { ...invalidPayload.headers, origin: "https://evil.example" } })).status, 403)
  assert.equal((await request("/api/assets", { method: "POST" })).status, 403)
  const validJar = new Map(jar)
  jar.set("next-auth.session-token", "tampered")
  assert.equal((await request("/api/assets", invalidPayload)).status, 401)
  jar = new Map(validJar)
  for (const [version, expiry] of [
    [createHmac("sha256", secret).update(password).digest("hex"), Date.now() - 1000],
    ["old-password-version", Date.now() + 60_000],
  ]) {
    jar.set("next-auth.session-token", await encode({ secret, token: { sub: "admin", passwordVersion: version, adminExpires: expiry } }))
    assert.equal((await request("/api/assets", invalidPayload)).status, 401, "Expired/rotated sessions rejected")
  }
  jar = new Map(validJar)
  const { csrfToken } = await (await request("/api/auth/csrf")).json()
  assert.equal((await request("/api/auth/signout", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ csrfToken, json: "true" }) })).status, 200)
  assert.equal((await request("/api/assets", invalidPayload)).status, 401)
  for (let i = 0; i < 10; i++) await login("wrong-password")
  assert.equal((await login(password)).status, 401, "Rate limit rejects further attempts")
  console.log("PASS: all write guards, private list/history, passwords, cookies, origin checks, tampering, expiry, rotation, logout and rate limiting.")
  }
} finally {
  if (process.platform === "win32") {
    try { execFileSync("taskkill", ["/pid", String(server.pid), "/T", "/F"], { stdio: "ignore" }) }
    catch { server.kill() } // The dev process may have already exited.
  }
  else server.kill("SIGTERM")
  log.end()
}
