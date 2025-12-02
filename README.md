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
| **Frontend** | React.js 18+ | Modern, reactive user interface |
| **Styling** | Tailwind CSS 3.4+ | Utility-first CSS framework |
| **UI Components** | Shadcn/UI | Accessible, customizable components |
| **Build Tool** | Vite | Fast development and optimized builds |
| **Language** | TypeScript | Type-safe development |
| **Database** | PostgreSQL 14+ | Enterprise-grade data storage |
| **ORM** | Prisma 5+ | Type-safe database queries |
| **Charts** | Recharts | Interactive data visualization |
| **State Management** | Zustand | Lightweight state management |
| **Icons** | Lucide React | Modern icon library |
| **Authentication** | Supabase Auth | Secure user authentication |

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** v18 (LTS) or higher - [Download](https://nodejs.org/)
- **PostgreSQL** v14+ - [Download](https://www.postgresql.org/download/)
  - Default configuration: Port `5432`
  - Default user: `postgres`
  - Default password: `postgres` or `root`
- **npm** or **yarn** package manager

### Recommended VS Code Extensions

- ES7+ React Snippets
- Tailwind CSS IntelliSense
- Prisma (for schema syntax highlighting)
- Prettier (code formatting)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <YOUR_REPOSITORY_URL>
cd LW-Minimart
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_key
VITE_SUPABASE_PROJECT_ID=your_project_id
```

### 4. Database Setup

Ensure PostgreSQL is running and configure your database connection in the Prisma schema file.

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev
```

### 5. Start Development Server

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
│   └── integrations/   # Third-party integrations
├── public/             # Public assets
├── prisma/             # Database schema and migrations
└── package.json        # Dependencies and scripts
```

## 🎯 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npx prisma studio` - Open Prisma Studio (database GUI)

## 🔐 Authentication

The application uses Supabase for authentication. Users can:
- Sign up with email and password
- Sign in to access the dashboard
- Manage their store settings and preferences

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
