# Release Guide for `keith-vscode`

This guide describes the complete release process for the VS Code extension.

## 1. Prepare the release

1. Ensure your branch is up to date and CI is green.
1. Update `keith-vscode/package.json`:
   - Set `version` to the new release version.
1. Update `keith-vscode/CHANGELOG.md`:
   - Add all user-visible changes for the release.
   - Keep the `Unreleased` section for future work.
1. Update `keith-vscode/README.md` when user-facing behavior, requirements, or workflows changed.
1. Commit and merge the changes.

## 2. Create the GitHub release

1. Open the repository releases page: `https://github.com/kieler/kieler-vscode/releases/new`.
1. Create a new tag for the release version (for example `v0.4.3`).
1. Create a release title (for example `keith-vscode v0.4.3`).
1. Add release notes from `keith-vscode/CHANGELOG.md`.
1. Publish the release.

Publishing the release triggers `.github/workflows/publish.yml`, which:

- builds and publishes the extension to VS Marketplace and Open VSX, and
- uploads the generated `keith-vscode.vsix` asset to the GitHub release.

## 3. Verify after publish

1. Confirm the `publish` workflow completed successfully.
1. Confirm the new version appears in:
   - VS Marketplace
   - Open VSX
1. Confirm the GitHub release contains the `.vsix` asset.

## 4. Milestones

Milestones are **optional** for this repository's release automation.

- You do **not** need a milestone to publish a release.
- Use milestones only if they help planning and tracking release scope.
