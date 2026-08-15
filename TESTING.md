# Testing Guide

## Test files

The automated tests are stored in:

- `tests/core-utils.test.ts`

## Run the tests

From the project folder:

```bash
npm test
```

The command runs every `tests/*.test.ts` file with Node's test runner through `tsx`.

## Latest test result

Last run: 2026-08-15

- 11 tests passed
- 0 failed
- 0 skipped

## Covered behavior

- Product lookup and fallback details
- Offline Gemma responses and localization
- Connectivity behavior
- Offline action queue persistence and clearing
- Offline disease library validation
- Diagnosis confidence safety limits
- Unavailable diagnosis handling
- User-scoped stored diagnosis records
- Profile input sanitization

