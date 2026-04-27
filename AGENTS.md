# AGENTS.md

## Project Goal

Build the Sweetbook assignment as a Docker-runnable full-stack web application that reaches Lv3:

- Lv1: content service core flow
- Lv2: book order creation and status management
- Lv3: structured order data export

The content service is the main product. Book printing is an add-on workflow. Do not call `api.sweetbook.com`.

## Current Phase

Start from the harness. Do not pick the service topic until `docs/product/problem-brief.md` and `docs/product/product-spec.md` are completed.

## Working Rules

- Prefer small, verifiable changes.
- Work on `dev` by default.
- Push to `dev` after a minimum feature unit passes verification.
- Update relevant docs when decisions, scope, or verification results change.
- Do not commit secrets, API keys, `.env`, local DB files, build outputs, or Obsidian workspace files.

## Verification

- Fast gate: `scripts/verify-fast.sh`
- Full gate: `scripts/verify-full.sh`
- Quality score reference: `docs/reliability/quality-score.md`
- Verification log: `docs/reliability/verification-log.md`

## Docs Map

- Assignment and product planning: `docs/product/`
- Architecture and API/data decisions: `docs/architecture/`
- Execution plans: `docs/exec-plans/`
- Reliability and quality loop: `docs/reliability/`
- Environment and secret policy: `docs/security/`

