import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import About from "./pages/About";
import Dashboard from "./pages/Dashboard";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import PosPage from "./pages/POSPage";
import TransactionHistoryPage from "./pages/TransactionHistoryPage";
import Layout from "./components/Layout"; 
import Inventory from "./pages/Inventory";
import SalesHistoryPage from "./pages/SalesHistoryPage";
import RestockHistoryPage from "./pages/RestockHistoryPage";
import SpoilageHistoryPage from "./pages/SpoilageHistoryPage";
import OwnerSetup from "./pages/OwnerSetup";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/owner-setup" element={<OwnerSetup />} />
          <Route path="/about" element={<About />} />
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/pos" element={<PosPage />} />
            <Route path="/pos/history" element={<TransactionHistoryPage />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/history/sales" element={<SalesHistoryPage />} />
            <Route path="/history/restock" element={<RestockHistoryPage />} />
            <Route path="/history/spoilage" element={<SpoilageHistoryPage />} />
            <Route path="/cashflow" element={<Dashboard />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;