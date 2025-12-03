### 🛠️ The "LW Mini Mart" Tech Stack

| Layer | Technology | Version / Tool | Why we chose it (The Wow Factor) |
| :--- | :--- | :--- | :--- |
| **App Shell** | **Electron.js** | `electron-vite` | Turns web code into a native Windows `.exe`. |
| **Frontend** | **React.js** | `v18+` | Instant UI updates (Cart totals update immediately). |
| **Styling** | **Tailwind CSS** | `v3.4+` | Rapid layout building without writing custom CSS files. |
| **UI Kit** | **Shadcn/UI** | - | Beautiful, accessible, pre-built components (Modals, Inputs). |
| **Database** | **PGlite (embedded Postgres)** | `@electric-sql/pglite` | Zero-install, file-based Postgres engine bundled inside Electron. |
| **ORM** | **Direct SQL via PGlite** | - | Simple SQL queries from the Electron main process (no external DB server needed). |
| **Charts** | **Recharts** | - | Animated, responsive charts for the Dashboard. |
| **Reporting** | **react-to-print** | - | Generates instant "Thermal Printer" style receipts/PDFs. |
| **Icons** | **Lucide React** | - | Clean, modern icons for the UI. |

---

### 💻 Prerequisites (Every Developer Needs These)
*   **Node.js:** `v18` (LTS) or higher.
*   **No external database required:** PGlite runs fully embedded inside the Electron app.
*   **VS Code Extensions:**
    *   *ES7+ React Snippets*
    *   *Tailwind CSS IntelliSense*
    *   *Prettier*

---

### 🧩 How other teams can build new pages with PGlite

PGlite is already wired into the **Electron main process** via `electron/db/pglite.ts`:

* The DB file lives under the Electron **userData** folder (per-user, per-machine).
* On first run, `schema.sql` and `seed.sql` from `electron/db/` are executed automatically.
* The auth IPC (`electron/ipc/auth.ts`) already uses `getDb()` to query the `users` table.

To add features for other teams (Inventory, Cashflow, Reports, etc.):

1. **Add tables to the schema**  
   * Edit `electron/db/schema.sql` with new tables (e.g. `inventory_items`, `transactions`).
   * Optionally seed demo data in `electron/db/seed.sql`.

2. **Create new IPC handlers in Electron**  
   * Add functions in `electron/ipc/*` that call `const db = await getDb();` and run SQL queries.  
   * Expose them via `ipcMain.handle("inventory:list", ...)`, `ipcMain.handle("sales:create", ...)`, etc.

3. **Expose APIs to the renderer via preload**  
   * Extend `electron/preload.ts` (and `preload-dev.cjs`) to add, for example, `window.api.inventory.list()` or `window.api.sales.record()`.

4. **Use `window.api` from React pages**  
   * In new React routes/pages (e.g. `/inventory`, `/cashflow`), call the IPC-backed helpers:  
     `const items = await window.api.inventory.list();`

This keeps **all database access in the Electron main process** (via PGlite) while React stays a clean UI layer that talks only through `window.api`.
