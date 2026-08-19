# Contributing

Thank you for helping build a useful collection of real-world AI creative prompts and results.

## What a submission needs

- A clear title describing the intended result.
- The original natural-language prompt.
- At least one public result preview.
- The output category and format.
- Source and attribution information.
- Confirmation that you have permission to publish the prompt and preview assets.

## Submission process

1. Open the **Submit a creative prompt and use case** issue form.
2. Complete every required field.
3. The PagePop team reviews quality, privacy, attribution, and publication rights.
4. Approved submissions are added to the public catalog and generated README.

Do not submit private conversations, personal information, confidential business material, hidden instructions, model credentials, or content you do not have the right to publish.

## Generated files

`README.md` is generated from `data/use-cases.json`. Do not edit individual prompt sections manually. Update the catalog and run:

```bash
npm run generate
npm run validate
```

