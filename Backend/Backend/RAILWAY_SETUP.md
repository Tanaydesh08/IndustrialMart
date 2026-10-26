# Railway environment and durable listing photos

## PostgreSQL

The application reads Railway PostgreSQL's standard `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, and `PGPASSWORD` variables. In Railway, reference these from the PostgreSQL service in the backend service's Variables page, for example `PGHOST=${{Postgres.PGHOST}}` and corresponding references for the other four variables. Use the internal hostname when both services share the Railway project/private network. Do not copy a database URL or password into this file, source code, or frontend variables.

`spring.jpa.hibernate.ddl-auto=update` remains enabled to preserve the existing schema and data. It does not drop or recreate the database. No production database reset or destructive migration is part of this change.

## S3-compatible object storage

New listing photos are stored in private S3 objects. Configure these backend service variables before enabling seller uploads:

| Variable | Required | Description |
| --- | --- | --- |
| `S3_BUCKET` | Yes | Private bucket name |
| `S3_REGION` | Yes for provider | Signing region; defaults to `us-east-1` |
| `S3_ENDPOINT` | Provider specific | Leave unset for AWS S3; set the provider's HTTPS endpoint for R2 or another S3-compatible service |
| `S3_PATH_STYLE` | Provider specific | `true` if the provider requires path style addressing; otherwise `false` |
| `AWS_ACCESS_KEY_ID` | Yes | Backend-only storage access key |
| `AWS_SECRET_ACCESS_KEY` | Yes | Backend-only storage secret |
| `AWS_SESSION_TOKEN` | Optional | Temporary credential token, if issued |

Create a private bucket and keep public access blocked. Grant the backend credentials only the minimum bucket-scoped `PutObject`, `GetObject`, and `DeleteObject` permissions for listing image objects. Browser images are fetched through the authenticated backend API, so the bucket does not need public-read access. Provider credentials must never be set as `VITE_*` variables.

The implementation uses AWS SDK for Java 2.x and supports endpoint overrides for S3-compatible services. See [AWS SDK Java endpoint configuration](https://docs.aws.amazon.com/sdk-for-java/latest/developer-guide/endpoint-config.html) and [AWS SDK Java Maven setup](https://docs.aws.amazon.com/sdk-for-java/latest/developer-guide/setup-project-maven.html).

## Existing local photo migration

Existing `/listing-images/<filename>` values remain readable from the configured legacy directory while those files exist. Before replacing/redeploying an instance that still has local photos:

1. Configure and verify the private bucket variables above.
2. Ensure the old files are still present in the backend's `LISTING_IMAGE_DIRECTORY` (defaults to `./uploads/listings`).
3. Call `POST /api/admin/storage/migrate-legacy-listing-images` with an ADMIN JWT while the old files are accessible.
4. Confirm `migratedImages` and `missingLegacyFiles` in the response, then verify migrated photos in Deals and listing details.
5. Back up the old directory before removing or replacing the old service.

The migration keeps old files in place and updates each database image reference only after its object upload succeeds. It is safe to rerun; already migrated URLs are skipped. Missing old files are reported and left untouched in the database. Do not redeploy away from the old filesystem until the migration reports zero missing files and photos have been checked.

## Required backend variables

Required for normal Railway operation: `PGHOST`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`, `JWT_SECRET`, and `CORS_ALLOWED_ORIGIN`. `PGPORT` defaults to `5432`; set it if the Railway service uses a different port. `PORT` is supplied by Railway. `JWT_SECRET` must be a random secret with at least 32 bytes.

Required for durable photo uploads: `S3_BUCKET`, `S3_REGION`, `AWS_ACCESS_KEY_ID`, and `AWS_SECRET_ACCESS_KEY`; additionally configure `S3_ENDPOINT` and `S3_PATH_STYLE` when required by the provider.

Optional application variables include `LISTING_FEE_PAISE`, `LISTING_UNLOCK_PRICE_PAISE`, `CREDIT_PACK_PAISE`, `CREDIT_PACK_CREDITS`, `SHOW_SQL`, `ADMIN_BOOTSTRAP_EMAIL`, `ADMIN_BOOTSTRAP_PASSWORD`, and `LISTING_IMAGE_DIRECTORY` (legacy reads/migration only). Never enable SQL logging in production unless there is a specific need and reviewed data exposure controls.

## Database credential rotation

The previous source configuration contained a PostgreSQL credential and it must be treated as compromised. Rotate/reset the PostgreSQL credential in Railway, then update the backend's `PGPASSWORD` variable (and `PGUSER` if Railway issues a replacement username). Update service references together, allow Railway to restart the backend, verify the health endpoint and a signed-in database-backed page, and remove any stale credential variables. Do not rotate while the service is live without coordinating the resulting restart. The credential has not been rotated by this code change.
