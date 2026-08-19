# Public content review queue

The automated validator checks the public catalog for internal identifiers, tool traces, obvious email addresses, phone-number patterns, unstable preview URLs, and generated-file drift. It cannot determine whether realistic-looking demo information is factual, whether a person shown in an image has granted publication rights, or whether text embedded in an image is safe to publish.

Complete this review before the repository becomes public. Do not silently rewrite an original prompt merely to make a check pass; either confirm the content is fictional and approved, replace it with an approved version at the catalog source, or keep the case unpublished.

## Review every case

- Confirm PagePop has the right to publish the original prompt and every preview asset.
- Visually inspect every preview, including carousel frames and before/after images.
- OCR-check visible names, faces, addresses, phone numbers, email addresses, domains, handles, QR codes, and account identifiers.
- Confirm that CDN URLs are stable public PagePop assets and do not expose private or user-identifying IDs.
- Confirm that medical, event, educational, commercial, and contact information is clearly fictional or otherwise approved for public reuse.

## Cases requiring semantic review

### Contact and crisis information

- `four-leaflets-for-family-adolescent-mental-health`
  - Review `Mental Health Crisis Hotline 116 123`, `Medical Assistance 15`, and `+33-1-XXXX-XXXX`.
  - Confirm the numbers are appropriate for public demo content in every locale and cannot be mistaken for PagePop guidance.

### Realistic domains, addresses, or social handles

- `summer-sounds-fest-2027-poster-festival-design-collection`
  - Review `www.summersoundsfest.com`.
- `2024-pet-adoption-day-at-greenfield-park`
  - Review `234 Oak Street, Maplewood, CA 90210`, `www.pawsandheartsrescue.org/adoptionday`, and `@PawsAndHeartsRescue`.
- `8k-flyer-design-for-community-health-free-clinic`
  - Review `www.maplewoodfreeclinic.org` and `@MaplewoodFreeClinic`; address, phone, and email text is already redacted in the catalog.
- `community-free-vaccination-sites-complete-guide`
  - Review `123 Maple Street`, `456 Oak Avenue`, `789 Pine Road`, `321 Cedar Lane`, and `www.yourcommunityhealth.org/vaccine`; phone text is already redacted.
- `free-kids-english-lectures-register-now`
  - Review `123 Maple Street`, `456 Oak Avenue`, `789 Pine Road`, and `www.littleexplorers.org/english-kids`; phone and email text is already redacted.
- `maplewood-open-house-2024-discover-childs-future`
  - Review `www.maplewoodacademy.edu/openhouse` and `Oak Street entrance`; full address, phone, and email text is already redacted.

## Sign-off

Record the reviewer, review date, decision, and any replacement asset or catalog change for each flagged case. The repository can be made public only after all 78 cases have passed the rights and visual/OCR review and every item above has an explicit decision.
