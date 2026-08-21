import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  appendTracking,
  isPublishedCategory,
  isPublishedUseCase,
  renderResultPreview,
} from './generate-category-readmes.mjs'

const catalogPath = path.resolve('data/use-cases.json')
const chineseLocalePath = path.resolve('data/locales/zh-CN.json')
const chineseLocaleData = JSON.parse(fs.readFileSync(chineseLocalePath, 'utf8'))
const chineseTranslations = isRecord(chineseLocaleData) ? chineseLocaleData : {}

const categoryEmoji = {
  video: '🎬',
  'poster-and-flyer': '🪧',
  'image-editor': '🪄',
  'e-commerce': '🛍️',
  slides: '📊',
  'social-post': '📱',
}

const englishCategoryHeadings = {
  video: 'AI Video Prompts & Use Cases',
  'poster-and-flyer': 'Poster & Flyer Prompts & Use Cases',
  'image-editor': 'AI Image Editing Prompts & Use Cases',
  'e-commerce': 'E-commerce Creative Prompts & Use Cases',
  slides: 'Presentation Prompts & Use Cases',
  'social-post': 'Social Media Prompts & Use Cases',
}

const categoryResourcePaths = {
  video: 'prompts/video/README.md',
  'poster-and-flyer': 'prompts/posters-and-flyers/README.md',
  'image-editor': 'prompts/image-editing/README.md',
  'e-commerce': 'prompts/ecommerce/README.md',
  slides: 'prompts/presentations/README.md',
  'social-post': 'prompts/social-media/README.md',
}

const englishCopy = {
    tagline: 'Real requests. Natural-language prompts. Finished creative work.',
    introduction:
      'A curated PagePop collection showing the exact prompt that started each project and the result it produced—without requiring specialized prompt engineering.',
    bannerAlt: 'Awesome AI Creative Prompts & Real-World Use Cases by PagePop',
    galleryAlt: 'PagePop visual gallery showing real prompts and finished creative work',
    galleryCta: 'Browse the visual gallery on PagePop →',
    modelsHeading: 'Models used by PagePop',
    modelsIntroduction:
      'PagePop combines leading creative models and automatically selects the right implementation for the requested result:',
    browseHeading: 'Browse all prompts and use cases',
    browseIntroduction:
      'The prompt collections published in this repository are included below. Use the category links or search this page with <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>F</kbd>.',
    tableHeaders: ['Category', 'Full category page', 'Visual gallery'],
    categoryReadmeLabel: 'Open category README',
    categoryGalleryLabel: 'Browse on PagePop',
    categoryGalleryHeading: 'Browse the {label} gallery on PagePop →',
    outputHeading: 'Output',
    outputLabels: { image: 'Image', video: 'Video', slides: 'Presentation' },
    labelSeparator: ':',
    originalPromptHeading: 'Original prompt',
    detailCta: 'View the complete creative process →',
    createCta: 'Create in PagePop →',
    previewAlt: '{title} — generated {output} result',
    playVideoLabel: '▶ Play video (MP4)',
    howHeading: 'How PagePop turns a prompt into a result',
    howSteps: [
      'Start with an ordinary description of what you want.',
      'PagePop asks for missing details only when they matter.',
      'PagePop selects and coordinates the appropriate models and tools.',
      'Continue refining the result through natural conversation.',
    ],
    howDescription:
      'The interactive result, complete public conversation, HTML/DOCX rendering, and remix flow remain on the corresponding PagePop use-case page.',
    contributingHeading: 'Contributing',
    contributingText:
      'New prompts and use cases are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) and submit a use case through the repository issue template. Every submission must include an original prompt, a result preview, source information, and confirmation that the contributor has the right to publish the material.',
    dataHeading: 'Data',
    dataText:
      'The public, machine-readable catalog is available at [data/use-cases.json](data/use-cases.json). It intentionally excludes private conversations, internal identifiers, tool traces, and unpublished material.',
    rightsHeading: 'Rights and licensing',
    rightsText:
      'The original prompts, repository documentation, descriptive text, and catalog metadata are licensed under [CC BY 4.0](LICENSE). Repository automation and source code are licensed under the [MIT License](LICENSE-CODE). CDN-hosted result previews, PagePop brand assets, third-party material, trademarks, and personality rights are not automatically included in those grants. Read [LICENSES.md](LICENSES.md) for the controlling scope, exclusions, and attribution format.',
    footerTagline: 'Describe what you want. PagePop handles how it gets made.',
    footerCta: 'Explore every use case on PagePop →',
}

