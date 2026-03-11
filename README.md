# 🚀 Mission Control

Your personal OpenClaw command center. Track projects, manage tasks, queue work for your bot, and keep a dev diary — all from a clean dark dashboard accessible from any device on your network.

## Setup

```bash
cd C:\GITHUB\MissionControl
npm install
node server.js
```

Then open: **http://localhost:3000**

From your phone (same WiFi): **http://YOUR_PC_IP:3000**
(The server prints the exact URL on startup)

## Features

- **Dashboard** — Stats overview, active projects, OpenClaw queue, recent activity
- **Projects** — All 10+ projects pre-loaded, filter by status/engine, track tasks & progress
- **Queue** — Task board for things OpenClaw should work on (Queued → In Progress → Done)
- **Dev Diary** — Timestamped journal entries with search
- **Uploads** — Drag & drop files for OpenClaw to process
- **Settings** — Theme toggle (dark/light), accent color, profile

## Data

All data is stored locally in `./data/` as JSON files. Nothing goes to the cloud.

## Stack

- **Backend:** Node.js + Express
- **Frontend:** Vanilla JS + CSS (no frameworks, no CDN)
- **Storage:** JSON files

Built by OpenClaw for Shadow 🤖
