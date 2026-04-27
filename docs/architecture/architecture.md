# Architecture

Status: Bootstrap baseline.

## Stack

- Frontend: React + Vite
- Backend: Express
- Database: SQLite
- Runtime: Docker Compose

## Architecture Direction

Use a simple full-stack architecture that is easy to run, inspect, test, and explain in an interview.

```text
Browser
  -> React/Vite frontend
  -> Express REST API
  -> SQLite persistence
```

## Principles

- Keep the content service as the primary product surface.
- Treat book order handling as business logic layered on top of content.
- Treat Lv3 export as serialization of one complete order package.
- Prefer explicit REST APIs over hidden framework magic.
- Keep the data model small enough to explain clearly.

## Initial Runtime Assumption

The final app should run through Docker Compose with configurable ports. Until the app is scaffolded, verification scripts should report bootstrap-pending status instead of failing.

