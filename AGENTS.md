<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# AGENTS.md
- Data access goes through the browser client in `src/lib/data.ts`; row-level security is the authorization layer (users only see their own rows; admin via `has_role`).
- Derived metrics (attendance %, urgency, GPA, countdowns) are computed in `src/lib/calc.ts`, never stored — keeps one source of truth.
- Signed-in pages live under `src/routes/_authenticated/_app/` (shell + onboarding gate); onboarding sits outside `_app` to avoid redirect loops.
- Notifications are generated idempotently by the `refresh_my_notifications` database function (dedupe keys) on app load — no polling job.
- Demo data is flagged `is_demo` and seeded/cleared per user via database functions, so it never mixes with real records.
