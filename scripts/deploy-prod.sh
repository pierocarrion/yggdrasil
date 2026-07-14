#!/bin/bash
# Shortcut: deploy to prod. Usage: ./scripts/deploy-prod.sh [short_sha]
exec "$(dirname "${BASH_SOURCE[0]}")/deploy.sh" prod "${1:-}"
