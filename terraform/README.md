# Wedding photo gallery — AWS infrastructure

Guests scan the QR code at the venue (`assets/qr/upload.png`) to reach the upload page
**https://vietanhphung.com/wed-invitation/intimate/upload/** and upload without logging in;
a Lambda turns each upload into a 1600 px WebP; the album link
**https://vietanhphung.com/wed-invitation/intimate/gallery/** is view-only; the admin can log in
there and delete photos.

Note: the upload page is unlisted (noindex, not linked from the album), not secret. Uploads use
the identity pool's guest credentials, which anyone who knows the URL can obtain. That is the
accepted trade-off for login-free uploads; abuse is bounded by the processor (images only,
`max_upload_mb`) and admin delete.

```
GitHub Pages (unchanged)                         AWS (this Terraform)
vietanhphung.com/wed-invitation/intimate/gallery/
   │  guest: Cognito Identity Pool (no login) ──► temp creds ──► S3 PUT original/<uuid>.<ext>
   │  admin: Cognito hosted login ──► Identity Pool ──► admin creds ──► S3 DELETE gallery/*.webp
   │                                                                    │ ObjectCreated / ObjectRemoved
   │                                                                    ▼
   │                                       Lambda (sharp): EXIF rotate, ≤1600 px, WebP q80
   │                                       → gallery/<uuid>.webp → verify → delete original
   │                                       → rebuild gallery/index.json
   └── reads gallery/index.json + WebP ◄── CloudFront (OAC, private bucket, d….cloudfront.net)
```

## Existing domain and DNS — not touched

* `vietanhphung.com` DNS is at **Namecheap**; the site is **GitHub Pages** (user site
  `vietanhphung.github.io`, this repo is served under `/wed-invitation/`).
* The gallery page is a normal folder of this repo (`intimate/gallery/`), published by the
  existing Pages deploy. Images come from the CloudFront default domain
  (`dxxxx.cloudfront.net`); the admin login page is on `*.amazoncognito.com`.
* **Route 53 is not required and is not created.** No DNS record changes are needed.
* Nothing on the existing site is modified by Terraform. (`https://vietanhphung.com/intimate`
  itself is a 404 today — the live invitation is at `/wed-invitation/intimate/`.)

## What Terraform creates

| Module | Resources |
|---|---|
| `photo-storage` | private S3 bucket (Block Public Access, SSE-S3, versioning, TLS-only policy, CORS for `https://vietanhphung.com` only, lifecycle) |
| `image-processor` | Lambda `nodejs22.x` arm64 + sharp, S3 notifications, retry config |
| `cognito` | identity pool (guests unauthenticated + admin authenticated), admin user pool (no self sign-up), hosted login domain, SPA client (code + PKCE, no secret), optional admin users |
| `iam` | guest role (`s3:PutObject original/*` only), admin role (list/read, delete `gallery/*.webp`), Lambda role (read/delete `original/*`, write `gallery/*`, list bucket, own logs) |
| `cloudfront` | distribution + Origin Access Control, managed CachingOptimized, CORS/security headers |
| `monitoring` | log group (30 days), error alarm, rejected-upload alarm, optional SNS email |

Not used: EC2, ECS, RDS, API Gateway, NAT, ALB, Route 53, DynamoDB (the gallery list is a
JSON manifest the Lambda rewrites with conditional S3 writes, so no database is needed).

## Prerequisites

* Terraform **>= 1.10** (S3 state locking). Your Mac has 1.9.5 from a stale Homebrew tap:
  ```bash
  brew untap hashicorp/tap && brew tap hashicorp/tap && brew upgrade hashicorp/tap/terraform
  ```
* AWS CLI v2, Node.js >= 20 (builds the Lambda), Python 3 (plan guard), Docker optional.
* Optional: `trivy` (or `tfsec`) and `tflint` — used automatically when installed.

## Region: us-east-2

This AWS account is a free-plan *project* inside an AWS-managed organization. Its preset
service control policy allows creating resources only in **us-east-2 (Ohio)** — `ca-central-1`
and `us-east-1` are denied even for administrators (tested). Global services (IAM, CloudFront)
work. Keep `aws_region = "us-east-2"` unless that guardrail changes.

## AWS authentication

Use your normal AWS login; nothing is stored in the repo.
```bash
aws sso login --profile wedding        # or: aws configure --profile wedding
export AWS_PROFILE=wedding
aws sts get-caller-identity             # must succeed
```
The identity needs permission to manage S3, Lambda, IAM roles, Cognito, CloudFront and
CloudWatch (e.g. `AdministratorAccess` on a personal account).

## Configuration

```bash
cd terraform/environments/production
cp terraform.tfvars.example terraform.tfvars     # gitignored
```
Set at least `admin_emails`. Everything else has defaults (`aws_region = us-east-2`,
`max_image_dimension = 1600`, `webp_quality = 80`, `max_upload_mb = 30`, …).
For local testing add `extra_allowed_origins = ["http://localhost:8000"]`.

## First run

```bash
make infra-bootstrap    # once: creates the versioned, encrypted state bucket, writes backend.hcl
make infra-check        # fmt -check, validate, trivy/tfsec if installed (no AWS calls)
make infra-plan         # builds the Lambda, init, validate, plan (read-only)
make infra-apply        # plan again, list changes, STOP if anything would be destroyed, ask, apply
```
`infra-apply` prints account / region / environment and the resources to create, then asks
`Continue with terraform apply? [y/N]`. Any destroy or replace makes it stop and print the
affected resources — nothing is applied. After apply it writes
`intimate/gallery/config.js` (public IDs only) and shows the outputs.

