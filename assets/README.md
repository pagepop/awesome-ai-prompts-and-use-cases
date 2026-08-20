# Repository assets

This directory contains fixed assets owned by this repository:

- `repository-background.png`: the source background used by the branded repository artwork.
- `repository-banner.svg` and `repository-banner.png`: the clickable banner shown at the top of the root README.
- `social-preview.svg` and `social-preview.png`: the 1280×640 image to upload in GitHub repository settings.

Use-case previews intentionally remain on the stable PagePop-controlled CDN. Keeping those URLs in the generated catalog avoids duplicating media, preserves a single public asset source, and keeps repository updates small. Do not replace them with expiring signed URLs or third-party assets without publication permission.

The SVG files are editable sources. Commit the matching PNG whenever an SVG changes because GitHub repository settings require a raster social preview and Markdown clients render the PNG banner consistently.
