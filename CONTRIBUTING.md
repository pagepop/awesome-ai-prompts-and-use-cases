# Contributing

Thank you for helping build a useful collection of real-world AI creative prompts and results.

## What a submission needs

- A clear title describing the intended result.
- The original natural-language prompt.
- At least one public result preview.
- The output category and format.
- Source and attribution information.
- Confirmation that you own or otherwise control every right needed to submit the prompt, text, metadata, and preview assets under the terms below.

## Submission process

1. Open the **Submit a creative prompt and use case** issue form.
2. Complete every required field.
3. The PagePop team reviews quality, privacy, attribution, and publication rights.
4. Approved submissions are added to the public catalog and generated READMEs.

Do not submit private conversations, personal information, confidential business material, hidden instructions, model credentials, or content you do not have the right to publish.

## Contribution licensing

By submitting material to this repository, you confirm that you have the authority to grant the following permissions and agree that:

- your original prompt, submission text, descriptions, and metadata are published under the [Creative Commons Attribution 4.0 International License](LICENSE);
- code, scripts, workflow changes, and other software contributions are published under the [MIT License](LICENSE-CODE);
- PagePop may host or link to, reproduce, resize, crop, and publicly display the submitted preview assets in this repository and the PagePop web gallery for catalog and promotional presentation; and
- preview assets remain outside CC BY 4.0 unless their source entry or an accompanying notice explicitly licenses them under CC BY 4.0 or another identified license.

Do not submit third-party material, identifiable people, brand assets, fonts, stock media, or other content unless you can grant these permissions and have supplied every attribution or notice the material requires. See [LICENSES.md](LICENSES.md) for the repository-wide licensing scope and exclusions.

## Generated files

The root `README.md`, `README_zh.md`, and the `prompts/*/README.md` category pages are generated from `data/use-cases.json`, the locale files in `data/locales/`, and the separate `data/model-collections.json` discovery index. Do not edit individual prompt sections manually. Update the catalog and locale data, then run:

```bash
npm run generate
npm run check
```

### Refreshing the Fable discovery collection

Use one reviewed public `data/cases.json` export from [awesome-fable5.5-prompts](https://github.com/pagepop/awesome-fable5.5-prompts). Sync it once, regenerate, and check the output:

```bash
npm ci
npm run sync:models -- --fable-data ../awesome-fable5.5-prompts/data/cases.json
npm run generate
npm run check
```

The sync fails if the export is absent or invalid. It accepts a non-empty, continuously growing collection and keeps every case's public source credits, CDN URLs and localized website destinations in the metadata index; selected highlights appear in each root README. It does not add Fable prompts to the original `data/use-cases.json` or category pages. Keep the original catalog, prompt text, category paths, anchors and existing licenses intact. Community prompts and media retain their original rights; a model discovery label does not establish that a result was made in PagePop. Do not add video binaries or scheduled external writes.

The original catalog entries have English-only detail pages: the same slugs do not exist in the website's Chinese catalog. Their detail, creation and preview destinations intentionally retain each entry's existing English `websiteUrl`, including in the Chinese README, where the CTA explicitly says “英文” or “英文页面”. Do not manufacture Chinese detail URLs or infer mappings between locale catalogs. General gallery/category/model navigation and Fable cases use their matching website locale; this documented legacy exception does not apply to Fable.

Community examples may be included even when the creator has not shared the original prompt. The reviewed source export must provide a clearly labeled PagePop recreation prompt in that case. The optional `promptKind` is `original` or `pagepop-recreation`; an omitted value means `original`. The metadata index preserves this marker while prompt text stays in the dedicated collection. Root highlights use the concise action label “Recreate in PagePop” / “在 PagePop 做同款”. Keep creator names as plain text with one link to the original post. Covers and Watch links must open the matching localized PagePop detail page, never a media file.

To verify that the committed index still matches that export without writing files, run `npm run sync:models -- --fable-data ../awesome-fable5.5-prompts/data/cases.json --check`. The regular check validates the committed index and detects drift in all generated README outputs without requiring a private checkout or external network access.

## Preview asset policy

- Public use-case previews may use stable URLs on the PagePop-controlled CDN. They do not need to be copied into this repository.
- Repository-owned brand assets, including the banner and GitHub social preview, live in `assets/` so the repository identity does not depend on an external image host.
- Do not submit expiring signed URLs, private storage URLs, or third-party media without explicit publication permission.
- Every preview must have descriptive alternative text and a working PagePop result link.

## Pull requests

Write commit subjects, pull request titles, and pull request descriptions in English. Use a clear Conventional Commit-style subject when practical, for example `feat(catalog): add new PagePop use cases`.

Generated files must be committed together with their source catalog or locale change. Before opening a pull request, run `npm run check` and confirm the diff contains no personal information, private conversation data, internal identifiers, or tool traces.
