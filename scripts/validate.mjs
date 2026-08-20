import fs from 'node:fs'
import path from 'node:path'
import {
  appendTracking,
  categoryReadmePath,
  isPublishedCategory,
  isPublishedUseCase,
  previewUrl,
  publicCategorySlugs,
  renderCategoryReadme,
  videoUrl,
} from './generate-category-readmes.mjs'

const catalogPath = path.resolve('data/use-cases.json')
const readmePath = path.resolve('README.md')
const bannerPath = path.resolve('assets/repository-banner.png')
const socialPreviewPath = path.resolve('assets/social-preview.png')
const contentLicensePath = path.resolve('LICENSE')
const codeLicensePath = path.resolve('LICENSE-CODE')
const licensingGuidePath = path.resolve('LICENSES.md')
const contributingPath = path.resolve('CONTRIBUTING.md')
const issueTemplatePath = path.resolve('.github/ISSUE_TEMPLATE/submit-use-case.yml')
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'))
const readme = fs.readFileSync(readmePath, 'utf8')
const readmeBytes = Buffer.byteLength(readme)
const errors = []
const allowedCategories = new Set(publicCategorySlugs)
const publishedCategories = catalog.categories.filter(isPublishedCategory)
const publishedCategorySlugs = new Set(publishedCategories.map((category) => category.slug))
const slugs = new Set()
const categorySlugs = new Set()
const obviousEmailPattern = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i
const obviousPhonePattern = /(?:\+?\d[\d ()-]{7,}\d)/
const internalImplementationPatterns = [
  /\b(?:ecommerce-video-generate|common-video-generate|kid_edu_cartoon)\b/i,
  /\bcommon video generation skill\b/i,
  /\b(?:specialized|internal)\s+(?:[a-z0-9-]+\s+){0,4}(?:agent|tool)\b/i,
  /\bhand (?:this|it) (?:over|off) to (?:our|the)\b/i,
  /\bour (?:design|video|creative|document|presentation) specialist\b/i,
  /\breport this task\b/i,
  /\b(?:tool|skill|agent)\s+(?:trace|call|identifier|implementation name)\b/i,
]
const expectedBannerReference =
  '<img src="assets/repository-banner.png" alt="Awesome AI Creative Prompts & Real-World Use Cases by PagePop" width="1200">'

const publicFields = {
  catalog: new Set([
    'schemaVersion',
    'title',
    'description',
    'publisher',
    'website',
    'locale',
    'sourceUpdatedAt',
    'supportedModels',
    'categories',
    'cases',
  ]),
  category: new Set(['slug', 'label', 'order', 'caseCount']),
  useCase: new Set([
    'slug',
    'category',
    'title',
    'summary',
    'originalPrompt',
    'websiteUrl',
    'updatedAt',
    'result',
  ]),
  result: new Set(['kind', 'title', 'coverUrl', 'assets']),
  asset: new Set(['kind', 'url', 'title', 'coverUrl']),
}

function validatePublicFields(value, allowedFields, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    errors.push(`${label} must be an object.`)
    return
  }

  const unexpectedFields = Object.keys(value).filter((key) => !allowedFields.has(key))
  if (unexpectedFields.length) {
    errors.push(`${label} contains non-public fields: ${unexpectedFields.join(', ')}.`)
  }
}

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

validatePublicFields(catalog, publicFields.catalog, 'Catalog')

for (const category of catalog.categories) {
  if (categorySlugs.has(category.slug)) errors.push(`Duplicate category slug: ${category.slug}`)
  categorySlugs.add(category.slug)
  if (!allowedCategories.has(category.slug)) {
    errors.push(`Catalog exposes a non-public category: ${category.slug}`)
  }
}

for (const expectedCategory of allowedCategories) {
  if (!categorySlugs.has(expectedCategory)) {
    errors.push(`Catalog is missing public category: ${expectedCategory}`)
  }
}

