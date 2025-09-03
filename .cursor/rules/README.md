# Cursor Rules for Agent Chat UI

This directory contains Cursor rules that help with codebase navigation, understanding, and development standards for the Agent Chat UI project.

## Rule Files

1. **01-project-architecture.mdc** - Project structure and architecture overview
2. **02-typescript-standards.mdc** - TypeScript coding standards and best practices
3. **03-react-components.mdc** - React component development guidelines
4. **04-ui-styling.mdc** - UI styling guidelines using Tailwind CSS and shadcn/ui
5. **05-langgraph-api.mdc** - LangGraph API integration patterns and streaming
6. **06-development-workflow.mdc** - Development workflow and best practices

## How These Rules Work

- **Always Applied**: Rules marked with `alwaysApply: true` are automatically used in every AI request
- **File-Specific**: Rules with `globs` patterns apply only to matching file types (e.g., `*.tsx` for React components)
- **Manual**: Rules with descriptions can be manually referenced when needed

## Key Technologies Covered

- **Frontend**: Next.js 15, React 19, TypeScript 5.7
- **Styling**: Tailwind CSS 4.0, shadcn/ui (New York style)
- **API**: LangGraph SDK, streaming integration
- **Build**: pnpm, ESBuild, PostCSS
- **Quality**: ESLint, Prettier, TypeScript strict mode

## Important Notes

1. **Virtual Environment**: Always activate the 'uv' virtual environment before running commands
2. **Private Deployment**: This project uses internal API proxy for security - never expose real LangGraph URLs to clients
3. **Styling**: Use semantic color variables and the `cn()` utility for class merging
4. **TypeScript**: Follow strict typing patterns and use proper imports with `@/` aliases

## Quick Reference

- Main entry point: `src/app/page.tsx`
- Component library: `src/components/ui/` (shadcn/ui)
- Chat components: `src/components/thread/`
- Providers: `src/providers/Stream.tsx` and `src/providers/Thread.tsx`
- Utilities: `src/lib/utils.ts`
- API proxy: `src/app/api/[..._path]/route.ts`

For detailed information, refer to the specific rule files.
