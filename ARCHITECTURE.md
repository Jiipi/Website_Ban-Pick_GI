# Architecture

This project uses a layered architecture inside the Next.js runtime.

## Layers

1. Presentation: `src/app`, `src/components`, `src/presentation`
   - Reads HTTP requests, route params, cookies.
   - Renders UI and maps service results to `NextResponse`.
   - Must not import database clients, repositories, or infrastructure adapters directly.

2. Application: `src/application`
   - Contains service classes and port interfaces.
   - Owns use cases such as creating rooms, submitting draft turns, saving builds, lobby invites, chat, and profile updates.
   - Depends on domain policies and port interfaces, not concrete data adapters.

3. Domain: `src/domain`
   - Contains pure business rules and types.
   - No Next.js, Supabase, fetch, cookies, or HTTP response objects.

4. Infrastructure: `src/infrastructure`
   - Implements application ports using Supabase, Enka, and Genshin data sources.
   - May import Supabase data clients and external SDKs.

5. Composition root: `src/composition`
   - Wires infrastructure adapters into application services.
   - Presentation may import this root to call services.

## Rules For New Features

- Add domain rules first when the rule can be tested without I/O.
- Add or extend an application service for each use case.
- Add repository/gateway methods behind application ports for database or external API access.
- Keep `route.ts` files thin: parse request, call service, return response.
- Keep server pages thin: read cookies/params, call service/query method, render UI.
- Never import database clients, `@/infrastructure/*`, or `@supabase/supabase-js` from `src/app` or `src/components`.