if (categorySlugs.has('document') || catalog.cases.some((item) => item.category === 'document')) {
  errors.push('Public catalog must not include the document category or document use cases.')
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

const requiredLicenseFiles = [
  [contentLicensePath, 'CC BY 4.0 content license'],
  [codeLicensePath, 'MIT code license'],
  [licensingGuidePath, 'licensing scope guide'],
]
for (const [filePath, label] of requiredLicenseFiles) {
  if (!fs.existsSync(filePath)) errors.push(`Missing ${label}: ${path.relative(process.cwd(), filePath)}.`)
}

if (fs.existsSync(contentLicensePath)) {
  const contentLicense = fs.readFileSync(contentLicensePath, 'utf8')
  if (!contentLicense.includes('Creative Commons Attribution 4.0 International Public License')) {
    errors.push('LICENSE does not contain the standard CC BY 4.0 legal code.')
  }
}

if (fs.existsSync(codeLicensePath)) {
  const codeLicense = fs.readFileSync(codeLicensePath, 'utf8')
  if (!codeLicense.startsWith('MIT License\n') || !codeLicense.includes('Copyright (c) 2026 PagePop')) {
    errors.push('LICENSE-CODE does not contain the expected PagePop MIT license.')
  }
}

if (fs.existsSync(licensingGuidePath)) {
  const licensingGuide = fs.readFileSync(licensingGuidePath, 'utf8')
  for (const requiredText of [
    'Content licensed under CC BY 4.0',
    'Code licensed under MIT',
    'CDN-hosted previews and other result assets',
    'PagePop brand assets',
  ]) {
    if (!licensingGuide.includes(requiredText)) {
      errors.push(`LICENSES.md is missing the required licensing boundary: ${requiredText}.`)
    }
  }
}

for (const [filePath, label] of [
  [contributingPath, 'CONTRIBUTING.md'],
  [issueTemplatePath, 'submission issue template'],
]) {
  if (!fs.existsSync(filePath)) {
    errors.push(`Missing ${label}: ${path.relative(process.cwd(), filePath)}.`)
    continue
  }
  const contributionText = fs.readFileSync(filePath, 'utf8')
  if (!contributionText.includes('CC BY 4.0') || !contributionText.includes('publicly display')) {
    errors.push(`${label} is missing the required content-license and preview-display confirmation.`)
  }
}

if (fs.existsSync(issueTemplatePath)) {
  const issueTemplate = fs.readFileSync(issueTemplatePath, 'utf8')
  if (/^\s*-\s+Document\s*$/m.test(issueTemplate)) {
    errors.push('Submission issue template must not offer the excluded Document category.')
  }
}

if (
  !readme.includes('[CC BY 4.0](LICENSE)') ||
  !readme.includes('[MIT License](LICENSE-CODE)') ||
  !readme.includes('[LICENSES.md](LICENSES.md)')
) {
  errors.push('README.md is missing the content, code, or licensing-scope links.')
}

if (!readme.includes('https://www.pagepop.ai/use-cases')) {
  errors.push('README.md is missing a link to the PagePop use-case gallery.')
}

for (const forbiddenText of [
  'Document & Webpage Prompts & Use Cases',
  'prompts/documents/README.md',
  '**Result assets:**',
]) {
  if (readme.includes(forbiddenText)) {
    errors.push(`README.md must not expose generated quantity or document-gallery text: ${forbiddenText}`)
  }
}

if (/^### \d+\./m.test(readme) || /All \d+ prompts/.test(readme)) {
  errors.push('README.md must not include generated sequence numbers or changing prompt totals.')
}

for (const [itemIndex, item] of catalog.cases.entries()) {
  validatePublicFields(item, publicFields.useCase, `Use case ${item.slug || itemIndex + 1}`)
  validatePublicFields(item.result, publicFields.result, `Result for ${item.slug || itemIndex + 1}`)
  for (const [assetIndex, asset] of (item.result?.assets || []).entries()) {
    validatePublicFields(
      asset,
      publicFields.asset,
      `Asset ${assetIndex + 1} for ${item.slug || itemIndex + 1}`,
    )
  }

  if (!item.slug || !item.title || !item.originalPrompt || !item.websiteUrl) {
    errors.push(`Use case ${item.slug || '(missing slug)'} is missing a required field.`)
  }
  if (slugs.has(item.slug)) errors.push(`Duplicate slug: ${item.slug}`)
  slugs.add(item.slug)
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug)) {
    errors.push(`Use case has an unsafe public slug: ${item.slug}`)
  }
  if (!allowedCategories.has(item.category)) errors.push(`Unknown category for ${item.slug}: ${item.category}`)
  if (!isPublishedUseCase(item)) {
    errors.push(`Use case ${item.slug} belongs to a non-public category: ${item.category}`)
  }
  if (!item.websiteUrl.startsWith('https://www.pagepop.ai/use-cases/')) {
    errors.push(`Unexpected website URL for ${item.slug}: ${item.websiteUrl}`)
  }
  const isPublished = publishedCategorySlugs.has(item.category)
  if (isPublished) {
    const rootDetailUrl = appendTracking(item.websiteUrl, `case-${item.slug}`)
    const rootCreateUrl = appendTracking(item.websiteUrl, `create-${item.slug}`)
    if (!readme.includes(rootDetailUrl)) {
      errors.push(`README is missing the tracked detail link for ${item.slug}.`)
    }
    if (!readme.includes(rootCreateUrl)) {
      errors.push(`README is missing the tracked create link for ${item.slug}.`)
    }
    if (!readme.includes(item.originalPrompt)) {
      errors.push(`README is missing the full prompt for ${item.slug}.`)
    }
  }

  const publicText = [item.title, item.summary, item.originalPrompt].filter(Boolean).join('\n')
  if (obviousEmailPattern.test(publicText) || obviousPhonePattern.test(publicText)) {
    errors.push(`Use case ${item.slug} contains an obvious email address or phone-number pattern.`)
  }
  for (const internalPattern of internalImplementationPatterns) {
    if (internalPattern.test(publicText)) {
      errors.push(`Use case ${item.slug} exposes an internal skill, agent, or tool implementation name.`)
      break
    }
  }

  const preview = previewUrl(item)
  if (!preview) {
    errors.push(`Use case ${item.slug} has no public preview URL.`)
  } else {
    let previewUrlValue
    try {
      previewUrlValue = new URL(preview)
    } catch {
      errors.push(`Use case ${item.slug} has an invalid preview URL.`)
    }
    if (previewUrlValue?.protocol !== 'https:') {
      errors.push(`Use case ${item.slug} preview must use public HTTPS.`)
    }
    if (previewUrlValue?.search) {
      errors.push(`Use case ${item.slug} uses a query-based preview URL that may expire.`)
    }
    if (isPublished && !readme.includes(preview)) {
      errors.push(`README is missing the CDN preview for ${item.slug}.`)
    }
  }

  if (item.result?.kind === 'video') {
    const directVideoUrl = videoUrl(item)
    let directVideoUrlValue
    try {
      directVideoUrlValue = new URL(directVideoUrl)
    } catch {
      errors.push(`Video use case ${item.slug} has no valid direct video URL.`)
    }
    if (
      directVideoUrlValue?.protocol !== 'https:' ||
      !directVideoUrlValue.pathname.toLowerCase().endsWith('.mp4')
    ) {
      errors.push(`Video use case ${item.slug} must provide a public HTTPS MP4 URL.`)
    }
    if (isPublished && directVideoUrl && !readme.includes(directVideoUrl)) {
      errors.push(`README is missing the direct MP4 link for ${item.slug}.`)
    }
  }
}

