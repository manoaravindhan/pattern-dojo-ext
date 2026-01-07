# Contributing to Pattern Lens

Thanks for considering a contribution! This project focuses on TypeScript/JavaScript pattern analysis for VS Code.

## Quick Start
- Fork and clone the repo
- Install dependencies: `npm install`
- Build: `npm run compile`
- Run tests: `npm test`

## Development Workflow
1) Create a branch from `main`
2) Make changes with tests/docs as needed
3) Run `npm run compile` and `npm test`
4) Submit a PR with a clear description

## Code Style
- TypeScript (ES2020), strict typings preferred
- Keep UI text concise; favor VS Code theming tokens
- Add comments only where intent is non-obvious

## Testing
- Unit tests live in `src/test/unit`
- Prefer small, focused tests per provider/analyzer change

## Commit Guidance
- Write clear, imperative commit messages
- Group related changes in a single commit when possible

## Issue Reports
Include:
- VS Code version
- Extension version
- Repro steps + minimal sample
- Expected vs actual behavior

## PR Review Checklist
- [ ] Build passes (`npm run compile`)
- [ ] Tests pass (`npm test`)
- [ ] No lint errors (if applicable)
- [ ] Docs updated when behavior changes
