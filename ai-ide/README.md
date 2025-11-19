# AI‑IDE (Codestral + ChatGPT‑OSS + dKimi)

A **full‑stack, production‑grade** AI‑powered IDE that runs locally or in Docker.

## Features

- **Editor** – CodeMirror 6 with language‑aware autocomplete.
- **AI Completion** – Uses Codestral (FIM) **or** any Hugging Face model (ChatGPT‑OSS, dKimi).
- **Chat Assistant** – Same three providers, selectable via a dropdown.
- **File Explorer** – Virtual workspace (`./workspace`) with create/read/write/delete.
- **Git Integration** – Init / status / pull / push via `simple-git`.
- **WebSocket** – Live file‑system events, streaming completions (simulated), git status updates.
- **Theme System** – Pure black theme with light/dark mode toggle, persistent across sessions.
- **Toast Notifications** – Real-time user feedback system for actions and status updates.
- **Keyboard Hotkeys** – Developer-friendly shortcuts (Ctrl+S for save, etc.).
- **Enhanced DX** – Responsive layout with improved user experience features including toast notifications and theme persistence.
- **Dockerised** – `docker compose up --build` launches everything.
- **CI** – GitHub Actions runs lint, unit tests (Jest) and UI tests (Playwright).

## Theme & UX Features

### Pure Black Theme
The UI now features a **true black theme** (`bg-black`) providing:
- Superior contrast and reduced eye strain in low-light environments
- Professional appearance with elegant gray accent colors
- Optimized for extended coding sessions

### Theme Toggle
- Toggle between light and dark modes via the theme button in the header
- Theme preference persists across browser sessions using localStorage
- Smooth transitions between theme modes

### Keyboard Hotkeys
- **Ctrl+S** – Save current file
- **Ctrl+N** – New file
- **Ctrl+O** – Open file
- **Ctrl+Shift+S** – Save all files
- **Ctrl+/** – Toggle comment
- **Ctrl+D** – Duplicate line/selection
- **Ctrl+F** – Find in current file
- **Ctrl+H** – Replace in current file
- **Ctrl+`** – Toggle terminal/chat panel

### Toast Notifications
- Real-time feedback for user actions (file saves, AI completions, etc.)
- Success, error, and info message types
- Auto-dismiss with configurable timeout
- Non-intrusive positioning in the top-right corner

## Quick start

```bash
# 1. copy the .env template & fill in your keys
cp .env.example .env   # then edit .env

# 2. build & run
docker compose up --build -d

# 3. open the UI
open http://localhost:5173   # or visit manually
```

### Theme & UX Features (No Setup Required)
- **Theme toggle** works immediately - click the theme button in the header
- **Keyboard shortcuts** are active by default - try Ctrl+S to save
- **Toast notifications** appear automatically for user actions
- **Pure black theme** provides enhanced coding experience out of the box

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

### Backend Extensions
* **Add a new model** – add an entry to `src/ai/models.ts` and, if it is a Hugging Face model, you're done.
* **Add streaming** – replace `hfPost` with a fetch‑SSE implementation once you have an accelerated HF plan.
* **Add more LSPs** – plug a language‑server into `src/ai` and expose it through a new route.

### Frontend Extensions
* **Theme customization** – Modify `tailwind.config.cjs` to adjust colors, or extend the theme system in `src/hooks/useTheme.ts`.
* **Add new toast types** – Extend the toast system in `src/hooks/useToast.ts` and `src/components/ToastContainer.tsx`.
* **Add keyboard shortcuts** – Register new hotkeys in `src/hooks/useHotkeys.ts`.
* **UI components** – Follow the established black theme patterns using `bg-black` and `text-gray-100` for consistency.

## License

MIT – feel free to fork, extend, or embed in your own product.