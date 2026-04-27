# Environment And Secret Policy

## Rules

- Do not commit `.env` or files containing real secrets.
- Commit `.env.example` only when environment variables are needed.
- Do not commit API keys, OAuth tokens, passwords, private keys, or personal credentials.
- Do not call `api.sweetbook.com` for this assignment.
- Keep local SQLite database files out of Git unless a deliberate seed fixture is added later.

## Allowed

- Documented placeholder values in `.env.example`
- Non-secret port and environment names
- Mock partner names and mock export metadata

## Review Checklist

Before commit or push:

- `git status --short` has no `.env`.
- No secret-looking value appears in staged files.
- Local DB files are not staged.
- Obsidian workspace files are ignored.

