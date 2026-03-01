# Maintenance Guide

This document describes how to track progress, ship upgrades, and keep the app stable.

## Versioning
- Keep extension version in `extension/manifest.json`.
- Use semantic versioning: MAJOR.MINOR.PATCH.
  - MAJOR: breaking changes
  - MINOR: new features
  - PATCH: fixes and small improvements

## Release checklist
1. Create a feature branch: `feat/<short-name>`
2. Implement changes and update docs
3. Bump version in `extension/manifest.json`
4. Update `CHANGELOG.md`
5. Test locally:
   - Server starts
   - Extension loads
   - Supported sites show the overlay
6. Merge to `main`
7. Tag release (optional): `vX.Y.Z`

## Progress tracking
- Each feature gets a short entry in `CHANGELOG.md`.
- Keep commits small and focused.
- For large changes, open a PR with a clear summary and screenshots if UI changes.

## Rollback
- Revert the merge commit or tag if a release needs to be rolled back.
- Document the rollback in `CHANGELOG.md`.
