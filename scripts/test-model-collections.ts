import assert from 'node:assert/strict'

import { readModelCollections, renderModelDiscovery, validateModelCollections, websiteUrlForLocale } from './model-collections.ts'
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
// Collection growth and removal of an unfeatured case must not require code changes.
const expanded = structuredClone(source)
const extraCase = structuredClone(source.cases[0]!)
extraCase.slug = 'fable55-dynamic-collection-fixture'
for (const copy of Object.values(extraCase.locales)) {
  copy.detailUrl = copy.detailUrl.replace(source.cases[0]!.slug, extraCase.slug)
}
expanded.cases.push(extraCase)
const expandedIndex = projectFableData(expanded) as typeof index
assert.equal(expandedIndex.cases.length, source.cases.length + 1)
const reduced = structuredClone(source)
reduced.cases = reduced.cases.filter((item) => index.featuredSlugs.includes(item.slug))
assert.equal((projectFableData(reduced) as typeof index).cases.length, index.featuredSlugs.length)

for (const promptKind of ['original', 'pagepop-recreation']) {
  const withKind = structuredClone(source)
  Object.assign(withKind.cases[0]!, { promptKind })
  const result = projectFableData(withKind) as typeof index
  assert.equal(result.cases[0]!.promptKind, promptKind)
  assert(!JSON.stringify(result).includes('Source prompt used only'))
}
const withoutKind = structuredClone(source)
Reflect.deleteProperty(withoutKind.cases[0]!, 'promptKind')
assert(!Object.hasOwn((projectFableData(withoutKind) as typeof index).cases[0]!, 'promptKind'))
for (const promptKind of ['', 'community', null, undefined]) {
  invalid((value) => { Object.assign(value.cases[0]!, { promptKind }) })
}
invalid((value) => { value.cases = [] })
invalid((value) => { value.cases.splice(value.cases.findIndex((item) => item.slug === index.featuredSlugs[0]), 1) })
assert.throws(() => validateModelCollections({ ...index, cases: [] }))
const invalidIndexKind = structuredClone(index)
Object.assign(invalidIndexKind.cases[0]!, { promptKind: 'unverified' })
assert.throws(() => validateModelCollections(invalidIndexKind))
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
for (const locale of ['en', 'zh'] as const) {
  const rendered = renderModelDiscovery(locale, 'Models', 'Discover community work.')
  const copyLocale = locale === 'zh' ? 'zh-CN' : 'en-US'
  for (const slug of index.featuredSlugs) {
    const item = index.cases.find((entry) => entry.slug === slug)!
    const expectedDetail = new URL(item.locales[copyLocale].detailUrl)
    const links = [...rendered.matchAll(/<a href="([^"]+)">(.*?)<\/a>/g)]
    const watchLink = links.find(([, href, label]) => new URL(href!).pathname === expectedDetail.pathname &&
      label === (locale === 'zh' ? '观看' : 'Watch'))
    assert(watchLink)
    assert.equal(rendered.split(`](${item.source.url})`).length - 1, 1)
    assert(!rendered.includes(`](${item.source.authorUrl})`))
    assert(!rendered.includes(item.videoUrl))
    assert(rendered.includes(`[${locale === 'zh' ? '在 PagePop 做同款' : 'Recreate in PagePop'}](${watchLink[1]})`))
  }
  assert(!/(?:all \d+ (?:examples|cases|prompts)|全部\s*\d+\s*个案例)/i.test(rendered))
}
console.log('Passed dynamic Fable metadata projection, prompt provenance, invalid export, locale and URL boundary checks.')
