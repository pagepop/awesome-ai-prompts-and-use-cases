import fs from 'node:fs'
import path from 'node:path'
import {
  appendTracking,
  categoryReadmePath,
  previewUrl,
  renderCategoryReadme,
} from './generate-category-readmes.mjs'

const catalogPath = path.resolve('data/use-cases.json')
const readmePath = path.resolve('README.md')
const bannerPath = path.resolve('assets/repository-banner.png')
const socialPreviewPath = path.resolve('assets/social-preview.png')
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'))
const readme = fs.readFileSync(readmePath, 'utf8')
const readmeBytes = Buffer.byteLength(readme)
const errors = []
const allowedCategories = new Set(catalog.categories.map((category) => category.slug))
const slugs = new Set()
const obviousEmailPattern = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i
const obviousPhonePattern = /(?:\+?\d[\d ()-]{7,}\d)/
const expectedBannerReference =
  '<img src="assets/repository-banner.png" alt="Awesome AI Creative Prompts & Real-World Use Cases by PagePop" width="1200">'

function readPngDimensions(filePath) {
  if (!fs.existsSync(filePath)) return null
  const header = fs.readFileSync(filePath).subarray(0, 24)
  const pngSignature = '89504e470d0a1a0a'
  if (header.length < 24 || header.subarray(0, 8).toString('hex') !== pngSignature) return null
  return {
    width: header.readUInt32BE(16),
    height: header.readUInt32BE(20),
  }
}

if (catalog.cases.length !== 78) {
  errors.push(`Expected 78 published use cases, received ${catalog.cases.length}.`)
}

if (catalog.categories.length !== 7) {
  errors.push(`Expected 7 public prompt categories, received ${catalog.categories.length}.`)
}

if (readmeBytes >= 450 * 1024) {
  errors.push(`README.md is ${readmeBytes} bytes; keep it below the 450 KiB safety budget.`)
}

if (!fs.existsSync(bannerPath)) {
  errors.push('Missing local repository banner: assets/repository-banner.png.')
}

const bannerDimensions = readPngDimensions(bannerPath)
if (!bannerDimensions || bannerDimensions.width < 1200 || bannerDimensions.width / bannerDimensions.height < 2) {
  errors.push('Repository banner must be a valid wide PNG at least 1200 pixels across.')
}

const socialPreviewDimensions = readPngDimensions(socialPreviewPath)
if (
  !socialPreviewDimensions ||
  socialPreviewDimensions.width !== 1280 ||
  socialPreviewDimensions.height !== 640
) {
  errors.push('GitHub social preview must be a valid 1280×640 PNG at assets/social-preview.png.')
}

if (!readme.includes(expectedBannerReference)) {
  errors.push('README.md is missing the expected local repository banner reference and alt text.')
}

if (
  !readme.includes(
    'https://www.pagepop.ai/use-cases?utm_source=github&utm_medium=referral&utm_campaign=awesome-ai-prompts-and-use-cases&utm_content=repository-banner',
  )
) {
  errors.push('README.md repository banner is missing the tracked PagePop Hub link.')
}

const forbiddenPublicKeys = [
  'conversation_id',
  'conversationId',
  'msg_id',
  'msgId',
  'chat_id',
  'chatId',
  'run_id',
  'runId',
  'tool_common',
  'think_tool',
  'manual_config',
  'manualConfig',
]

const serializedCatalog = JSON.stringify(catalog)
for (const key of forbiddenPublicKeys) {
  if (serializedCatalog.includes(key)) errors.push(`Public catalog contains forbidden key or marker: ${key}`)
}

