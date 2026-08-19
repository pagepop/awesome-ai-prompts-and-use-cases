import fs from 'node:fs'
import path from 'node:path'

const catalogPath = path.resolve('data/use-cases.json')
const readmePath = path.resolve('README.md')
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'))
const readme = fs.readFileSync(readmePath, 'utf8')
const readmeBytes = Buffer.byteLength(readme)
const errors = []
const allowedCategories = new Set(catalog.categories.map((category) => category.slug))
const slugs = new Set()

if (catalog.cases.length !== 78) {
  errors.push(`Expected 78 published use cases, received ${catalog.cases.length}.`)
}

if (readmeBytes >= 450 * 1024) {
  errors.push(`README.md is ${readmeBytes} bytes; keep it below the 450 KiB safety budget.`)
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
  if (!allowedCategories.has(item.category)) errors.push(`Unknown category for ${item.slug}: ${item.category}`)
  if (!item.websiteUrl.startsWith('https://www.pagepop.ai/use-cases/')) {
    errors.push(`Unexpected website URL for ${item.slug}: ${item.websiteUrl}`)
  }
  if (!readme.includes(item.slug)) errors.push(`README is missing the link for ${item.slug}.`)
  if (!readme.includes(item.originalPrompt)) errors.push(`README is missing the full prompt for ${item.slug}.`)
}

for (const category of catalog.categories) {
  const actualCount = catalog.cases.filter((item) => item.category === category.slug).length
  if (actualCount !== category.caseCount) {
    errors.push(`Category ${category.slug} declares ${category.caseCount}, found ${actualCount}.`)
  }
}

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join('\n'))
  process.exit(1)
}

console.log(
  `Validated ${catalog.cases.length} use cases, ${catalog.categories.length} categories, and a ${(readmeBytes / 1024).toFixed(1)} KiB README.`,
)

