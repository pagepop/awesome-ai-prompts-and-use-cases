import fs from 'node:fs'

export interface CatalogCategory {
  slug: string
  label: string
  order: number
  caseCount: number
}

export interface ResultAsset {
  kind: string
  url?: string
  title?: string
  coverUrl?: string
}

export interface UseCaseResult {
  kind: string
  title: string
  coverUrl?: string
  assets: ResultAsset[]
}

export interface UseCase {
  slug: string
  category: string
  title: string
  summary?: string
  originalPrompt: string
  websiteUrl: string
  updatedAt: string
  result: UseCaseResult
}

export interface Catalog {
  schemaVersion: number
  title: string
  description: string
  publisher: string
  website: string
  locale: string
  sourceUpdatedAt: string
  supportedModels: string[]
  categories: CatalogCategory[]
  cases: UseCase[]
}

export interface LocalizedCopy {
  tagline: string
  introduction: string
  bannerAlt: string
  galleryAlt: string
  galleryCta: string
  modelsHeading: string
  modelsIntroduction: string
  browseHeading: string
  browseIntroduction: string
  tableHeaders: string[]
  categoryReadmeLabel: string
  categoryGalleryLabel: string
  categoryGalleryHeading: string
  outputHeading: string
  outputLabels: Record<string, string>
  labelSeparator: string
  originalPromptHeading: string
  detailCta: string
  createCta: string
  previewAlt: string
  playVideoLabel: string
  howHeading: string
  howSteps: string[]
  howDescription: string
  contributingHeading: string
  contributingText: string
  dataHeading: string
  dataText: string
  rightsHeading: string
  rightsText: string
  footerTagline: string
  footerCta: string
}

export interface CategoryTranslation {
  label: string
  heading: string
}

export interface ChineseLocale {
  languageName: string
  readmeFile: string
  galleryImage: string
  title: string
  copy: LocalizedCopy
  categories: Record<string, CategoryTranslation>
  cases: Record<string, string>
}

export type JsonRecord = Record<string, unknown>

export function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

export function hasText(value: unknown): value is string {
  return typeof value === 'string' && Boolean(value.trim())
}

export function readJsonFile<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
