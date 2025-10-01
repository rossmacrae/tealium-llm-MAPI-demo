# Update & Release One‑Pager — tealium-llm-MAPI-demo (since v3.1.0)

**Defaults**
- Default branch: `main`
- Merge policy (chosen for solo dev): **Rebase + fast‑forward** (keeps history linear, no merge commits)
- Package manager: **npm**
- Release automation: **none** (manual but quick)
- Future: **Docker image** (stubbed step included)

---

## A) Quick Flow (copy/paste)

```bash
# 0) From repo root
git status

# 1) Sync local with GitHub
git checkout main
git fetch --all --prune
git pull --ff-only

# 2) Create a short-lived branch for this change round
git checkout -b feat/<topic>   # or fix/<topic>, chore/<topic>

# 3) Work → stage → commit (repeat as needed)
git add -A
git commit -m "feat: <what changed>"

# 4) Push branch
git push -u origin HEAD

# 5) (Optional) Open PR; as a solo dev, you can skip PR and rebase-merge yourself

# 6) Rebase onto latest main to keep history linear
git checkout main
git pull --ff-only
git checkout feat/<topic>
git rebase main
git checkout main
git merge --ff-only feat/<topic>   # fast-forward merge (no merge commit)

# 7) Delete the topic branch locally & remote (optional cleanup)
git branch -d feat/<topic>
git push origin --delete feat/<topic>

# 8) Version bump (choose ONE)
npm version patch    # 3.1.0 -> 3.1.1  (bug fixes / tiny changes)
# npm version minor  # 3.1.0 -> 3.2.0  (new features, backward compatible)
# npm version major  # 3.1.0 -> 4.0.0  (breaking changes)

# 9) Push code + tags
git push
git push --tags

# 10) Draft GitHub Release (Web UI)
#    Tag: vX.Y.Z  | Title: vX.Y.Z
#    Notes: highlights, breaking changes, run instructions

# 11) (Future) Build & push Docker image (placeholder)
# docker build -t ghcr.io/rossmacrae/tealium-llm-mapi-demo:vX.Y.Z .
# echo $CR_PAT | docker login ghcr.io -u rossmacrae --password-stdin
# docker push ghcr.io/rossmacrae/tealium-llm-mapi-demo:vX.Y.Z
```

---

## B) When to bump which version
- **Patch**: safe bug fixes, tiny refactors, doc-only changes that ship (`3.1.0 → 3.1.1`).
- **Minor**: new features, defaults preserved, no breaking changes (`3.1.0 → 3.2.0`).
- **Major**: breaking changes (env var rename, API change, folder moves) (`3.1.0 → 4.0.0`).

> `npm version` updates `package.json` & lockfile, creates a release commit and a `vX.Y.Z` tag automatically.

---

## C) Commit style (short & useful)
Use Conventional Commits for good release notes:
- `feat: ` new feature
- `fix: ` bug fix
- `refactor: ` internal change
- `docs: ` readme or guides
- `chore: ` tooling, deps, config
- `perf: ` performance

> If you break something intentionally, add in the body:  
> `BREAKING CHANGE: explain the change and migration`

---

## D) Optional PR (solo‑dev pattern)
Even as a solo dev, a PR is handy as a personal change log with screenshots & test steps:
- What changed (bullets)
- Why (quick context)
- How to test (commands/URL/env vars)
- Risk/rollback note (one‑liner)
- Screenshots/log snippets where helpful

If you skip PRs, keep the rebase + fast‑forward step so `main` stays linear.

---

## E) Lightweight pre‑release checklist
- [ ] On `main` and up‑to‑date (`git pull --ff-only`)
- [ ] Topic branch cleaned up (rebase, fast-forward merged)
- [ ] `README.md` / examples updated if needed
- [ ] **Version bumped** via `npm version` (patch/minor/major)
- [ ] `git push && git push --tags`
- [ ] GitHub Release drafted with highlights & any run notes
- [ ] (Future) Docker image built & pushed (if you choose to publish images)

---

## F) Common fixes

**Rebase onto latest main (conflicts possible):**
```bash
git checkout feat/<topic>
git fetch origin
git rebase origin/main
# resolve conflicts -> git add <files>
git rebase --continue
```

**Amend last message:**
```bash
git commit --amend -m "fix: clarify Moments API endpoint path"
git push -f  # only for your own feature branch
```

**Stash WIP quickly:**
```bash
git stash -u
git pull --ff-only
git stash pop
```

**Delete a wrong tag (local and remote):**
```bash
git tag -d v3.2.0
git push origin :refs/tags/v3.2.0
```

---

## G) Next steps to Docker (when ready)
1) Add a `Dockerfile` (multi‑stage if you build assets).  
2) Add a `docker-build-push.sh` that tags with `vX.Y.Z` and `latest`.  
3) Publish to GHCR or ECR; reference image in your deployment notes (App Runner, ECS, etc.).

> Keep image build reproducible by **only tagging from release tags** (never from random commits).

---

**That’s it.** This one‑pager plus the quick flow at the top will carry every update from working tree → GitHub → tagged release, with a clean linear history and an easy on‑ramp to Docker images later.
