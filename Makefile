# Wedding gallery infrastructure (see terraform/README.md). ENV=production by default.
.PHONY: infra-bootstrap infra-check infra-plan infra-apply infra-output infra-config infra-destroy lambda-test lambda-build

infra-bootstrap: ## one-time: create the Terraform state bucket
	./scripts/terraform.sh bootstrap

infra-check: ## fmt + validate + security scan (no AWS access needed)
	./scripts/terraform.sh check

infra-plan: ## read-only plan
	./scripts/terraform.sh plan

infra-apply: ## plan, refuse destroys, confirm, apply, write gallery config
	./scripts/terraform.sh apply

infra-output:
	./scripts/terraform.sh output

infra-config: ## regenerate intimate/gallery/config.js from outputs
	./scripts/terraform.sh config

infra-destroy: ## shows a destroy plan; asks you to type the environment name
	./scripts/terraform.sh destroy

lambda-test:
	cd lambda/image-processor && npm ci --no-audit --no-fund && npm test

lambda-build:
	./lambda/image-processor/build.sh
