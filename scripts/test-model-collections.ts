import assert from 'node:assert/strict'

import { readModelCollections, websiteUrlForLocale } from './model-collections.ts'
import { projectFableData } from './sync-model-collections.ts'

const index = readModelCollections()
const { repositoryUrl: _repositoryUrl, ...model } = index.model
const source = {
  schemaVersion: 1,
  model,
  cases: index.cases.map((item) => ({
    ...item,
    title: item.locales['en-US'].title,
    description: item.locales['en-US'].description,
    prompt: 'Source prompt used only to exercise metadata projection.',
  })),
}
assert.deepEqual(projectFableData(source), index)
assert(!JSON.stringify(projectFableData(source)).includes('Source prompt used only'))

function invalid(change: (value: typeof source) => void): void {
  const changed = structuredClone(source)
  change(changed)
  assert.throws(() => projectFableData(changed))
}

assert.throws(() => projectFableData(null))
invalid((value) => { value.cases.pop() })
invalid((value) => { value.cases[0]!.prompt = '' })
invalid((value) => { value.cases[0]!.locales['zh-CN'].detailUrl = value.cases[0]!.locales['en-US'].detailUrl })
invalid((value) => { value.cases[0]!.locales['zh-CN'].topicUrl = value.cases[0]!.locales['en-US'].topicUrl })
invalid((value) => { value.cases[0]!.videoUrl = 'https://private.example.test/result.mp4' })
invalid((value) => { value.cases[0]!.source.authorName = '' })
invalid((value) => { value.cases[1]!.slug = value.cases[0]!.slug })
assert.throws(() => projectFableData({ ...source, internalTrace: 'not public' }))
assert.equal(
  websiteUrlForLocale('https://www.pagepop.ai/use-cases/example?utm_source=github#result', 'zh'),
  'https://www.pagepop.ai/zh-cn/use-cases/example?utm_source=github#result',
)
assert.throws(() => websiteUrlForLocale('https://private.example.test/use-cases/example', 'zh'))
console.log('Passed Fable metadata projection, invalid export, locale and URL boundary checks.')
