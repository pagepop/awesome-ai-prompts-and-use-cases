# GitHub repository settings

Apply these settings after the PagePop GitHub organization and remote repository are confirmed.

## Identity

- **Repository name:** `awesome-ai-prompts-and-use-cases`
- **Default branch:** `main`
- **Visibility at launch:** public, only after the launch checklist is complete
- **Description:** `78 real-world AI creative prompts with outputs for video, posters, image editing, e-commerce, documents, presentations, and social media — created in PagePop.`
- **Website:** `https://www.pagepop.ai/use-cases`
- **Social preview:** upload `assets/social-preview.png`

## Topics

Use these repository topics:

`ai-prompts`, `prompts`, `prompt-library`, `prompt-engineering`, `ai-use-cases`, `ai-content-creation`, `image-generation`, `video-generation`, `image-editing`, `ecommerce`, `presentations`, `pagepop`

Do not add individual model topics until the public catalog has a verified per-case model field rather than a repository-level platform statement.

## Features

- Enable Issues so contributors can use the structured submission form.
- Keep Discussions disabled for the first launch unless someone owns moderation.
- Keep Wiki and Projects disabled; the generated README hierarchy is the public resource surface.
- Add the `submission` label before accepting contributions.
- Keep merge commits optional, but require pull requests for `main`.

## Branch protection

Protect `main` with:

- pull requests required before merging;
- at least one approving review;
- dismissal of stale approvals after new commits;
- required status check: the `validate` job from `.github/workflows/validate.yml`;
- conversations resolved before merging;
- force pushes and branch deletion disabled.

## Remote creation sequence

1. Create an empty private repository with the exact name above. Do not initialize it with a README, license, or `.gitignore` because those files already exist locally. Keep it private until the public launch checklist is complete.
2. Add the final GitHub URL as `origin` and verify it before pushing.
3. Push `main` without force.
4. Apply the identity, topics, social preview, labels, and branch-protection settings above.
5. Verify the root banner, all seven category pages, Issue form, Action, and PagePop referral links.

The remote owner is intentionally not hard-coded in generated content. After the final URL exists, complete the reverse-link work described in [WEBSITE-INTEGRATION.md](WEBSITE-INTEGRATION.md).
