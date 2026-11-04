import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import type { Catalog, CatalogCategory, UseCase } from './types.ts'
import { hasText, isRecord, readJsonFile } from './types.ts'

const catalogPath = path.resolve('data/use-cases.json')
const previewVisibilityPath = path.resolve('data/preview-visibility.json')

interface PreviewVisibility {
  previewUrl: string
  visible: boolean
}

function readPreviewVisibility(): Map<string, PreviewVisibility> {
  const policy = readJsonFile<unknown>(previewVisibilityPath)
  if (!isRecord(policy) || policy.schemaVersion !== 1 || !hasText(policy.checkedAt) ||
      !Number.isFinite(Date.parse(policy.checkedAt)) || !hasText(policy.reason) || !Array.isArray(policy.previews) ||
      Object.keys(policy).some((key) => !['schemaVersion', 'checkedAt', 'reason', 'previews'].includes(key))) {
    throw new Error('Invalid required preview visibility policy: expected schemaVersion 1, checkedAt, reason and previews.')
  }
  const catalog = readJsonFile<Catalog>(catalogPath)
  if (policy.previews.length !== catalog.cases.length) {
    throw new Error('Preview visibility policy must explicitly cover every catalog case.')
  }
  const bySlug = new Map(catalog.cases.map((item) => [item.slug, item]))
  const visibility = new Map<string, PreviewVisibility>()
  for (const entry of policy.previews) {
    if (!isRecord(entry) || !hasText(entry.slug) || !hasText(entry.previewUrl) || typeof entry.visible !== 'boolean' ||
        Object.keys(entry).some((key) => !['slug', 'previewUrl', 'visible'].includes(key))) {
      throw new Error('Each preview visibility entry requires exactly slug, previewUrl and visible.')
    }
    const item = bySlug.get(entry.slug)
    if (!item || visibility.has(entry.slug) || previewUrl(item) !== entry.previewUrl) {
      throw new Error(`Unknown, duplicate or mismatched preview visibility entry: ${entry.slug}`)
    }
    visibility.set(entry.slug, { previewUrl: entry.previewUrl, visible: entry.visible })
  }
  return visibility
}

const previewVisibility = readPreviewVisibility()

export function isPreviewVisible(item: UseCase): boolean {
  const entry = previewVisibility.get(item.slug)
  if (!entry || entry.previewUrl !== previewUrl(item)) {
    throw new Error(`Missing or mismatched required preview visibility for ${item.slug}.`)
  }
  return entry.visible
}

export const categoryDirectoryBySlug: Readonly<Record<string, string>> = {
  video: 'video',
  'poster-and-flyer': 'posters-and-flyers',
  'image-editor': 'image-editing',
  'e-commerce': 'ecommerce',
  slides: 'presentations',
  'social-post': 'social-media',
}

export const publicCategorySlugs: ReadonlySet<string> = new Set([
  'video',
  'poster-and-flyer',
  'image-editor',
  'e-commerce',
  'slides',
  'social-post',
])

export function isPublishedCategory(category: CatalogCategory): boolean {
  return publicCategorySlugs.has(category.slug)
}

export function isPublishedUseCase(item: UseCase): boolean {
  return publicCategorySlugs.has(item.category)
}

interface CategoryPresentation {
  emoji: string
  heading: string
}

const categoryPresentation: Readonly<Partial<Record<string, CategoryPresentation>>> = {
  video: { emoji: '🎬', heading: 'AI Video Prompts & Use Cases' },
  'poster-and-flyer': { emoji: '🪧', heading: 'Poster & Flyer Prompts & Use Cases' },
  'image-editor': { emoji: '🪄', heading: 'AI Image Editing Prompts & Use Cases' },
  'e-commerce': { emoji: '🛍️', heading: 'E-commerce Creative Prompts & Use Cases' },
  slides: { emoji: '📊', heading: 'Presentation Prompts & Use Cases' },
  'social-post': { emoji: '📱', heading: 'Social Media Prompts & Use Cases' },
}

const outputLabels: Readonly<Record<string, string>> = {
  image: 'Image',
  video: 'Video',
  slides: 'Presentation',
}

export function appendTracking(urlValue: string, content: string): string {
  const url = new URL(urlValue)
  url.searchParams.set('utm_source', 'github')
  url.searchParams.set('utm_medium', 'referral')
  url.searchParams.set('utm_campaign', 'awesome-ai-prompts-and-use-cases')
  url.searchParams.set('utm_content', content)
  return url.toString()
}

