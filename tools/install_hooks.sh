#!/bin/sh
# One-time setup: run tools/stamp_version.sh automatically before every commit.
cd "$(dirname "$0")/.."
printf '#!/bin/sh\nexec ./tools/stamp_version.sh\n' > .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit tools/stamp_version.sh
echo "pre-commit hook installed"
