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
4. Approved submissions are added to the public catalog and generated README.

Do not submit private conversations, personal information, confidential business material, hidden instructions, model credentials, or content you do not have the right to publish.

## Contribution licensing

By submitting material to this repository, you confirm that you have the authority to grant the following permissions and agree that:

- your original prompt, submission text, descriptions, and metadata are published under the [Creative Commons Attribution 4.0 International License](LICENSE);
- code, scripts, workflow changes, and other software contributions are published under the [MIT License](LICENSE-CODE);
- PagePop may host or link to, reproduce, resize, crop, and publicly display the submitted preview assets in this repository and the PagePop web gallery for catalog and promotional presentation; and
- preview assets remain outside CC BY 4.0 unless their source entry or an accompanying notice explicitly licenses them under CC BY 4.0 or another identified license.

Do not submit third-party material, identifiable people, brand assets, fonts, stock media, or other content unless you can grant these permissions and have supplied every attribution or notice the material requires. See [LICENSES.md](LICENSES.md) for the repository-wide licensing scope and exclusions.

## Generated files

The root `README.md` and the `prompts/*/README.md` category pages are generated from `data/use-cases.json`. Do not edit individual prompt sections manually. Update the catalog and run:

```bash
npm run generate
npm run check
```

## Preview asset policy

- Public use-case previews may use stable URLs on the PagePop-controlled CDN. They do not need to be copied into this repository.
- Repository-owned brand assets, including the banner and GitHub social preview, live in `assets/` so the repository identity does not depend on an external image host.
- Do not submit expiring signed URLs, private storage URLs, or third-party media without explicit publication permission.
- Every preview must have descriptive alternative text and a working PagePop result link.

## Pull requests

Generated files must be committed together with their source catalog change. Before opening a pull request, run `npm run check` and confirm the diff contains no personal information, private conversation data, internal identifiers, or tool traces.
