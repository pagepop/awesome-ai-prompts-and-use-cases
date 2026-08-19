# PagePop website integration

The repository already sends readers to PagePop through tracked Hub, category, and case-detail links. The reverse direction must wait until the final GitHub organization and repository URL exist.

## Final repository URL

Replace this placeholder only after the remote is created:

`https://github.com/<pagepop-org>/awesome-ai-prompts-and-use-cases`

## Required website links

Add the final repository URL to the PagePop `www` project in these locations:

1. **Use Cases Hub header or resource action:** label `GitHub` or `Open prompt repository`.
2. **Seven category pages:** use the same repository link; an optional anchor may point to that category README.
3. **Use-case details:** a secondary `View prompt repository` link may point to the matching category README. Keep the primary action as `Create in PagePop`.
4. **Use Cases footer/resource block:** add a persistent repository link so every public Use Cases page participates in the two-way path.

Do not add links to the five model logos. They describe PagePop's supported creative stack and are not separate PagePop repositories.

## Attribution

GitHub-to-PagePop links already use:

- `utm_source=github`
- `utm_medium=referral`
- `utm_campaign=awesome-ai-prompts-and-use-cases`
- a per-link `utm_content` value

After the PagePop routes are deployed, verify that analytics preserves the UTM values from repository banner, category, case, create, and footer links.

## Release gate

Before making the GitHub repository public:

- deploy `https://www.pagepop.ai/use-cases` and all linked category/detail routes;
- confirm none of the generated PagePop links return 404;
- add the website-to-GitHub links above using the stable remote URL;
- confirm both directions work on desktop and mobile;
- rerun `npm run check` in this repository.
