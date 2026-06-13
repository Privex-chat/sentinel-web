/* next.config.ts */
import type { NextConfig } from "next"

// Optional build-time tightening:
//   NEXT_PUBLIC_API_ORIGIN — comma-separated list of allowed connect-src
//   origins (e.g. "https://sentinel.example.com,https://api.example.com").
//   When set, CSP's connect-src is restricted to 'self' + those origins
//   instead of the wide-open '*' default. Leave unset for "users can type any
//   URL into Settings" mode (local dev, desktop builds).
//
//   NEXT_PUBLIC_FRAME_ANCESTORS — comma-separated list of ancestors allowed
//   to embed the panel in an iframe. Defaults to 'self' (no third-party
//   embedding). Set this only if you intentionally embed the panel.
const connectExtras = (process.env.NEXT_PUBLIC_API_ORIGIN || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean)

const frameAncestors = (process.env.NEXT_PUBLIC_FRAME_ANCESTORS || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean)

const connectSrc = connectExtras.length > 0
  ? `connect-src 'self' ${connectExtras.join(" ")}`
  : "connect-src 'self' *"

const frameAncestorsDirective = frameAncestors.length > 0
  ? `frame-ancestors 'self' ${frameAncestors.join(" ")}`
  : "frame-ancestors 'self'"

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control",  value: "on" },
  { key: "X-Content-Type-Options",  value: "nosniff" },
  { key: "Referrer-Policy",         value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy",      value: "camera=(), microphone=(), geolocation=()" },
  // Strict-Transport-Security only makes sense over HTTPS – omit for local dev.
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js + Turbopack require these
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https://cdn.discordapp.com",
      "font-src 'self' https://fonts.gstatic.com",
      connectSrc,
      frameAncestorsDirective,
    ].join("; "),
  },
]

// Desktop build sets DESKTOP_BUILD=true to produce a static export.
// Normal builds (Vercel, dev) use standard SSR mode.
const isDesktop = process.env.DESKTOP_BUILD === "true"

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: isDesktop,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.discordapp.com",
        pathname: "/**",
      },
    ],
  },
  // Static export only for desktop packaging
  ...(isDesktop ? { output: "export" as const, trailingSlash: true } : {}),
  // Security headers only for server deployments (incompatible with static export)
  ...(!isDesktop
    ? {
        async headers() {
          return [
            {
              source: "/(.*)",
              headers: securityHeaders,
            },
          ]
        },
      }
    : {}),
}

export default nextConfig