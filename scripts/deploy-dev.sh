#!/bin/bash
# Shortcut: deploy to dev. Usage: ./scripts/deploy-dev.sh [short_sha]
exec "$(dirname "${BASH_SOURCE[0]}")/deploy.sh" dev "${1:-}"
