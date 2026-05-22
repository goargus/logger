# How to Update the Wiki

This project uses a repo-first wiki workflow.

## Source of truth

Edit the Markdown files under:

```text
docs/wiki/
```

Do not treat the GitHub Wiki web editor as the primary authoring surface.

## Update process

1. Edit the relevant file in `docs/wiki/`.
2. Review the change in a pull request.
3. Sync the same files into the GitHub Wiki repository.

## Manual sync example

```bash
git clone git@github.com:goargus/logger.wiki.git /tmp/logger-wiki
cp docs/wiki/*.md /tmp/logger-wiki/
git -C /tmp/logger-wiki add .
git -C /tmp/logger-wiki commit -m "Update wiki"
git -C /tmp/logger-wiki push
```

## Naming conventions

- GitHub Wiki page names come from the Markdown filenames
- `Home.md` becomes the wiki landing page
- `_Sidebar.md` controls navigation

## Maintenance rule

If a wiki page disagrees with controller code, workflow files, or config validation, update the wiki immediately. Do not preserve stale wording for compatibility.
