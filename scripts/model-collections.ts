import path from 'node:path'

import { appendTracking } from './generate-category-readmes.ts'
import { hasText, isRecord, readJsonFile } from './types.ts'

export const fableRepositoryUrl = 'https://github.com/pagepop/awesome-fable5.5-prompts'
export const fableModelId = 'claude-fable-5-5'
export const fableFeaturedSlugs = [
  'fable55-the-moss-keeper',
  'fable55-the-last-page',
  'fable55-pelican-bicycle-svg',
] as const

export const localePrefixes = {
  'en-US': '',
  'zh-CN': '/zh-cn',
  'zh-TW': '/zh-tw',
  'ja-JP': '/jp',
  'ko-KR': '/ko',
  'es-ES': '/es',
  'fr-FR': '/fr',
  'de-DE': '/de',
  'pt-BR': '/pt-br',
} as const

export type ModelLocale = keyof typeof localePrefixes
export interface ModelCaseLocale {
  title: string
  description: string
  detailUrl: string
  topicUrl: string
}
export interface ModelCase {
  slug: string
  coverUrl: string
  videoUrl: string
  source: { url: string; authorName: string; authorUrl: string }
  locales: Record<ModelLocale, ModelCaseLocale>
}
export interface ModelCollections {
  schemaVersion: 1
  model: { id: typeof fableModelId; name: 'Claude Fable 5.5'; repositoryUrl: string }
  featuredSlugs: string[]
  cases: ModelCase[]
}

// These existing topics are registered in the website's public models.ts taxonomy.
export const modelTopics = [
  { id: fableModelId, name: 'Claude Fable 5.5' },
  { id: 'nano-banana-pro', name: 'Nano Banana Pro' },
  { id: 'gpt-image-2', name: 'GPT Image 2' },
  { id: 'seedance-2-0', name: 'Seedance 2.0' },
  { id: 'seedance-2-5', name: 'Seedance 2.5' },
  { id: 'gemini-3-pro', name: 'Gemini 3 Pro' },
] as const

export function websiteUrlForLocale(urlValue: string, locale: 'en' | 'zh'): string {
  const url = new URL(urlValue)
  if (url.origin !== 'https://www.pagepop.ai' || !/^\/use-cases(?:\/|$)/.test(url.pathname)) {
    throw new Error(`Unexpected canonical use-case URL: ${urlValue}`)
  }
  if (locale === 'zh') url.pathname = `/zh-cn${url.pathname}`
  return url.toString()
}

export function modelTopicUrl(id: string, locale: 'en' | 'zh'): string {
  return websiteUrlForLocale(`https://www.pagepop.ai/use-cases/models/${id}`, locale)
}

function assertFields(value: unknown, fields: string[], label: string): asserts value is Record<string, unknown> {
  if (!isRecord(value) || Object.keys(value).some((key) => !fields.includes(key)) ||
      fields.some((key) => !(key in value))) {
    throw new Error(`${label} must contain exactly: ${fields.join(', ')}`)
  }
}

function assertText(value: unknown, label: string): asserts value is string {
  if (!hasText(value)) throw new Error(`${label} must be a non-empty string.`)
}

function assertHttps(value: unknown, label: string): asserts value is string {
  assertText(value, label)
  const url = new URL(value)
  if (url.protocol !== 'https:' || url.username || url.password) {
    throw new Error(`${label} must be a public HTTPS URL.`)
  }
}