for (const item of catalog.cases) {
  if (!item.slug || !item.title || !item.originalPrompt || !item.websiteUrl) {
    errors.push(`Use case ${item.slug || '(missing slug)'} is missing a required field.`)
  }
  if (slugs.has(item.slug)) errors.push(`Duplicate slug: ${item.slug}`)
  slugs.add(item.slug)
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug)) {
    errors.push(`Use case has an unsafe public slug: ${item.slug}`)
  }
  if (!allowedCategories.has(item.category)) errors.push(`Unknown category for ${item.slug}: ${item.category}`)
  if (!item.websiteUrl.startsWith('https://www.pagepop.ai/use-cases/')) {
    errors.push(`Unexpected website URL for ${item.slug}: ${item.websiteUrl}`)
  }
  const rootDetailUrl = appendTracking(item.websiteUrl, `case-${item.slug}`)
  const rootCreateUrl = appendTracking(item.websiteUrl, `create-${item.slug}`)
  if (!readme.includes(rootDetailUrl)) errors.push(`README is missing the tracked detail link for ${item.slug}.`)
  if (!readme.includes(rootCreateUrl)) errors.push(`README is missing the tracked create link for ${item.slug}.`)
  if (!readme.includes(item.originalPrompt)) errors.push(`README is missing the full prompt for ${item.slug}.`)

  const publicText = [item.title, item.summary, item.originalPrompt].filter(Boolean).join('\n')
  if (obviousEmailPattern.test(publicText) || obviousPhonePattern.test(publicText)) {
    errors.push(`Use case ${item.slug} contains an obvious email address or phone-number pattern.`)
  }

  const preview = previewUrl(item)
  if (!preview) {
    errors.push(`Use case ${item.slug} has no public preview URL.`)
  } else {
    const previewHost = new URL(preview).hostname
    if (previewHost !== 'img-volc.jianpian.info') {
      errors.push(`Use case ${item.slug} has an unexpected preview CDN host: ${previewHost}.`)
    }
    if (new URL(preview).search) {
      errors.push(`Use case ${item.slug} uses a query-based preview URL that may expire.`)
    }
    if (!readme.includes(preview)) {
      errors.push(`README is missing the CDN preview for ${item.slug}.`)
    }
  }
}

for (const category of catalog.categories) {
  const categoryCases = catalog.cases.filter((item) => item.category === category.slug)
  const actualCount = categoryCases.length
  if (actualCount !== category.caseCount) {
    errors.push(`Category ${category.slug} declares ${category.caseCount}, found ${actualCount}.`)
  }

  const outputPath = categoryReadmePath(category.slug)
  const rootRelativeCategoryPath = path.relative(process.cwd(), outputPath)
  if (!readme.includes(`[Open category README](${rootRelativeCategoryPath})`)) {
    errors.push(`Root README is missing the category resource link for ${category.slug}.`)
  }

  if (!fs.existsSync(outputPath)) {
    errors.push(`Missing generated category README: ${path.relative(process.cwd(), outputPath)}.`)
    continue
  }

  const categoryReadme = fs.readFileSync(outputPath, 'utf8')
  const expectedCategoryReadme = renderCategoryReadme(catalog, category)
  const secondRender = renderCategoryReadme(catalog, category)
  if (expectedCategoryReadme !== secondRender) {
    errors.push(`Category README rendering is not deterministic for ${category.slug}.`)
  }
  if (categoryReadme !== expectedCategoryReadme) {
    errors.push(
      `Generated category README is stale or was edited manually: ${path.relative(process.cwd(), outputPath)}.`,
    )
  }

  const promptHeadingCount = (categoryReadme.match(/^### Original prompt$/gm) || []).length
  if (promptHeadingCount !== actualCount) {
    errors.push(
      `Category README ${category.slug} contains ${promptHeadingCount} prompt sections; expected ${actualCount}.`,
    )
  }

  for (const item of categoryCases) {
    const detailUrl = appendTracking(item.websiteUrl, `case-${item.slug}`)
    const createUrl = appendTracking(item.websiteUrl, `create-${item.slug}`)
    const preview = previewUrl(item)

    if (!categoryReadme.includes(item.originalPrompt)) {
      errors.push(`Category README ${category.slug} is missing the full prompt for ${item.slug}.`)
    }
    if (!categoryReadme.includes(preview)) {
      errors.push(`Category README ${category.slug} is missing the CDN preview for ${item.slug}.`)
    }
    if (!categoryReadme.includes(detailUrl)) {
      errors.push(`Category README ${category.slug} is missing the tracked detail link for ${item.slug}.`)
    }
    if (!categoryReadme.includes(createUrl)) {
      errors.push(`Category README ${category.slug} is missing the tracked create link for ${item.slug}.`)
    }
  }
}

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join('\n'))
  process.exit(1)
}

console.log(
  `Validated ${catalog.cases.length} use cases, ${catalog.categories.length} generated category READMEs, and a ${(readmeBytes / 1024).toFixed(1)} KiB root README.`,
)
