import NextAuth, { DefaultSession } from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from "./lib/prisma"
import bcrypt from "bcryptjs"

// ── Type augmentation ──────────────────────────────────────────────────────────

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
    } & DefaultSession["user"]
  }
  interface User {
    role?: string
  }
}

// ── Auth config ────────────────────────────────────────────────────────────────

const googleEnabled =
  !!process.env.GOOGLE_CLIENT_ID &&
  process.env.GOOGLE_CLIENT_ID !== "dummy-google-client-id" &&
  !!process.env.GOOGLE_CLIENT_SECRET &&
  process.env.GOOGLE_CLIENT_SECRET !== "dummy-google-client-secret"

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),

  providers: [
    ...(googleEnabled
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),

    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        try {
          const user = await prisma.user.findUnique({
            where: { email: String(credentials.email).toLowerCase() },
          })

          if (!user?.hashedPassword) return null

          const valid = await bcrypt.compare(
            String(credentials.password),
            user.hashedPassword
          )
          if (!valid) return null

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role,
          }
        } catch (err) {
          console.error("[auth] authorize error:", err)
          return null
        }
      },
    }),
  ],

  pages: {
    signIn: "/login",
    error: "/login",
  },

  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 }, // 30 days

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Persist id + role into the token on first sign-in
      if (user) {
        token.id = user.id
        token.role = user.role ?? "USER"
      }
      // Handle session update triggered by useSession().update()
      if (trigger === "update" && session?.user) {
        token.name = session.user.name
      }
      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = (token.role as string) ?? "USER"
      }
      return session
    },

    async signIn({ user, account }) {
      // For Google sign-ins: ensure the user gets a FREE subscription if new
      if (account?.provider === "google" && user.id) {
        try {
          const existing = await prisma.subscription.findUnique({
            where: { userId: user.id },
          })
          if (!existing) {
            const freePlan = await prisma.plan.findUnique({ where: { name: "FREE" } })
            if (freePlan) {
              await prisma.subscription.create({
                data: { userId: user.id, status: "active", planId: freePlan.id },
              })
            }
          }
        } catch (err) {
          console.error("[auth] signIn callback error:", err)
          // Don't block sign-in due to subscription creation failure
        }
      }
      return true
    },
  },

  // Trust the host header in development + behind proxies
  trustHost: true,
})
