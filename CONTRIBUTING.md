# Contributing

Thank you for contributing to the Argvus package repository.

## Guidelines

- Preserve published package history.
- Keep raw package files under `public/`.
- Keep the public URL shape stable, especially `/packages/arch/$arch/`.
- Do not add a custom domain or `CNAME`.
- Keep the Astro UI simple, fast and suitable for browsing repository files.

## Pull requests

Include:

- what changed;
- whether package files or only the site UI changed;
- how `npm run build` behaved;
- any impact on pacman repository URLs.

Package publishing normally happens from `argvus-pkgbuild`; manual package file changes should be rare and clearly justified.
