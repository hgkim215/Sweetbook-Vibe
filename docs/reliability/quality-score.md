# Quality Score

Status: Bootstrap baseline.

Scores use a 1-5 scale.

| Score | Meaning |
|---|---|
| 5 | Strong submission signal |
| 4 | Submission-ready with minor improvement room |
| 3 | Works but has evaluation risk |
| 2 | Incomplete implementation or explanation |
| 1 | Must fix before submission |

## Current Scores

| Area | Score | Notes |
|---|---:|---|
| Product Fit | 1 | Topic not fixed yet. |
| Lv1 Completeness | 1 | App not implemented yet. |
| Lv2 Business Logic | 1 | App not implemented yet. |
| Lv3 Export Quality | 1 | App not implemented yet. |
| UX Clarity | 1 | App not implemented yet. |
| Architecture | 2 | Baseline stack selected. Detailed API/data model pending. |
| Test Coverage | 1 | Test harness pending app scaffold. |
| Docker Reliability | 1 | Docker config pending app scaffold. |
| README Quality | 1 | Submission README pending. |

## Iteration Rule

After each completed implementation unit:

1. Re-score all areas.
2. Pick the lowest-scoring area.
3. Define one small improvement.
4. Implement, verify, commit, and push to `dev`.
5. Record the result in `docs/reliability/verification-log.md`.

