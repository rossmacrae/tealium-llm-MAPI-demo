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

# 2) Stage and commit your changes.  See B below for commit conventions
git add -A                # stage all changed files
git commit -m "feat: describe what you changed"  # save a snapshot in Git


# 3.a) Check that package.json and git are in sync on version number. See D below to fix if needed.
cat package.json | grep version   # what your local file says
git tag --list --sort=-v:refname | head   # what your tags say
curl -s https://jefpprxqsq.ap-southeast-2.awsapprunner.com/_version # check what version is running in AWS App Runner 


# 3.b) Bump version (choose one)
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

## D) If version numbers get out of sync

### 1) See current state
cat package.json | grep version   # what your local file says
git tag --list --sort=-v:refname | head   # what your tags say

### 2) If a wrong tag was created, delete it locally
git tag -d vX.Y.Z

### (if you already pushed it, delete remotely too)
git push origin :refs/tags/vX.Y.Z

### 3) Bump directly to the version you want
npm version 3.1.2   # (replace with correct target)

### 4) Push everything cleanly
git push
git push --tags


## E) Creating a Release in GitHub UI

After pushing your tag (e.g. v3.1.2), you should draft a Release:

1. Navigate → GitHub repo → Releases tab → “Draft a new release”.
2. Choose tag → Select the tag you just created (v3.1.2).
3. Release title → Same as the tag (v3.1.2).
4. Description/notes:
* Release notes (this version):
    * Bullet point what’s new in this release (features, fixes).
    * Mention breaking changes if any.
    * Add short test/run instructions if relevant.
* Project-level notes (entire repo):
    * Keep these in the README.md or CHANGELOG.md.
    * Example: project purpose, install instructions, Docker usage.
    * These don’t change every release, only when the project’s overall usage does.

* Think of it as:
    * Release notes = “What changed in this snapshot.”
    * README/Project docs = “What this repo is about, and how to use it overall.”

### Realease notes template:

## 🚀 What’s New in vX.Y.Z
- feat: <short description of new feature>
- fix: <short description of bug fix>
- docs: <README or doc changes>
- chore: <tooling, config, cleanup>

## ⚠️ Breaking Changes (if any)
- <describe change and how to migrate>
- Example: "Environment variable `API_KEY` renamed to `OPENAI_API_KEY`"

## 🧪 How to Test / Verify
- Clone repo, checkout tag vX.Y.Z
- Run: `npm install && npm start`
- Verify: <steps to check new behaviour>

## 📚 Notes
- This release adds changes since vX.Y.(Z-1)
- For full project details, see [README.md](../README.md) or [CHANGELOG.md](../CHANGELOG.md)

## ⚠️ Check the verseion that's running in AWS App Runner:
curl -s https://jefpprxqsq.ap-southeast-2.awsapprunner.com/_version