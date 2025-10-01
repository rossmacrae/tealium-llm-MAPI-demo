# 🚀 Update & Release One-Pager — tealium-llm-MAPI-demo (solo-dev, npm, GitHub)

**Defaults**  
- Branch: `main`  
- Solo dev: you commit directly to `main`  
- Version bumps: `npm version …` keeps `package.json` and tags aligned  
- Publishing: `git push && git push --tags` sends everything to GitHub  
- Docker: optional future step  

---

## A) Quick Flow (with explanations)

```bash
# 0) Sanity check: what’s changed locally?
git status                # shows uncommitted changes & if you’re ahead/behind GitHub

# 1) Make sure main is clean & up-to-date
git checkout main         # switch to the main branch
git fetch --all --prune   # updates Git’s knowledge of GitHub, never touches your files
git pull --ff-only        # safe: will only update if no conflict; otherwise aborts (won’t overwrite)

# 2) Stage and commit your changes
git add -A                # stage all changed files
git commit -m "feat: describe what you changed"  # save a snapshot in Git

# 3) Bump version (choose one)
npm version patch         # x.y.Z → x.y.(Z+1), bugfix/small change
# npm version minor       # x.(Y+1).0, new feature, backwards-compatible
# npm version major       # (X+1).0.0, breaking change
# npm version 3.1.1       # or set explicitly if needed

# (this command does three things:)
#  - updates package.json
#  - creates a Git commit "vX.Y.Z"
#  - creates a Git tag "vX.Y.Z"

# 4) Verify
cat package.json | grep version          # should show the new version
git tag --list --sort=-v:refname | head  # new tag should be at the top

# 5) Push everything to GitHub
git push                 # sends commits to GitHub
git push --tags          # sends version tags to GitHub

# 6) Draft a Release in GitHub web UI (optional but recommended)
#   - Tag: vX.Y.Z
#   - Title: vX.Y.Z
#   - Notes: highlights, breaking changes, test instructions
```

---

## B) Commit style (helps future you)

```text
feat: add Moments API cache priming
fix: correct endpoint path
docs: update README for Docker usage
```

Use `feat|fix|docs|refactor|chore` so you know *what kind of change* it was.

---

## C) Checklist before bumping

- [ ] On `main` and clean (`git status`)  
- [ ] Synced with GitHub (`git pull --ff-only`)  
- [ ] Changes committed with a clear message  
- [ ] Run `npm version …` to bump version & tag consistently  
- [ ] Run `git push && git push --tags`  

---

## D) Guard-rail tip (optional)

Add a script that **stops you** if `package.json` and the latest Git tag don’t match. Hook it into `preversion` so it runs automatically. This prevents mismatches like the one you just hit.

---

✅ With these inline notes, you can see exactly what each command does and why it’s safe.  