function markdownFence(value: string): string {
  const runs = value.match(/`+/g) || []
  const longest = Math.max(3, ...runs.map((run) => run.length + 1))
  return '`'.repeat(longest)
}

function escapeAlt(value: string): string {
  return value.replace(/[\[\]]/g, '').replace(/"/g, '&quot;')
}

export function previewUrl(item: UseCase): string {
  return item.result.coverUrl || item.result.assets.find((asset) => asset.url)?.url || ''
}

export function videoUrl(item: UseCase): string {
  return item.result.assets.find((asset) => asset.kind === 'video' && asset.url)?.url || ''
}

interface ResultPreviewOptions {
  altText?: string
  playVideoLabel?: string
}

export function renderResultPreview(
  item: UseCase,
  detailUrl: string,
  options: ResultPreviewOptions = {},
): string {
  const preview = previewUrl(item)
  if (!preview) throw new Error(`Missing required public preview URL for ${item.slug}.`)

  const resultKindLabel = outputLabels[item.result.kind] || item.result.kind
  const alt = escapeAlt(options.altText || `${item.title} — generated ${resultKindLabel} result`)
  const playVideoLabel = options.playVideoLabel || 'Watch'
  const visible = isPreviewVisible(item)
  const image = visible ? `<a href="${detailUrl}"><img src="${preview}" alt="${alt}" width="720"></a>` : ''
  const playLink = item.result.kind === 'video'
    ? `${visible ? '\n  <br>\n  ' : ''}<strong><a href="${detailUrl}">${playVideoLabel}</a></strong>`
    : ''

  return image || playLink ? `<p align="center">\n  ${image}${playLink}\n</p>\n\n` : ''
}

export function categoryReadmePath(categorySlug: string): string {
  const directory = categoryDirectoryBySlug[categorySlug]
  if (!directory) throw new Error(`No category README directory configured for ${categorySlug}.`)
  return path.resolve('prompts', directory, 'README.md')
}

export function renderCategoryReadme(catalog: Catalog, category: CatalogCategory): string {
  const presentation = categoryPresentation[category.slug]
  if (!presentation) {
    throw new Error(`No category README presentation configured for ${category.slug}.`)
  }

  const categoryCases = catalog.cases.filter(
    (item) => isPublishedUseCase(item) && item.category === category.slug,
  )
  const galleryUrl = appendTracking(
    `https://www.pagepop.ai/use-cases/categories/${category.slug}`,
    `category-${category.slug}`,
  )

  let markdown = `<!-- This file is generated by scripts/generate-category-readmes.ts. Do not edit it manually. -->

[← Browse all prompts and use cases](../../README.md)

# ${presentation.emoji} ${presentation.heading}

> Real-world ${category.label.toLowerCase()} requests, their complete original prompts, and the finished work created with PagePop.

**[Browse the visual gallery on PagePop →](${galleryUrl})**

Every prompt below is reproduced in full. Select a preview or the complete-process link to inspect the public result and creation flow on PagePop.

---

`

  categoryCases.forEach((item) => {
    const detailUrl = appendTracking(item.websiteUrl, `case-${item.slug}`)
    const createUrl = appendTracking(item.websiteUrl, `create-${item.slug}`)
    const fence = markdownFence(item.originalPrompt)
    const resultKindLabel = outputLabels[item.result.kind] || item.result.kind

    markdown += `## ${item.title}\n\n`
    markdown += renderResultPreview(item, detailUrl)
    markdown += `**Output:** ${resultKindLabel}\n\n`
    markdown += `### Original prompt\n\n${fence}text\n${item.originalPrompt}\n${fence}\n\n`
    markdown += `**[View the complete creative process →](${detailUrl})** · **[Create in PagePop →](${createUrl})**\n\n---\n\n`
  })

  markdown += `<p align="center">
  <a href="../../README.md"><strong>Browse all prompt categories</strong></a> ·
  <a href="${galleryUrl}"><strong>Explore this gallery on PagePop →</strong></a>
</p>
`

  return markdown
}

export function generateCategoryReadmes(catalog: Catalog): string[] {
  const writtenPaths: string[] = []

  for (const category of catalog.categories.filter(isPublishedCategory)) {
    const outputPath = categoryReadmePath(category.slug)
    fs.mkdirSync(path.dirname(outputPath), { recursive: true })
    fs.writeFileSync(outputPath, renderCategoryReadme(catalog, category), 'utf8')
    writtenPaths.push(outputPath)
  }

  return writtenPaths
}

const isMain = Boolean(
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url),
)

if (isMain) {
  const catalog = readJsonFile<Catalog>(catalogPath)
  generateCategoryReadmes(catalog)
  console.log('Generated public category README files with complete prompts.')
}
