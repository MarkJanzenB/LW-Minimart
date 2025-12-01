### 🛠️ The "LW Mini Mart" Tech Stack

| Layer | Technology | Version / Tool | Why we chose it (The Wow Factor) |
| :--- | :--- | :--- | :--- |
| **App Shell** | **Electron.js** | `electron-vite` | Turns web code into a native Windows `.exe`. |
| **Frontend** | **React.js** | `v18+` | Instant UI updates (Cart totals update immediately). |
| **Styling** | **Tailwind CSS** | `v3.4+` | Rapid layout building without writing custom CSS files. |
| **UI Kit** | **Shadcn/UI** | - | Beautiful, accessible, pre-built components (Modals, Inputs). |
| **Database** | **PostgreSQL** | `v14+` (Local) | **Enterprise-Grade reliability.** Prevents data corruption. |
| **ORM** | **Prisma** | `v5+` | Type-safe database queries. Manages schema migrations easily. |
| **Charts** | **Recharts** | - | Animated, responsive charts for the Dashboard. |
| **Reporting** | **react-to-print** | - | Generates instant "Thermal Printer" style receipts/PDFs. |
| **Icons** | **Lucide React** | - | Clean, modern icons for the UI. |

---

### 💻 Prerequisites (Every Developer Needs These)
*   **Node.js:** `v18` (LTS) or higher.
*   **PostgreSQL:** Installed locally on port `5432` (User: `postgres`, Pass: `postgres` or `root`).
*   **VS Code Extensions:**
    *   *ES7+ React Snippets*
    *   *Tailwind CSS IntelliSense*
    *   *Prisma* (Crucial for syntax highlighting)
    *   *Prettier*
