# drawio-claude

A TypeScript CLI tool that generates professional draw.io diagrams from JSON graph descriptions.

## Quick Reference

- **Language**: TypeScript (strict mode)
- **Package manager**: pnpm
- **Test framework**: Vitest
- **Build tool**: tsup
- **Node version**: >= 18
- **Output formats**: `.drawio.svg` (default), `.drawio`

## Commands

```bash
pnpm install          # Install dependencies
pnpm test             # Run all tests
pnpm test:watch       # Run tests in watch mode
pnpm build            # Build with tsup
pnpm dev              # Run CLI in dev mode (tsx)
```

## Architecture

JSON DSL input → validated graph model → themed + styled → laid out (ELK.js) → draw.io XML → export

Key principle: Claude describes diagrams via JSON; all XML generation is in tested code. Claude never writes draw.io XML directly.

### Module Layout

- `src/cli.ts` — CLI entry point
- `src/schema/` — Zod schemas + JSON DSL types
- `src/core/` — Graph builder, XML generator, XML validator
- `src/layout/` — ELK.js integration, manual coordinate handling
- `src/export/` — .drawio and .drawio.svg exporters
- `src/themes/` — Built-in theme definitions
- `src/shapes/` — Shape type registry (type name → draw.io style string)

### Key Libraries

- `elkjs` for auto-layout (uses `INCLUDE_CHILDREN` for compound/grouped layouts)
- `pako` for deflate compression in .drawio.svg embedding
- `zod` for input validation
- `commander` for CLI

## Conventions

- All files start with a 2-line `// ABOUTME:` comment
- Unit tests live in `src/__tests__/unit/`
- Snapshot tests live in `src/__tests__/snapshots/`
- Shape registries export a `Record<string, string>` mapping friendly names to draw.io style strings
- Themes export a `Theme` type with fill, stroke, font, and edge defaults

## Resolved Decisions

- Native XML generation (no mxGraph/maxGraph dependency)
- Straight + orthogonal edge routing in v1 (curved/entity-relation deferred)
- Single-page diagrams only in v1 (multi-page deferred)
- JSON DSL is the API contract — version it if breaking changes are needed
