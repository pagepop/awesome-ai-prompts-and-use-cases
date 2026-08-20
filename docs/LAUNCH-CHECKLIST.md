# Public launch checklist

- [ ] Confirm the GitHub organization and repository owner.
- [x] Confirm the public content and code licenses: CC BY 4.0 for prompts/text/metadata and MIT for repository code, with exclusions documented in `LICENSES.md`.
- [ ] Confirm publication rights for all 78 prompts and preview assets using [CONTENT-REVIEW.md](CONTENT-REVIEW.md).
- [x] Run automated catalog checks for personal information, internal IDs, private tool traces, and unstable preview URLs.
- [ ] Complete the visual/OCR and semantic review in [CONTENT-REVIEW.md](CONTENT-REVIEW.md); automated text checks cannot inspect words embedded in images or decide whether realistic demo information is safe to publish.
- [x] Confirm the five supported model names and create repository-owned PagePop brand assets.
- [x] Add the local repository banner and 1280×640 social preview image.
- [x] Generate the root README and seven category resource pages from the public catalog.
- [x] Include all 78 full prompts, previews, and tracked PagePop links.
- [x] Add deterministic generation, validation, contribution, issue, and pull-request workflows.
- [x] Prepare the exact repository description, topics, features, and branch-protection settings.
- [ ] Apply those settings after the remote repository exists.
- [ ] Configure the PagePop website to link back to this repository.
- [ ] Deploy the linked PagePop `/use-cases` routes before making the repository public.
- [ ] Confirm UTM attribution in analytics.
- [ ] Enable branch protection and required validation checks.
- [ ] Publish the remote repository only after the review is complete.

See [CONTENT-REVIEW.md](CONTENT-REVIEW.md) for the manual publication review, [REPOSITORY-SETTINGS.md](REPOSITORY-SETTINGS.md) for the exact remote settings, and [WEBSITE-INTEGRATION.md](WEBSITE-INTEGRATION.md) for the post-creation backlink work.
