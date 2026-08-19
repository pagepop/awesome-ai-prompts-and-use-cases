import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { categoryReadmePath } from './generate-category-readmes.mjs'

const catalog = JSON.parse(fs.readFileSync(path.resolve('data/use-cases.json'), 'utf8'))
const generatedPaths = [
  path.resolve('README.md'),
  ...catalog.categories.map((category) => categoryReadmePath(category.slug)),
]

const missingPaths = generatedPaths.filter((filePath) => !fs.existsSync(filePath))
if (missingPaths.length) {
  console.error(
    missingPaths
      .map((filePath) => `Missing generated file: ${path.relative(process.cwd(), filePath)}`)
      .join('\n'),
  )
  process.exit(1)
}

const before = new Map(generatedPaths.map((filePath) => [filePath, fs.readFileSync(filePath, 'utf8')]))

execFileSync(process.execPath, ['scripts/generate-readme.mjs'], { stdio: 'inherit' })
execFileSync(process.execPath, ['scripts/generate-category-readmes.mjs'], { stdio: 'inherit' })

const changedPaths = generatedPaths.filter(
  (filePath) => fs.readFileSync(filePath, 'utf8') !== before.get(filePath),
)

if (changedPaths.length) {
  console.error(
    [
      'Generated README files were stale. The generator has refreshed these files:',
      ...changedPaths.map((filePath) => `- ${path.relative(process.cwd(), filePath)}`),
      'Review and commit the refreshed outputs, then run npm run check again.',
    ].join('\n'),
  )
  process.exit(1)
}

execFileSync(process.execPath, ['scripts/validate.mjs'], { stdio: 'inherit' })
console.log(`Confirmed deterministic output for ${generatedPaths.length} generated README files.`)
