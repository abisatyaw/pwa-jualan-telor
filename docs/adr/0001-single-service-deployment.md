# Single-service deployment: FastAPI serves the built frontend

This app shares one VPS with another app (catering-tracker), each running as its own systemd
service per environment (production/testing), managed by a shared `deploy.sh` that builds, restarts,
and health-checks one service per deploy. We deliberately keep this app to a single deployable
service rather than hosting the frontend and backend separately: the frontend is built to
`frontend/dist` and FastAPI (`main.py`) mounts it as static files, falling back to `index.html` for
SPA routes. This keeps the deploy/restart/health-check story to "one service" per environment,
matching the shared-VPS topology, at the cost of coupling frontend releases to a backend restart.
