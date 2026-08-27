# Development variables
BRANCH := $(shell git branch --show-current 2>/dev/null || echo "unknown")
REMOTES := $(shell git remote 2>/dev/null || echo "")

.DEFAULT_GOAL := help

.PHONY: help build serve clean push push-lease branch\:%

# ----- Menu help -----
help:
	@echo "Available targets:"
	@echo "  make build"
	@echo "  make serve"
	@echo "  make clean"
	@echo "  make push"
	@echo "  make push-lease"
	@echo "  make branch:del <branch>"

build:
	@npm run build

serve:
	@npm run dev

clean:
	@rm -rf dist .astro _pages .jekyll-cache

# ----- GIT -----
commit:
	@if ! git diff-index --quiet HEAD --; then \
		git add .; \
		git commit -m "$$(date +Date:%Y-%m-%d-Time:%H:%M:%S)"; \
	else \
		echo "Nothing to commit"; \
	fi

push: commit
	@echo "Push normal → branch: $(BRANCH)"
	@for remote in $(REMOTES); do \
		echo "  pushing to $$remote..."; \
		git push $$remote $(BRANCH); \
	done

push-lease: commit
	@echo "Push --force-with-lease → branch: $(BRANCH)"
	@for remote in $(REMOTES); do \
		echo "  pushing to $$remote..."; \
		git push --force-with-lease $$remote $(BRANCH); \
	done

# Usage: make branch:del dev
branch\:%:
	@b="$(filter-out $@,$(MAKECMDGOALS))"; \
	if [ -z "$$b" ]; then echo "Usage: make branch:del <branch>"; exit 1; fi; \
	if [ -n "$(REMOTES)" ]; then \
		for remote in $(REMOTES); do \
			echo "  deleting $$remote/$$b..."; \
			git push $$remote --delete "$$b" || true; \
		done; \
	else \
		echo "  no remotes configured"; \
	fi; \
	echo "  deleting local branch $$b..."; \
	git branch -D "$$b"

# Swallow bare arguments passed to the targets above (e.g. `make version 0.3.20`)
%:
	@:
