import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

import {
  categoryReadmePath,
  isPublishedCategory,
} from './generate-category-readmes.ts'
import { rootReadmeLocales, rootReadmePath } from './generate-readme.ts'
import type { Catalog } from './types.ts'
import { readJsonFile } from './types.ts'

const catalog = readJsonFile<Catalog>(path.resolve('data/use-cases.json'))
const generatedPaths = [
  ...rootReadmeLocales.map(rootReadmePath),
  ...catalog.categories.filter(isPublishedCategory).map((category) => categoryReadmePath(category.slug)),
]
const excludedGeneratedPaths = [path.resolve('prompts/documents/README.md')]

const unexpectedPaths = excludedGeneratedPaths.filter((filePath) => fs.existsSync(filePath))
if (unexpectedPaths.length) {
  console.error(
    unexpectedPaths
      .map(
        (filePath) =>
          `Excluded generated file is still present: ${path.relative(process.cwd(), filePath)}`,
      )
      .join('\n'),
  )
  process.exit(1)
}

const missingPaths = generatedPaths.filter((filePath) => !fs.existsSync(filePath))
if (missingPaths.length) {
  console.error(
    missingPaths
      .map((filePath) => `Missing generated file: ${path.relative(process.cwd(), filePath)}`)
      .join('\n'),
  )
  process.exit(1)
}

const before = new Map(
  generatedPaths.map((filePath) => [filePath, fs.readFileSync(filePath, 'utf8')]),
)
execFileSync(process.execPath, ['--import', 'tsx', 'scripts/generate-readme.ts'], {
  stdio: 'inherit',
})
execFileSync(process.execPath, ['--import', 'tsx', 'scripts/generate-category-readmes.ts'], {
  stdio: 'inherit',
})

const regeneratedExcludedPaths = excludedGeneratedPaths.filter((filePath) =>
  fs.existsSync(filePath),
)
if (regeneratedExcludedPaths.length) {
  console.error(
    regeneratedExcludedPaths
      .map(
        (filePath) =>
          `Generator recreated an excluded file: ${path.relative(process.cwd(), filePath)}`,
      )
      .join('\n'),
  )
  process.exit(1)
}

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

execFileSync(process.execPath, ['--import', 'tsx', 'scripts/validate.ts'], {
  stdio: 'inherit',
})
console.log(`Confirmed deterministic output for ${generatedPaths.length} generated README files.`)
