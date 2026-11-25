#!/usr/bin/env bash
# Wedding gallery infrastructure — safe wrapper around Terraform.
#
#   ./scripts/terraform.sh bootstrap   one-time: create the S3 state bucket, write backend.hcl
#   ./scripts/terraform.sh check       fmt + validate + security scan (no AWS changes, no creds needed)
#   ./scripts/terraform.sh plan        build Lambda, init, check, plan (read-only)
#   ./scripts/terraform.sh apply       plan, refuse if anything would be destroyed, ask, apply, write page config
#   ./scripts/terraform.sh output      show outputs
#   ./scripts/terraform.sh config      write intimate/gallery/config.js from outputs
#   ./scripts/terraform.sh destroy     show a destroy plan; destroying needs typing the environment name
#
# ENV=production (default) selects terraform/environments/$ENV. AWS credentials come from the
# usual chain (AWS_PROFILE, SSO, env vars, instance role) — nothing is stored here.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV="${ENV:-production}"
TF_DIR="$ROOT/terraform/environments/$ENV"
BOOT_DIR="$ROOT/terraform/bootstrap"
LAMBDA_DIR="$ROOT/lambda/image-processor"
PLAN_FILE="$TF_DIR/tfplan"
CONFIG_JS="$ROOT/intimate/gallery/config.js"
MIN_TF="1.10.0"

red() { printf '\033[31m%s\033[0m\n' "$*"; }
bold() { printf '\033[1m%s\033[0m\n' "$*"; }
die() { red "✗ $*" >&2; exit 1; }