for (const category of catalog.categories) {
  validatePublicFields(category, publicFields.category, `Category ${category.slug || '(missing slug)'}`)
  const categoryCases = catalog.cases.filter((item) => item.category === category.slug)
  const actualCount = categoryCases.length
  if (actualCount !== category.caseCount) {
    errors.push(`Category ${category.slug} declares ${category.caseCount}, found ${actualCount}.`)
  }

  if (!isPublishedCategory(category)) {
    errors.push(`Catalog contains an unsupported category that cannot be generated: ${category.slug}.`)
    continue
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

  if (
    categoryReadme.includes('**Result assets:**') ||
    /^## \d+\./m.test(categoryReadme) ||
    /Browse all \d+ prompts/.test(categoryReadme)
  ) {
    errors.push(`Category README ${category.slug} contains changing generated quantities.`)
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
    if (item.result.kind === 'video') {
      const directVideoUrl = videoUrl(item)
      if (!directVideoUrl || !categoryReadme.includes(directVideoUrl)) {
        errors.push(`Category README ${category.slug} is missing the direct MP4 link for ${item.slug}.`)
      }
    }
  }
}

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join('\n'))
  process.exit(1)
}

console.log(
  `Validated the public catalog, ${publishedCategories.length} generated category READMEs, and a ${(readmeBytes / 1024).toFixed(1)} KiB root README.`,
)
