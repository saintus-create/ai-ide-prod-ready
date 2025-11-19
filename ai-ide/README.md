# AI‑IDE (Codestral + ChatGPT‑OSS + dKimi)

A **full‑stack, production‑grade** AI‑powered IDE that runs locally or in Docker.

## Features

- **Editor** – CodeMirror 6 with language‑aware autocomplete.
- **AI Completion** – Uses Codestral (FIM) **or** any Hugging Face model (ChatGPT‑OSS, dKimi).
- **Chat Assistant** – Same three providers, selectable via a dropdown.
- **File Explorer** – Virtual workspace (`./workspace`) with create/read/write/delete.
- **Git Integration** – Init / status / pull / push via `simple-git`.
- **WebSocket** – Live file‑system events, streaming completions (simulated), git status updates.
- **Dockerised** – `docker compose up --build` launches everything.
- **CI** – GitHub Actions runs lint, unit tests (Jest) and UI tests (Playwright).

## Quick start

```bash
# 1. copy the .env template & fill in your keys
cp .env.example .env   # then edit .env

# 2. build & run
docker compose up --build -d

# 3. open the UI
open http://localhost:5173   # or visit manually
```

## Environment variables

| Variable | Description |
|----------|-------------|
| `CODESTRAL_API_KEY` | Your private Codestral key |
| `MISTRAL_API_KEY`   | (optional) kept for backward compatibility |
| `HF_TOKEN`          | Hugging Face inference token (read‑only token works) |
| `ALLOWED_PROVIDERS`| Comma‑separated list of providers you want to expose (`codestral,chatgpt-oss,dkimi`) |
| `CLIENT_ORIGIN`     | CORS whitelist – the URL where the front‑end runs |
| `PORT`              | Backend listening port (default 4000) |

## Extending the app

* **Add a new model** – add an entry to `src/ai/models.ts` and, if it is a Hugging Face model, you're done.
* **Add streaming** – replace `hfPost` with a fetch‑SSE implementation once you have an accelerated HF plan.
* **Add more LSPs** – plug a language‑server into `src/ai` and expose it through a new route.

## License

MIT – feel free to fork, extend, or embed in your own product.