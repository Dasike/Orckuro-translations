# Orckuro Translations — Auto-update helper

This repo includes a small Node.js utility to scan the `Images/` folder and update `manga.json` with `latestChapter` and `isNew` fields automatically.

Usage

1. Install Node.js (if not present).
2. From the repository root run:

```powershell
# Update once:
npm run update-manga

# Run in watch mode (re-runs when Images/ changes):
npm run watch-manga
```

What it does

- Scans `Images/` for series folders and looks for chapter folders named like `ch01`, `Ch1`, `chapter02`, etc.
- Sets `latestChapter` in `manga.json` for each series.
- Marks `isNew: true` when the detected `latestChapter` increased compared to the stored value.
- Adds new series entries to `manga.json` if it finds folders not present yet.

Automation

- For automatic updates on upload, run the `watch-manga` command on the server where you upload files (or use a scheduled task).
- Alternatively, create a CI workflow (GitHub Actions) that runs `npm run update-manga` on push and commits the updated `manga.json` back.

GitHub Action

This repository includes a GitHub Actions workflow at `.github/workflows/update-manga.yml` that runs when files under `Images/` change. The action executes the updater and commits `manga.json` back to the repo if it changed.

Server setup (Linux / systemd)

Copy the example service file `scripts/systemd/update-manga.service` to `/etc/systemd/system/update-manga.service` and edit the `WorkingDirectory` and `ExecStart` paths to the repository path. Then enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable update-manga.service
sudo systemctl start update-manga.service
sudo journalctl -u update-manga.service -f
```

Server setup (Windows)

Use the PowerShell helper `scripts/run_watch_windows.ps1` to start the watcher as a background process. You can run it from a scheduled task or run it once on login.

```powershell
# From the repo folder:
powershell -ExecutionPolicy Bypass -File scripts\run_watch_windows.ps1
```

CI Push Policy

If you prefer the action to run only from a dedicated branch or require manual approval, edit `.github/workflows/update-manga.yml` accordingly.
