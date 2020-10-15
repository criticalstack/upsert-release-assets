# Upsert release assets javascript action

This action creates or updates a release, and uploads a directory of assets. The release assets will overwrite any pre-existing assets of the same name.

## Inputs

### `release_name`

**Required** The name of the release. For example, `Release v1.0.1`

### `assets_directory`

**Required** The directory containing release assets.  Default: `dist`

### `owner`

The name of the owner of the repo. Used to identify the owner of the repository.  Used when cutting releases for external repositories.  Default: Current owner

### `repo`
The name of the repository. Used to identify the repository on which to release.  Used when cutting releases for external repositories. Default: Current repository

## Example usage

```yaml
uses: criticalstack/upsert-release-assets@v1
env:
  GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
with:
  release_name: ${{ github.ref }}
```
