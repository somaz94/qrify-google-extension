.PHONY: help install test test-cover lint lint-fix package version bump-version clean

PACKAGE := dist/qrify.zip

help: ## Show available commands
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Install dev dependencies (jest, eslint)
	npm install --registry https://registry.npmjs.org

test: ## Run unit tests
	npm test

test-cover: ## Run tests with coverage (fails under 90%)
	npm run test:coverage

lint: ## Run ESLint
	npm run lint

lint-fix: ## Run ESLint with auto-fix
	npm run lint:fix

package: clean ## Package the extension into a ZIP for the Chrome Web Store
	@mkdir -p dist
	zip -r $(PACKAGE) manifest.json _locales/ src/ icons/ LICENSE README.md -x "*.DS_Store"
	@echo ""
	@echo "  ✓ $(PACKAGE) created"
	@ls -lh $(PACKAGE)

clean: ## Remove build artifacts
	rm -rf dist/

version: ## Show the current version
	@hack/bump-version.sh --current

bump-version: ## Bump the version (usage: make bump-version VERSION=1.2.0)
	@if [ -z "$(VERSION)" ]; then \
		echo "Usage: make bump-version VERSION=1.2.0"; \
		exit 1; \
	fi
	@hack/bump-version.sh $(VERSION)