export function validateModelCollections(value: unknown): asserts value is ModelCollections {
  assertFields(value, ['schemaVersion', 'model', 'featuredSlugs', 'cases'], 'Model collections')
  if (value.schemaVersion !== 1) throw new Error('Unsupported model collections schemaVersion.')
  assertFields(value.model, ['id', 'name', 'repositoryUrl'], 'Model')
  if (value.model.id !== fableModelId || value.model.name !== 'Claude Fable 5.5' ||
      value.model.repositoryUrl !== fableRepositoryUrl) throw new Error('Unexpected Fable model identity.')
  if (JSON.stringify(value.featuredSlugs) !== JSON.stringify(fableFeaturedSlugs)) {
    throw new Error('Fable highlights must contain the three selected public cases in order.')
  }
  if (!Array.isArray(value.cases) || value.cases.length !== 14) {
    throw new Error('The Fable metadata index must contain all 14 public cases.')
  }
  const slugs = new Set<string>()
  for (const item of value.cases) {
    assertFields(item, ['slug', 'coverUrl', 'videoUrl', 'source', 'locales'], 'Model case')
    assertText(item.slug, 'Case slug')
    if (!/^fable55-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug) || slugs.has(item.slug)) {
      throw new Error(`Invalid or duplicate Fable case slug: ${item.slug}`)
    }
    slugs.add(item.slug)
    for (const key of ['coverUrl', 'videoUrl'] as const) {
      assertHttps(item[key], `${item.slug}.${key}`)
      const url = new URL(item[key])
      if (url.hostname !== 'agent-imagex.pagepop.cn' || !url.pathname.startsWith('/case-library-assets/content/') ||
          url.search || url.hash || !url.pathname.endsWith(key === 'videoUrl' ? '.mp4' : '.jpg')) {
        throw new Error(`${item.slug}.${key} must retain a stable PagePop CDN URL.`)
      }
    }
    assertFields(item.source, ['url', 'authorName', 'authorUrl'], `${item.slug}.source`)
    assertText(item.source.authorName, `${item.slug}.source.authorName`)
    assertHttps(item.source.url, `${item.slug}.source.url`)
    assertHttps(item.source.authorUrl, `${item.slug}.source.authorUrl`)
    assertFields(item.locales, Object.keys(localePrefixes), `${item.slug}.locales`)
    for (const [locale, prefix] of Object.entries(localePrefixes)) {
      const copy = item.locales[locale]
      assertFields(copy, ['title', 'description', 'detailUrl', 'topicUrl'], `${item.slug}.${locale}`)
      assertText(copy.title, `${item.slug}.${locale}.title`)
      assertText(copy.description, `${item.slug}.${locale}.description`)
      if (copy.detailUrl !== `https://www.pagepop.ai${prefix}/use-cases/${item.slug}` ||
          copy.topicUrl !== `https://www.pagepop.ai${prefix}/use-cases/models/${fableModelId}`) {
        throw new Error(`Incorrect localized website destinations for ${item.slug}.${locale}`)
      }
    }
  }
  for (const slug of fableFeaturedSlugs) {
    if (!slugs.has(slug)) throw new Error(`Missing featured Fable case: ${slug}`)
  }
}

export function readModelCollections(): ModelCollections {
  const value = readJsonFile<unknown>(path.resolve('data/model-collections.json'))
  validateModelCollections(value)
  return value
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export function renderModelDiscovery(locale: 'en' | 'zh', heading: string, introduction: string): string {
  const data = readModelCollections()
  const zh = locale === 'zh'
  const repoUrl = zh ? `${fableRepositoryUrl}/blob/main/README_zh-CN.md` : fableRepositoryUrl
  const navigation = modelTopics.map((model) =>
    `[${model.name}](${appendTracking(modelTopicUrl(model.id, locale), `model-${model.id}`)})`,
  ).join(' · ')
  const previousAnchor = zh ? 'pagepop-使用的模型' : 'models-used-by-pagepop'
  let markdown = `<a id="${previousAnchor}"></a>\n\n## ${heading}\n\n${introduction}\n\n${navigation}\n\n`
  markdown += `### ${zh ? 'Claude Fable 5.5 社区精选' : 'Claude Fable 5.5 community highlights'}\n\n`
  markdown += zh
    ? '探索社区作者创作的手绘动画、SVG 动效与视频案例，查看效果、提示词和原始来源。\n\n'
    : 'Explore hand-drawn animation, SVG motion and video examples from community creators. Each example credits its creator and links to the original post.\n\n'
  markdown += `**[${zh ? '查看全部 14 个案例与完整提示词' : 'Browse all 14 examples and complete prompts'}](${repoUrl})** · **[${zh ? '浏览官网 Fable 5.5 专题' : 'Explore the Fable 5.5 gallery'}](${appendTracking(modelTopicUrl(fableModelId, locale), 'fable-collection')})**\n\n`
  for (const slug of data.featuredSlugs) {
    const item = data.cases.find((entry) => entry.slug === slug)
    if (!item) throw new Error(`Missing Fable highlight: ${slug}`)
    const copy = item.locales[zh ? 'zh-CN' : 'en-US']
    const detailUrl = appendTracking(copy.detailUrl, `fable-case-${slug}`)
    markdown += `#### ${copy.title}\n\n<p align="center">\n  <a href="${detailUrl}"><img src="${item.coverUrl}" alt="${escapeHtml(copy.title)}" width="720"></a>\n</p>\n\n${copy.description}\n\n`
    markdown += `${zh ? '原作者' : 'Creator'}: ${escapeHtml(item.source.authorName)} · [${zh ? '原帖' : 'Original source'}](${item.source.url}) · [${zh ? '查看案例与提示词 →' : 'View example and prompt →'}](${detailUrl})\n\n`
  }
  return `${markdown}---\n\n`
}
