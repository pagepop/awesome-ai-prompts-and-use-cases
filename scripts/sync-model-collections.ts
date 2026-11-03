import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  fableFeaturedSlugs,
  fableRepositoryUrl,
  validateModelCollections,
} from './model-collections.ts'
import { hasText, isRecord, readJsonFile } from './types.ts'

function assertPublicFields(value: Record<string, unknown>, fields: string[], label: string): void {
  if (Object.keys(value).some((key) => !fields.includes(key)) || fields.some((key) => !(key in value))) {
    throw new Error(`${label} must contain exactly the public export fields: ${fields.join(', ')}`)
  }
}

export function projectFableData(source: unknown): unknown {
  if (!isRecord(source) || source.schemaVersion !== 1 || !isRecord(source.model) ||
      source.model.id !== 'claude-fable-5-5' || source.model.name !== 'Claude Fable 5.5' ||
      !Array.isArray(source.cases)) {
    throw new Error('Expected the validated public Fable data/cases.json export (schemaVersion 1).')
  }
  assertPublicFields(source, ['schemaVersion', 'model', 'cases'], 'Fable source')
  assertPublicFields(source.model, ['id', 'name'], 'Fable source model')
  const cases = source.cases.map((item: unknown) => {
    if (!isRecord(item) || !hasText(item.prompt) || !hasText(item.title) || !hasText(item.description)) {
      throw new Error('Every Fable source case must contain its complete public prompt, title and description.')
    }
    assertPublicFields(item, ['slug', 'title', 'description', 'prompt', 'coverUrl', 'videoUrl', 'source', 'locales'], 'Fable source case')
    return {
      slug: item.slug,
      coverUrl: item.coverUrl,
      videoUrl: item.videoUrl,
      source: item.source,
      locales: item.locales,
    }
  })
  const output = {
    schemaVersion: 1,
    model: { ...source.model, repositoryUrl: fableRepositoryUrl },
    featuredSlugs: [...fableFeaturedSlugs],
    cases,
  }
  validateModelCollections(output)
  return output
}

const isMain = Boolean(process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
if (isMain) {
  const args = process.argv.slice(2)
  const check = args.length === 3 && args[2] === '--check'
  if ((!check && args.length !== 2) || args[0] !== '--fable-data' || !args[1]) {
    throw new Error('Usage: tsx scripts/sync-model-collections.ts --fable-data PATH/TO/data/cases.json [--check]')
  }
  const inputPath = path.resolve(args[1])
  const output = projectFableData(readJsonFile<unknown>(inputPath))
  const outputPath = path.resolve('data/model-collections.json')
  const content = `${JSON.stringify(output, null, 2)}\n`
  if (check) {
    if (fs.readFileSync(outputPath, 'utf8') !== content) {
      throw new Error('Model metadata index differs from the supplied public export. Run sync:models and regenerate.')
    }
    console.log('Confirmed model metadata matches all 14 cases in the supplied public export.')
  } else {
    fs.writeFileSync(outputPath, content)
    console.log('Synced all 14 public Fable cases into the model metadata index; legacy catalog unchanged.')
  }
}
