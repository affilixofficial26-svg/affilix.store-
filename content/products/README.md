# AFFILIX product master files

These JSON files are the source of truth for Fase 41 product generation.

They define:

- catalog slug and product type
- market price and Stripe amount
- MuAPI cover prompt
- PDF/content generation plan
- delivery rules
- expected review status after build

They are not the final generated PDFs. The next phase must consume these files from `/api/internal/products/build`.
