"use client"

/**
 * Client-side PostHog wrapper.
 * Lazy-initialises on first call. No-ops without NEXT_PUBLIC_POSTHOG_KEY.
 */
import posthog from "posthog-js"

let initialised = false

function init() {
  if (initialised) return
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  if (!key || typeof window === "undefined") return
  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com",
    capture_pageview: false, // We track route changes manually
    capture_pageleave: true,
    autocapture: false,
    persistence: "localStorage",
  })
  initialised = true
}

export function trackClient(event: string, props: Record<string, unknown> = {}) {
  init()
  if (!initialised) return
  posthog.capture(event, props)
}

export function identifyClient(userId: string, traits: Record<string, unknown> = {}) {
  init()
  if (!initialised) return
  posthog.identify(userId, traits)
}

export function trackPageview(path: string) {
  init()
  if (!initialised) return
  posthog.capture("$pageview", { $current_url: path })
}

export function resetClient() {
  if (initialised) posthog.reset()
}