const localeDefinitions = {
  en: {
    languageName: 'English',
    readmeFile: 'README.md',
    galleryImage: 'assets/pagepop-visual-gallery.png',
    copy: englishCopy,
  },
  zh: {
    languageName: hasText(chineseTranslations.languageName)
      ? chineseTranslations.languageName
      : '简体中文',
    readmeFile: hasText(chineseTranslations.readmeFile)
      ? chineseTranslations.readmeFile
      : 'README_zh.md',
    galleryImage: hasText(chineseTranslations.galleryImage)
      ? chineseTranslations.galleryImage
      : 'assets/pagepop-visual-gallery-zh.png',
    copy: isRecord(chineseTranslations.copy) ? chineseTranslations.copy : {},
  },
}

export const rootReadmeLocales = Object.keys(localeDefinitions)

function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function hasText(value) {
  return typeof value === 'string' && Boolean(value.trim())
}

function validateLocaleShape(value, reference, label, errors) {
  if (Array.isArray(reference)) {
    if (!Array.isArray(value)) {
      errors.push(`${label} must be an array.`)
      return
    }
    if (value.length !== reference.length) {
      errors.push(`${label} must contain ${reference.length} entries.`)
    }
    for (let index = 0; index < Math.min(value.length, reference.length); index += 1) {
      validateLocaleShape(value[index], reference[index], `${label}[${index}]`, errors)
    }
    return
  }

  if (isRecord(reference)) {
    if (!isRecord(value)) {
      errors.push(`${label} must be an object.`)
      return
    }
    for (const key of Object.keys(reference)) {
      validateLocaleShape(value[key], reference[key], `${label}.${key}`, errors)
    }
    for (const key of Object.keys(value)) {
      if (!(key in reference)) errors.push(`${label} contains an unexpected field: ${key}`)
    }
    return
  }

  if (typeof reference === 'string' && !hasText(value)) {
    errors.push(`${label} must be a non-empty string.`)
  }
}

