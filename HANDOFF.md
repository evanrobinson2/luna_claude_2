# Luna — Cursor Handoff

## What This Is

Luna is a complete Next.js 14 creative AI storytelling app. It's fully scaffolded and ready to deploy. The user co-creates stories with an AI narrator (GPT-4o). The AI automatically generates images (DALL-E 3) when meaningful story events occur, and maintains a living knowledge graph of characters, locations, events, and world rules.

## Files

Everything lives in `luna/` at the root of this repo. It is a self-contained Next.js app — deploy it independently of the jellyfish monorepo.

```
luna/
  app/                  — Next.js App Router pages + API routes
  components/           — React components
  lib/                  — DB helpers, OpenAI client, AI logic
  types/index.ts        — All shared TypeScript types
  middleware.ts         — Password protection
  package.json          — Dependencies (Next 14, OpenAI, React Flow, Zustand, Framer Motion)
```

## To Deploy on Vercel

1. Create a new Vercel project pointing at the `luna/` subdirectory (set **Root Directory** to `luna` in Vercel settings)
2. Add a **Vercel Postgres** database to the project (it auto-sets `POSTGRES_URL`)
3. Add these environment variables:
   ```
   OPENAI_API_KEY=sk-...
   PASSWORD=your_chosen_password
   ```
4. Deploy. The DB schema runs automatically on first request (`lib/schema.sql` via `ensureSchema()`).

## Key Architecture

| Piece | File | What it does |
|---|---|---|
| AI narrator | `app/api/messages/route.ts` | GPT-4o chat, then parallel: image reasoning + knowledge extraction |
| Image reasoning | `lib/imageReasoning.ts` | GPT-4o decides if scene warrants image generation |
| Knowledge extraction | `lib/knowledge.ts` | GPT-4o extracts entities → upserts nodes/edges |
| Prompt builder | `lib/promptBuilder.ts` | Injects style tokens + character visual descriptions into DALL-E prompt |
| Turnaround sheets | `app/api/turnaround/route.ts` | Generates 6 reference images (front/side/back/¾/face×2) for main characters |
| Knowledge graph UI | `components/KnowledgeGraph.tsx` | React Flow canvas, pannable/zoomable, Minority Report aesthetic |
| Auth | `middleware.ts` | Cookie `luna_auth` checked against `PASSWORD` env var |

## DB Schema (6 tables)

- `stories` — each story/nav entry
- `messages` — chat history per story
- `story_images` — generated images with prompt + metadata
- `knowledge_nodes` — characters, locations, events, style rules, etc. (JSONB attributes, extensible)
- `knowledge_edges` — links between nodes
- `turnaround_images` — reference sheet images linked to character nodes

## Known Issues / Next Steps

1. **The `lib/` files were committed but the git push is blocked in the Claude Code session** — just copy `luna/` to a fresh repo or push via your own credentials to `evanrobinson2/luna_claude_2`

2. **New images auto-advance the active thumbnail** — already wired in `lib/store.ts` (`addImage` sets `activeImageIndex` to the new image)

3. **Turnaround sheets don't appear in the knowledge graph until page refresh** — the `turnaroundMap` in `KnowledgeGraph.tsx` is currently a stub (`{}`). To fix: fetch turnaround images per character node on expand, or load them into Zustand store

4. **Knowledge graph nodes don't re-layout when new nodes are added during chat** — React Flow `useNodesState` is initialized from `rfNodes` on mount. To fix: sync `useNodesState` when `knowledgeNodes` changes in the store (currently needs a manual refresh)

5. **No streaming** — the chat response waits for the full GPT-4o response before displaying. Can be upgraded to streaming with `openai.chat.completions.stream()` and `ReadableStream` in the API route

6. **Supabase migration** — when ready to swap from Vercel Postgres, replace `@vercel/postgres` with `@supabase/supabase-js` in `lib/db.ts`. The raw SQL schema works as-is with any Postgres.

## Feature Ideas Already Discussed

- Gallery view (all images across stories, filterable by character/location)
- Export story as illustrated PDF / chapter
- Video + game containers (the `media_types[]` column on `stories` is already there for extensibility)
- Character status auto-promotion triggers automatic turnaround generation
