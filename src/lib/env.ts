/**
 * Validates required environment variables at startup.
 * Missing critical vars are logged clearly to the console.
 * Call this from the root layout or a server startup file.
 */

interface EnvVar {
  key: string
  required: boolean
  description: string
}

const ENV_VARS: EnvVar[] = [
  { key: "DATABASE_URL", required: true, description: "PostgreSQL connection string" },
  { key: "AUTH_SECRET", required: true, description: "NextAuth v5 signing secret (run: openssl rand -base64 32)" },
  { key: "NEXTAUTH_URL", required: true, description: "App base URL (e.g. http://localhost:3000)" },
  { key: "GOOGLE_CLIENT_ID", required: false, description: "Google OAuth client ID (for Google sign-in)" },
  { key: "GOOGLE_CLIENT_SECRET", required: false, description: "Google OAuth client secret" },
  { key: "STRIPE_SECRET_KEY", required: false, description: "Stripe secret key (for billing)" },
  { key: "STRIPE_WEBHOOK_SECRET", required: false, description: "Stripe webhook signing secret" },
  { key: "OPENAI_API_KEY", required: false, description: "OpenAI API key (for AI features)" },
]

let validated = false

export function validateEnv() {
  if (validated) return
  validated = true

  const missing: EnvVar[] = []
  const warnings: EnvVar[] = []

  for (const v of ENV_VARS) {
    const val = process.env[v.key]
    if (!val || val.trim() === "") {
      if (v.required) missing.push(v)
      else warnings.push(v)
    }
  }

  if (missing.length > 0) {
    console.error("\n❌ MISSING REQUIRED ENVIRONMENT VARIABLES:")
    for (const v of missing) {
      console.error(`   ${v.key}: ${v.description}`)
    }
    console.error("\nAdd these to your .env file and restart the server.\n")
    if (process.env.NODE_ENV === "production") {
      throw new Error(`Missing required env vars: ${missing.map((v) => v.key).join(", ")}`)
    }
  }

  if (warnings.length > 0 && process.env.NODE_ENV !== "production") {
    console.warn("\n⚠️  Optional env vars not set (some features will be disabled):")
    for (const v of warnings) {
      console.warn(`   ${v.key}: ${v.description}`)
    }
    console.warn("")
  }
}

// Type-safe env accessors (throw at call site if missing)
export const env = {
  DATABASE_URL: () => {
    const v = process.env.DATABASE_URL
    if (!v) throw new Error("DATABASE_URL is not set")
    return v
  },
  AUTH_SECRET: () => process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "",
  NEXTAUTH_URL: () => process.env.NEXTAUTH_URL ?? "http://localhost:3000",
  STRIPE_SECRET_KEY: () => process.env.STRIPE_SECRET_KEY ?? "",
  STRIPE_WEBHOOK_SECRET: () => process.env.STRIPE_WEBHOOK_SECRET ?? "",
  OPENAI_API_KEY: () => process.env.OPENAI_API_KEY ?? "",
  GOOGLE_CLIENT_ID: () => process.env.GOOGLE_CLIENT_ID ?? "",
  GOOGLE_CLIENT_SECRET: () => process.env.GOOGLE_CLIENT_SECRET ?? "",
}
