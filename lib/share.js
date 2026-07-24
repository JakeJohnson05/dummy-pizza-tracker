import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { getTrackerState } from './tracker.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const indexTemplatePath = path.join(__dirname, '..', 'public', 'index.html')

let cachedIndexTemplate = null

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function getPublicUrl(req) {
  const configured = process.env.PUBLIC_URL?.replace(/\/$/, '') || process.env.RENDER_EXTERNAL_URL?.replace(/\/$/, '')

  if (configured) {
    return configured
  }

  const proto = req.get('x-forwarded-proto')?.split(',')[0]?.trim() || req.protocol
  const host = req.get('x-forwarded-host') || req.get('host')

  return `${proto}://${host}`
}

export function buildShareContent(tracker, baseUrl) {
  const state = tracker.state
  const title = `${state.emoji} Pizza Tracker · ${state.shortLabel}`
  const description = `${state.message} ETA: ${state.eta}.`
  const pageUrl = `${baseUrl}/`
  const imageUrl = `${baseUrl}/og-image.svg?v=${encodeURIComponent(tracker.stateId)}`

  return { title, description, pageUrl, imageUrl, state }
}

export function buildShareMetaTags(share) {
  return `
    <meta name="description" content="${escapeHtml(share.description)}" />
    <meta name="theme-color" content="#1a1410" />
    <link rel="canonical" href="${escapeHtml(share.pageUrl)}" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="apple-touch-icon" href="/og-image.svg" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Pizza Tracker" />
    <meta property="og:title" content="${escapeHtml(share.title)}" />
    <meta property="og:description" content="${escapeHtml(share.description)}" />
    <meta property="og:url" content="${escapeHtml(share.pageUrl)}" />
    <meta property="og:image" content="${escapeHtml(share.imageUrl)}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${escapeHtml(share.title)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(share.title)}" />
    <meta name="twitter:description" content="${escapeHtml(share.description)}" />
    <meta name="twitter:image" content="${escapeHtml(share.imageUrl)}" />
    <meta name="twitter:image:alt" content="${escapeHtml(share.title)}" />
  `.trim()
}

export function buildOgImageSvg(tracker) {
  const state = tracker.state
  const progress = Math.max(0, Math.min(100, state.progress))
  const progressWidth = (1040 * progress) / 100

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="${escapeXml(`Pizza Tracker - ${state.label}`)}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#120e0b" />
      <stop offset="45%" stop-color="#1a1410" />
      <stop offset="100%" stop-color="#0f0c09" />
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ff6b35" />
      <stop offset="100%" stop-color="#ffb347" />
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="35%" r="55%">
      <stop offset="0%" stop-color="#ff6b35" stop-opacity="0.22" />
      <stop offset="100%" stop-color="#ff6b35" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)" />
  <rect width="1200" height="630" fill="url(#glow)" />
  <rect x="56" y="56" width="1088" height="518" rx="28" fill="#2f241b" stroke="rgba(255,214,170,0.14)" stroke-width="2" />
  <text x="96" y="118" fill="#ffb347" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="24" font-weight="700" letter-spacing="4">LIVE TRACKER</text>
  <text x="96" y="188" fill="#fff7ef" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="58" font-weight="700">Pizza Tracker</text>
  <text x="1124" y="188" text-anchor="end" font-size="72">${escapeXml(state.emoji)}</text>
  <text x="96" y="268" fill="#c9b09a" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="34" font-weight="600">${escapeXml(state.label)}</text>
  <text x="96" y="322" fill="#fff7ef" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="28">${escapeXml(state.message)}</text>
  <rect x="96" y="372" width="1040" height="18" rx="9" fill="rgba(255,255,255,0.08)" />
  <rect x="96" y="372" width="${progressWidth.toFixed(1)}" height="18" rx="9" fill="url(#accent)" />
  <text x="96" y="448" fill="#ffb347" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="24" font-weight="700">ETA ${escapeXml(state.eta)}</text>
  <text x="1104" y="448" text-anchor="end" fill="#c9b09a" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="24">${progress}% complete</text>
  <text x="96" y="520" fill="#c9b09a" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="22">Order #8472 · The scenic route with obligatory snacks and a Midwestern goodbye</text>
</svg>`
}

async function getIndexTemplate() {
  if (!cachedIndexTemplate) {
    cachedIndexTemplate = await fs.readFile(indexTemplatePath, 'utf8')
  }

  return cachedIndexTemplate
}

export async function renderIndexHtml(share) {
  const template = await getIndexTemplate()
  const metaTags = buildShareMetaTags(share)
  const title = escapeHtml(share.title)

  return template
    .replace('<!-- share-meta -->', metaTags)
    .replace('<title>Pizza Tracker</title>', `<title>${title}</title>`)
}

export async function getSharePayload(req) {
  const tracker = await getTrackerState()
  const baseUrl = getPublicUrl(req)
  const share = buildShareContent(tracker, baseUrl)

  return { tracker, share }
}