function markdownFence(value) {
  const runs = value.match(/`+/g) || []
  const longest = Math.max(3, ...runs.map((run) => run.length + 1))
  return '`'.repeat(longest)
}

function formatTemplate(template, values) {
  return template.replace(/\{([a-zA-Z]+)\}/g, (placeholder, key) => {
    if (!(key in values)) throw new Error(`Missing value for locale placeholder: ${placeholder}`)
    return values[key]
  })
}

export function renderLanguageNavigation(locale) {
  if (!localeDefinitions[locale]) throw new Error(`Unsupported root README locale: ${locale}`)

  return Object.entries(localeDefinitions)
    .map(([code, definition]) => {
      const state = code === locale ? 'Current-brightgreen' : 'Click%20to%20View-lightgrey'
      const badgeLabel = encodeURIComponent(definition.languageName)
      return `[![${definition.languageName}](https://img.shields.io/badge/${badgeLabel}-${state})](${definition.readmeFile})`
    })
    .join(' ')
}

function categoryPresentation(category, locale) {
  if (locale === 'en') {
    return {
      emoji: categoryEmoji[category.slug],
      heading: englishCategoryHeadings[category.slug],
      label: category.label,
    }
  }

  const translation = chineseTranslations.categories[category.slug]
  return { emoji: categoryEmoji[category.slug], ...translation }
}

function caseTitle(item, locale) {
  return locale === 'en' ? item.title : chineseTranslations.cases[item.slug]
}

export function rootReadmePath(locale) {
  const definition = localeDefinitions[locale]
  if (!definition) throw new Error(`Unsupported root README locale: ${locale}`)
  return path.resolve(definition.readmeFile)
}

export function rootReadmeGalleryImage(locale) {
  const definition = localeDefinitions[locale]
  if (!definition) throw new Error(`Unsupported root README locale: ${locale}`)
  return definition.galleryImage
}

export function validateChineseTranslations(catalog) {
  const categories = catalog.categories.filter(isPublishedCategory)
  const cases = catalog.cases.filter(isPublishedUseCase)
  const categorySlugs = new Set(categories.map((category) => category.slug))
  const caseSlugs = new Set(cases.map((item) => item.slug))
  const errors = []
  const categoryTranslations = isRecord(chineseTranslations.categories)
    ? chineseTranslations.categories
    : {}
  const caseTranslations = isRecord(chineseTranslations.cases) ? chineseTranslations.cases : {}

  if (!isRecord(chineseLocaleData)) errors.push('Chinese locale root must be an object.')
  if (!hasText(chineseTranslations.languageName)) {
    errors.push('Chinese locale languageName must be a non-empty string.')
  }
  if (chineseTranslations.readmeFile !== 'README_zh.md') {
    errors.push('Chinese locale readmeFile must be README_zh.md.')
  }
  if (chineseTranslations.galleryImage !== 'assets/pagepop-visual-gallery-zh.png') {
    errors.push(
      'Chinese locale galleryImage must be assets/pagepop-visual-gallery-zh.png.',
    )
  }
  if (!hasText(chineseTranslations.title)) errors.push('Missing Chinese repository title.')
  validateLocaleShape(chineseTranslations.copy, englishCopy, 'Chinese locale copy', errors)

  if (!isRecord(chineseTranslations.categories)) {
    errors.push('Chinese locale categories must be an object.')
  }
  if (!isRecord(chineseTranslations.cases)) {
    errors.push('Chinese locale cases must be an object.')
  }

  if (
    hasText(chineseTranslations.copy?.categoryGalleryHeading) &&
    !chineseTranslations.copy.categoryGalleryHeading.includes('{label}')
  ) {
    errors.push('Chinese locale copy.categoryGalleryHeading must include {label}.')
  }
  if (
    hasText(chineseTranslations.copy?.previewAlt) &&
    (!chineseTranslations.copy.previewAlt.includes('{title}') ||
      !chineseTranslations.copy.previewAlt.includes('{output}'))
  ) {
    errors.push('Chinese locale copy.previewAlt must include {title} and {output}.')
  }

  for (const category of categories) {
    const translation = categoryTranslations[category.slug]
    if (!isRecord(translation) || !hasText(translation.label) || !hasText(translation.heading)) {
      errors.push(`Missing Chinese category translation: ${category.slug}`)
    }
  }

  for (const item of cases) {
    if (!hasText(caseTranslations[item.slug])) {
      errors.push(`Missing Chinese case title: ${item.slug}`)
    }
  }

  for (const slug of Object.keys(categoryTranslations)) {
    if (!categorySlugs.has(slug)) errors.push(`Unexpected Chinese category translation: ${slug}`)
  }

  for (const slug of Object.keys(caseTranslations)) {
    if (!caseSlugs.has(slug)) errors.push(`Unexpected Chinese case title: ${slug}`)
  }

  if (errors.length) throw new Error(errors.join('\n'))
}

export function renderRootReadme(catalog, locale) {
  if (!rootReadmeLocales.includes(locale)) throw new Error(`Unsupported root README locale: ${locale}`)
  if (locale === 'zh') validateChineseTranslations(catalog)

  const copy = localeDefinitions[locale].copy
  const publishedCategories = catalog.categories.filter(isPublishedCategory)
  const title = locale === 'en' ? catalog.title : chineseTranslations.title
  const categoryTable = publishedCategories
    .map((category) => {
      const presentation = categoryPresentation(category, locale)
      const websiteCategoryUrl = appendTracking(
        `https://www.pagepop.ai/use-cases/categories/${category.slug}`,
        `category-${category.slug}`,
      )
      return `| ${presentation.emoji} [${presentation.label}](#${category.slug}) | [${copy.categoryReadmeLabel}](${categoryResourcePaths[category.slug]}) | [${copy.categoryGalleryLabel}](${websiteCategoryUrl}) |`
    })
    .join('\n')

  let markdown = `<!-- This file is generated by scripts/generate-readme.mjs. Do not edit it manually. -->

<p align="center">
  <a href="https://www.pagepop.ai/use-cases?utm_source=github&utm_medium=referral&utm_campaign=awesome-ai-prompts-and-use-cases&utm_content=repository-banner"><img src="assets/repository-banner.png" alt="${copy.bannerAlt}" width="1200"></a>
</p>

# ${title}

[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

> **${copy.tagline}**
>
> ${copy.introduction}

---

${renderLanguageNavigation(locale)}

---

<p align="center">
  <img src="${rootReadmeGalleryImage(locale)}" alt="${copy.galleryAlt}" width="1200">
</p>

<p align="center">
  <a href="https://www.pagepop.ai/use-cases?utm_source=github&utm_medium=referral&utm_campaign=awesome-ai-prompts-and-use-cases&utm_content=hero"><strong>${copy.galleryCta}</strong></a>
</p>

## ${copy.modelsHeading}

${copy.modelsIntroduction}

**Nano Banana Pro** · **GPT Image 2** · **Seedance 2.0** · **Seedance 2.5** · **Gemini 3 Pro**

<a id="browse-all-prompts-and-use-cases"></a>

## ${copy.browseHeading}

${copy.browseIntroduction}

| ${copy.tableHeaders.join(' | ')} |
| --- | --- | --- |
${categoryTable}

---

`

  for (const category of publishedCategories) {
    const presentation = categoryPresentation(category, locale)
    const categoryCases = catalog.cases.filter(
      (item) => isPublishedUseCase(item) && item.category === category.slug,
    )

    markdown += `<a id="${category.slug}"></a>\n\n## ${presentation.emoji} ${presentation.heading}\n\n`
    markdown += `[${formatTemplate(copy.categoryGalleryHeading, {
      label: presentation.label,
    })}](${appendTracking(
      `https://www.pagepop.ai/use-cases/categories/${category.slug}`,
      `category-heading-${category.slug}`,
    )})\n\n`

    for (const item of categoryCases) {
      const detailUrl = appendTracking(item.websiteUrl, `case-${item.slug}`)
      const createUrl = appendTracking(item.websiteUrl, `create-${item.slug}`)
      const fence = markdownFence(item.originalPrompt)
      const localizedTitle = caseTitle(item, locale)
      const outputLabel = copy.outputLabels[item.result.kind] || item.result.kind

      markdown += `### ${localizedTitle}\n\n`
      markdown += renderResultPreview(item, detailUrl, {
        altText: formatTemplate(copy.previewAlt, {
          title: localizedTitle,
          output: outputLabel,
        }),
        playVideoLabel: copy.playVideoLabel,
      })

      markdown += `**${copy.outputHeading}${copy.labelSeparator}** ${outputLabel}\n\n`
      markdown += `#### ${copy.originalPromptHeading}\n\n${fence}text\n${item.originalPrompt}\n${fence}\n\n`
      markdown += `**[${copy.detailCta}](${detailUrl})** · **[${copy.createCta}](${createUrl})**\n\n---\n\n`
    }
  }

  const howSteps = copy.howSteps.map((step, index) => `${index + 1}. ${step}`).join('\n')

  markdown += `## ${copy.howHeading}

${howSteps}

${copy.howDescription}

## ${copy.contributingHeading}

${copy.contributingText}

## ${copy.dataHeading}

${copy.dataText}

## ${copy.rightsHeading}

${copy.rightsText}

---

<p align="center">
  <strong>${copy.footerTagline}</strong><br><br>
  <a href="https://www.pagepop.ai/use-cases?utm_source=github&utm_medium=referral&utm_campaign=awesome-ai-prompts-and-use-cases&utm_content=footer">${copy.footerCta}</a>
</p>
`

  return markdown
}

export function generateRootReadmes(catalog) {
  return rootReadmeLocales.map((locale) => {
    const outputPath = rootReadmePath(locale)
    fs.writeFileSync(outputPath, renderRootReadme(catalog, locale))
    return outputPath
  })
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (isMain) {
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'))
  generateRootReadmes(catalog)
  console.log('Generated README.md and README_zh.md with published prompts.')
}