Equivalent without make: `./scripts/terraform.sh bootstrap|check|plan|apply|output|config|destroy`
(`ENV=production` is the default).

## Deploy the gallery page

The page is static and has no build step:
```bash
git add intimate/gallery/config.js && git commit -m "gallery: config" && git push
```
GitHub Pages publishes it with the rest of the site; nothing else on the site changes.
No `aws s3 sync` is involved, so no existing files can be deleted.

## Outputs

`photo_bucket_name`, `photo_bucket_arn`, `cloudfront_distribution_id`, `cloudfront_domain_name`,
`lambda_function_name`, `lambda_log_group`, `cognito_user_pool_id`, `cognito_user_pool_client_id`,
`cognito_identity_pool_id`, `cognito_hosted_ui_domain`, `gallery_url`. None are secrets.

## Admin setup

1. Put your address in `admin_emails` and apply. Cognito emails a temporary password
   (no password passes through Terraform or its state).
2. Open the gallery page → **Quản trị** (footer) → sign in → set a new password.
3. Optional: enable an authenticator app (TOTP) in the hosted login.
   Adding another admin later: add the email and apply, or
   `aws cognito-idp admin-create-user --user-pool-id <cognito_user_pool_id> --username <email>`.

## Verify after deploy

Infrastructure:
```bash
terraform -chdir=terraform/environments/production output
aws s3api get-public-access-block --bucket <photo_bucket_name>          # all true
aws lambda get-function --function-name <lambda_function_name> --query Configuration.State
```
Application (on the live page): `/wed-invitation/intimate/` still loads; the gallery page loads;
upload a photo → within seconds it appears; `aws s3 ls s3://<bucket>/original/` is empty again
and `gallery/<uuid>.webp` exists; admin login works; deleting removes the photo.

Security (with guest credentials, e.g. from the browser dev tools network tab):
* `aws s3 rm s3://<bucket>/gallery/<x>.webp` → AccessDenied (guests cannot delete)
* `aws s3 cp x.jpg s3://<bucket>/gallery/x.webp` → AccessDenied (guests cannot write gallery/)
* `aws s3 ls s3://<bucket>/` → AccessDenied (guests cannot list)
* `curl -I https://<bucket>.s3.<region>.amazonaws.com/gallery/<x>.webp` → 403 (bucket is private)
* `grep -rE 'AKIA|SecretAccessKey' intimate/gallery` → nothing (CI checks this too)

## CI/CD (`.github/workflows/infra.yml`)

* Every PR / push touching infra: `terraform fmt -check`, `validate`, Lambda + SigV4 tests,
  trivy scan, a check that no AWS keys are in the page. No AWS access needed.
* `plan` runs only if the repo variable `AWS_PLAN_ROLE_ARN` is set (GitHub OIDC role with
  read-only access + state bucket read). Also set `TF_STATE_BUCKET`, `AWS_REGION`,
  `TF_ADMIN_EMAILS` (JSON list, same as tfvars) and secret `TF_ALARM_EMAIL` if used.
* `apply` runs only on **Actions → infra → Run workflow** with *apply* ticked, on `main`, via the
  `production` environment — add required reviewers to it (Settings → Environments) so every
  apply needs explicit approval. It uses `AWS_APPLY_ROLE_ARN` and refuses destroy/replace.
* PRs never apply.

## Troubleshooting

| Symptom | Check |
|---|---|
| Upload fails with 403 | `config.js` matches outputs (`make infra-config`); page origin is in CORS (`domain_name`, `extra_allowed_origins`) |
| Photo never appears | Logs: `aws logs tail /aws/lambda/wedding-production-image-processor --follow`. `rejected:` lines = not an image or > `max_upload_mb`; the original stays in `original/` for `original_retention_days` |
| Re-process a stuck original | `aws s3 cp s3://<bucket>/original/<id>.jpg s3://<bucket>/original/<id>.jpg --metadata-directive REPLACE` (new ObjectCreated event) |
| iPhone HEIC upload rejected | iOS normally converts to JPEG when uploading through the browser; if not, Settings → Camera → Formats → Most Compatible |
| Admin login: "redirect_mismatch" | Open the page exactly at `gallery_url` (with trailing slash) |
| `terraform init` lock error | Another run holds the lock; wait, or `terraform force-unlock <id>` if it crashed |
| `BucketAlreadyExists` | Names include the account ID; set a different `project_name` |
| Restore a deleted photo | `aws s3api list-object-versions --bucket <b> --prefix gallery/<id>.webp`, then delete the delete-marker version (within `deleted_photo_retention_days`) |

## Cleanup / destroy

Never automatic. To remove everything:
1. Back up photos: `aws s3 sync s3://<bucket>/gallery/ ./gallery-backup/`
2. Empty the bucket including old versions (S3 console → Empty), because `force_destroy` is off.
3. Cognito user pool has `deletion_protection = "ACTIVE"`: set it to `"INACTIVE"` and apply first.
4. `make infra-destroy` — shows the destroy plan and requires typing `production`.
5. The state bucket (`terraform/bootstrap`, `prevent_destroy`) stays; remove it by hand if wanted.
Then revert `intimate/gallery/config.js` to empty values so the page shows "Album đang được chuẩn bị".

## Cost

Wedding-scale usage (a few thousand photos, ~100 guests) stays within or near the free tiers:
S3 storage of 1600 px WebP (~300 KB each) is cents per month; Lambda runs a few seconds per
photo; Cognito identity pools are free and the user pool is free under 10k MAU; CloudFront
`PriceClass_200` (includes Asian edges for guests in Vietnam) is ~$0.11/GB beyond the 1 TB free
tier; CloudWatch logs are kept 30 days. No fixed hourly costs (no NAT, EC2, RDS, ALB).