need_terraform() {
  command -v terraform >/dev/null || die "terraform not found. Install >= $MIN_TF (see terraform/README.md)."
  local v
  v="$(terraform version -json 2>/dev/null | sed -n 's/.*"terraform_version": *"\([^"]*\)".*/\1/p')"
  [ "$(printf '%s\n%s\n' "$MIN_TF" "$v" | sort -V | head -1)" = "$MIN_TF" ] ||
    die "terraform $v is too old; need >= $MIN_TF for S3 state locking (see terraform/README.md)."
}

need_aws() {
  command -v aws >/dev/null || die "aws CLI not found."
  local ident
  ident="$(aws sts get-caller-identity --output text --query '[Account,Arn]' 2>&1)" ||
    die "AWS authentication failed: $ident
  Log in first, e.g. 'aws sso login --profile <p>' and 'export AWS_PROFILE=<p>'."
  AWS_ACCOUNT="$(cut -f1 <<<"$ident")"
  AWS_ARN="$(cut -f2 <<<"$ident")"
}

need_env() {
  [ -d "$TF_DIR" ] || die "unknown environment '$ENV' ($TF_DIR missing)."
  [ -f "$TF_DIR/backend.hcl" ] || die "$TF_DIR/backend.hcl missing — run '$0 bootstrap' first (or copy backend.hcl.example)."
}

region() {
  local r
  r="$(sed -n 's/^ *aws_region *= *"\(.*\)".*/\1/p' "$TF_DIR/terraform.tfvars" 2>/dev/null | head -1)"
  echo "${r:-${AWS_REGION:-us-east-2}}"
}

build_lambda() {
  bold "→ Building Lambda package (sharp for linux-arm64)"
  "$LAMBDA_DIR/build.sh"
}

tf_init() {
  bold "→ terraform init ($ENV)"
  terraform -chdir="$TF_DIR" init -input=false -backend-config=backend.hcl >/dev/null
}

check() {
  bold "→ terraform fmt -check"
  terraform fmt -check -recursive "$ROOT/terraform" || die "formatting issues: run 'terraform fmt -recursive terraform'."
  bold "→ terraform validate"
  terraform -chdir="$BOOT_DIR" init -backend=false -input=false >/dev/null
  terraform -chdir="$BOOT_DIR" validate -no-color
  if [ "${1:-}" = "with-backend" ]; then
    terraform -chdir="$TF_DIR" validate -no-color # already initialised with the real backend
  else
    # No credentials/backend needed: separate data dir so a real init is not disturbed.
    TF_DATA_DIR="$TF_DIR/.terraform-validate" terraform -chdir="$TF_DIR" init -backend=false -input=false >/dev/null
    TF_DATA_DIR="$TF_DIR/.terraform-validate" terraform -chdir="$TF_DIR" validate -no-color
  fi
  # Optional linters / scanners: used when installed, never required.
  if command -v tflint >/dev/null; then bold "→ tflint"; tflint --chdir="$TF_DIR" --recursive || die "tflint failed"; fi
  if command -v trivy >/dev/null; then
    bold "→ trivy config"; trivy config --quiet --exit-code 1 --severity HIGH,CRITICAL "$ROOT/terraform" || die "trivy found issues"
  elif command -v tfsec >/dev/null; then
    bold "→ tfsec"; tfsec "$ROOT/terraform" --minimum-severity HIGH || die "tfsec found issues"
  else
    echo "  (trivy/tfsec not installed — security scan skipped; CI runs it)"
  fi
}

# Print the plan's create/update/replace/destroy lists (scripts/plan_guard.py).
# Returns 0 = safe changes, 1 = destroys/replaces something, 3 = no changes.
review_plan() {
  local json="$PLAN_FILE.json" rc=0
  terraform -chdir="$TF_DIR" show -json "$PLAN_FILE" >"$json"
  python3 "$ROOT/scripts/plan_guard.py" "$json" || rc=$?
  rm -f "$json"
  return "$rc"
}

plan() {
  need_terraform; need_env; need_aws
  build_lambda
  tf_init
  check with-backend
  bold "→ terraform plan"
  terraform -chdir="$TF_DIR" plan -input=false -out="$PLAN_FILE"
}

apply() {
  plan
  echo
  bold "AWS account: $AWS_ACCOUNT"
  bold "Identity:    $AWS_ARN"
  bold "Region:      $(region)"
  bold "Environment: $ENV"
  local rc=0
  review_plan || rc=$?
  if [ "$rc" = 1 ]; then
    echo
    red "Nothing was applied. Review the plan; if it is really intended, apply it manually:"
    echo "  terraform -chdir=$TF_DIR apply $PLAN_FILE"
    exit 2
  fi
  if [ "$rc" = 0 ]; then
    echo
    read -r -p "Continue with terraform apply? [y/N] " ans
    [[ "$ans" =~ ^[Yy]$ ]] || { echo "Aborted — nothing applied."; rm -f "$PLAN_FILE"; exit 1; }
    terraform -chdir="$TF_DIR" apply -input=false "$PLAN_FILE"
  fi
  rm -f "$PLAN_FILE"
  write_config
  outputs
}

outputs() {
  bold "→ Outputs"
  terraform -chdir="$TF_DIR" output
}

write_config() {
  bold "→ Writing ${CONFIG_JS#"$ROOT"/}"
  local out
  out="$(mktemp)"
  terraform -chdir="$TF_DIR" output -json >"$out"
  python3 - "$out" "$CONFIG_JS" <<'PY'
import json, sys
o = {k: v["value"] for k, v in json.load(open(sys.argv[1])).items()}
cfg = {
    "region": o["aws_region"],
    "identityPoolId": o["cognito_identity_pool_id"],
    "bucket": o["photo_bucket_name"],
    "cdnDomain": o["cloudfront_domain_name"],
    "originalPrefix": o["original_prefix"],
    "photoPrefix": o["photo_prefix"],
    "maxUploadMb": o["max_upload_mb"],
    "galleryUrl": o["gallery_url"],
    "cognito": {
        "domain": o["cognito_hosted_ui_domain"],
        "clientId": o["cognito_user_pool_client_id"],
        "userPoolId": o["cognito_user_pool_id"],
    },
}
with open(sys.argv[2], "w") as f:
    f.write("/* Generated by `./scripts/terraform.sh config` from Terraform outputs — do not edit by hand.\n"
            "   These are public identifiers (the browser needs them); there are no secrets here.\n"
            "   While empty, the page shows \"Album đang được chuẩn bị\". */\n")
    f.write("window.GALLERY = " + json.dumps(cfg, indent=2, ensure_ascii=False) + ";\n")
PY
  rm -f "$out"
  echo "  Commit and push it to publish the gallery page (GitHub Pages)."
}

bootstrap() {
  need_terraform; need_aws
  local r; r="$(region)"
  bold "→ Bootstrap state bucket in $r (account $AWS_ACCOUNT)"
  terraform -chdir="$BOOT_DIR" init -input=false >/dev/null
  terraform -chdir="$BOOT_DIR" plan -input=false -var "aws_region=$r" -out=tfplan
  read -r -p "Create the state bucket? [y/N] " ans
  [[ "$ans" =~ ^[Yy]$ ]] || { echo "Aborted."; exit 1; }
  if ! terraform -chdir="$BOOT_DIR" apply -input=false tfplan; then
    rm -f "$BOOT_DIR/tfplan"
    die "bootstrap failed — backend.hcl not written."
  fi
  rm -f "$BOOT_DIR/tfplan"
  local bucket
  bucket="$(terraform -chdir="$BOOT_DIR" output -raw state_bucket)" || die "could not read the state bucket name."
  [ -n "$bucket" ] || die "empty state bucket name — backend.hcl not written."
  printf 'bucket = "%s"\nregion = "%s"\n' "$bucket" "$r" >"$TF_DIR/backend.hcl"
  echo "  wrote ${TF_DIR#"$ROOT"/}/backend.hcl"
}

destroy() {
  need_terraform; need_env; need_aws
  tf_init
  terraform -chdir="$TF_DIR" plan -destroy -input=false -out="$PLAN_FILE"
  echo
  red "This DELETES the gallery infrastructure in account $AWS_ACCOUNT ($ENV)."
  red "The photo bucket has force_destroy=false: if it still holds photos, AWS refuses to delete it."
  red "Back up photos first (see terraform/README.md → Cleanup)."
  read -r -p "Type the environment name ($ENV) to destroy: " ans
  [ "$ans" = "$ENV" ] || { echo "Aborted — nothing destroyed."; rm -f "$PLAN_FILE"; exit 1; }
  terraform -chdir="$TF_DIR" apply -input=false "$PLAN_FILE"
  rm -f "$PLAN_FILE"
}

case "${1:-}" in
  bootstrap) bootstrap ;;
  check) need_terraform; check ;;
  plan) plan; rc=0; review_plan || rc=$?; [ "$rc" != 1 ] || red "Note: 'apply' will refuse this plan." ;;
  apply) apply ;;
  output) need_terraform; need_env; need_aws; tf_init; outputs ;;
  config) need_terraform; need_env; need_aws; tf_init; write_config ;;
  destroy) destroy ;;
  *) sed -n '2,13p' "$0" | sed 's/^# \{0,1\}//'; exit 1 ;;
esac
