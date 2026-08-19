import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const sourcePath = process.argv[2]

if (!sourcePath) {
  console.error('Usage: npm run import -- /absolute/path/to/catalog.json')
  process.exit(1)
}

const resolvedSourcePath = path.resolve(sourcePath)
const source = JSON.parse(fs.readFileSync(resolvedSourcePath, 'utf8'))
const sourceCases = Array.isArray(source) ? source : source.cases
const sourceCategories = Array.isArray(source.categories) ? source.categories : []

if (!Array.isArray(sourceCases)) {
  throw new Error('The source catalog must contain a cases array.')
}

const supportedModels = [
  'Nano Banana Pro',
  'GPT Image 2',
  'Seedance 2.0',
  'Seedance 2.5',
  'Gemini 3 Pro',
]

const categoryOrder = new Map(
  sourceCategories.map((category, index) => [category.slug, category.order ?? index + 1]),
)

function publicHttpsUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return ''
  const url = new URL(value)
  if (url.protocol !== 'https:') {
    throw new Error(`Only public HTTPS URLs are allowed: ${value}`)
  }
  return url.toString()
}

function cleanText(value) {
  return typeof value === 'string' ? value.replace(/\r\n?/g, '\n').trim() : ''
}

function cleanAsset(asset) {
  return {
    kind: cleanText(asset?.kind),
    url: publicHttpsUrl(asset?.url),
    ...(cleanText(asset?.title) ? { title: cleanText(asset.title) } : {}),
    ...(publicHttpsUrl(asset?.coverUrl) ? { coverUrl: publicHttpsUrl(asset.coverUrl) } : {}),
  }
}

const cases = sourceCases
  .filter((item) => item?.published !== false)
  .map((item) => {
    const slug = cleanText(item.slug)
    const websiteUrl = `https://www.pagepop.ai/use-cases/${encodeURIComponent(slug)}`
    const assets = Array.isArray(item.result?.assets)
      ? item.result.assets.map(cleanAsset).filter((asset) => asset.url)
      : []

    return {
      slug,
      category: cleanText(item.category),
      title: cleanText(item.title),
      summary: cleanText(item.summary),
      originalPrompt: cleanText(item.originalPrompt),
      websiteUrl,
      updatedAt: cleanText(item.updatedAt),
      result: {
        kind: cleanText(item.result?.kind),
        title: cleanText(item.result?.title) || cleanText(item.title),
        coverUrl: publicHttpsUrl(item.result?.coverUrl),
        assets,
      },
    }
  })
  .sort((left, right) => {
    const categoryDifference =
      (categoryOrder.get(left.category) ?? 999) - (categoryOrder.get(right.category) ?? 999)
    return categoryDifference || left.title.localeCompare(right.title, 'en')
  })

const categories = sourceCategories
  .map((category) => ({
    slug: cleanText(category.slug),
    label: cleanText(category.label),
    order: category.order,
    caseCount: cases.filter((item) => item.category === category.slug).length,
  }))
  .sort((left, right) => left.order - right.order)

const output = {
  schemaVersion: 1,
  title: 'Awesome AI Creative Prompts & Real-World Use Cases',
  description:
    'Real-world natural-language prompts with generated results for video, posters, image editing, e-commerce, documents, presentations, and social media.',
  publisher: 'PagePop',
  website: 'https://www.pagepop.ai/use-cases',
  locale: source.locale || 'en-US',
  sourceUpdatedAt: source.sourceUpdatedAt || '',
  supportedModels,
  categories,
  cases,
}

const destinationPath = path.resolve('data/use-cases.json')
fs.mkdirSync(path.dirname(destinationPath), { recursive: true })
fs.writeFileSync(destinationPath, `${JSON.stringify(output, null, 2)}\n`)

console.log(`Imported ${cases.length} public use cases into ${destinationPath}`)

