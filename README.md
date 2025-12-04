# LW Mini Mart - Smart Retail Management System

A comprehensive, AI-powered retail management platform designed for convenience stores and mini-marts. Transform your store operations with real-time inventory tracking, profit analytics, and intelligent stock management.

## 🚀 Features

- **Smart Inventory Management** - Real-time tracking with AI-powered stock predictions
- **Point of Sale (POS)** - Fast, intuitive checkout system
- **Profit Analytics** - Comprehensive dashboard with revenue insights and trends
- **Traffic Light Stock Alerts** - Visual indicators for low stock, expiring items, and reorder points
- **Multi-Currency Support** - Handle transactions in multiple currencies
- **Receipt Generation** - Thermal printer-ready receipts and PDF reports
- **Security Monitoring** - 24/7 data protection with enterprise-grade storage
- **Dark/Light Mode** - Modern UI with theme switching

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 18+ | Modern, reactive user interface |
| **Styling** | Tailwind CSS 3.4+ | Utility-first CSS framework |
| **UI Components** | shadcn/ui | Accessible, customizable components |
| **Build Tool** | Vite | Fast development and optimized builds |
| **Language** | TypeScript | Type-safe development |
| **Desktop Shell** | Electron | Cross-platform desktop runtime |
| **Local Database** | SQLite (better-sqlite3) | Offline-first data storage |
| **Charts** | Recharts | Interactive data visualization |
| **State Management** | Zustand | Lightweight state management |
| **Icons** | Lucide React | Modern icon library |
| **Authentication** | Electron IPC + SQLite users | Local, offline auth |

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** v18 (LTS) or higher - [Download](https://nodejs.org/)
- **npm** package manager (bundled with Node.js)
- **Git** for cloning and version control
- A supported OS for Electron (Windows, macOS, or Linux)

### Recommended VS Code Extensions

- ES7+ React Snippets
- Tailwind CSS IntelliSense
- Prisma (for schema syntax highlighting)
- Prettier (code formatting)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/MarkJanzenB/LW-Minimart.git
cd LW-Minimart
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Web Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or the port shown in your terminal).

## 📁 Project Structure

```
LW-Minimart/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Page components
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utility functions
│   ├── assets/         # Static assets (images, logos)
│   └── integrations/   # Frontend integrations & types
├── public/             # Public assets
├── electron/           # Electron main, preload, and IPC handlers
└── package.json        # Dependencies and scripts
```

## 🎯 Available Scripts

- `npm run dev` - Start web development server (Vite)
- `npm run build` - Build web assets for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### 🖥️ Electron Desktop App

The project can also run as a desktop application using Electron with a local SQLite database.

- `npm run electron` - Launch the Electron app (uses the built web assets by default)

Before running Electron with native SQLite, ensure `better-sqlite3` is correctly built for your Electron version (only needed when dependencies or Node/Electron versions change):

```bash
npm install -D electron-rebuild

npx electron-rebuild -f -w better-sqlite3
```

**Recommended dev flow:**

1. In terminal A, start the Vite dev server:

   ```bash
   $env:ELECTRON_DEV="true"   # PowerShell (optional, marks dev mode for Electron)
   npm run dev
   ```

2. In terminal B, from the same project directory, start Electron:

   ```bash
   $env:ELECTRON_DEV="true"   # PowerShell
   npm run electron
   ```

Electron will open a desktop window and load the Vite dev server.

**Production-style test build:**

```bash
npm run build      # build frontend into dist/
npm run electron   # launch Electron using the built assets
```

## 🔐 Authentication

Authentication is handled locally via Electron IPC and SQLite. User accounts are stored in a local `store.db` file inside the `electron/db` directory.

On first run, the app seeds two demo accounts:

On first launch with a fresh database, you'll be guided through an **Owner Setup** wizard to create the initial owner username and password. After that, you can create additional cashier or staff users from inside the app (Sign Up) or by modifying the SQLite database directly if needed.

## 💰 Multi-Currency Support

LW Mini Mart supports multiple currencies including:
- USD, EUR, GBP, JPY
- PHP, SGD, MYR, THB
- IDR, VND, INR, CNY
- AUD, CAD

Currency preferences are saved and persist across sessions.

## 📊 Dashboard Features

- **Revenue Overview** - Daily, weekly, and monthly revenue tracking
- **Sales Analytics** - Interactive charts and graphs
- **Inventory Status** - Real-time stock levels and alerts
- **Top Products** - Best-selling items analysis
- **Customer Insights** - Transaction patterns and trends

## 🎨 Customization

The application supports:
- Dark and light themes
- Customizable color schemes
- Responsive design for all screen sizes
- Accessible UI components

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is proprietary software. All rights reserved.

## 📞 Support

For support and inquiries, please contact the development team or visit the project documentation.

## 🙏 Acknowledgments

Built with modern web technologies to provide a seamless retail management experience.

---

**LW Mini Mart** - Empowering small businesses with smart retail solutions.
