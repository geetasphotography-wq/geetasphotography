
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";

import AdminLayout from "./layouts/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import GalleryManager from "./pages/admin/GalleryManager";
import ContentEditor from "./pages/admin/ContentEditor";
import Messages from "./pages/admin/Messages";
import Settings from "./pages/admin/Settings";
import Customers from "./pages/admin/Customers";
import POS from "./pages/admin/POS";
import Transactions from "./pages/admin/Transactions";
import ProtectedRoute from "./components/admin/ProtectedRoute";
import PresenceTracker from "./components/PresenceTracker";

import { useEffect } from "react";
import { incrementTotalViews } from "@/lib/analytics";

// Create a client for React Query
const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // Check if user has already visited in this session
    const hasVisited = sessionStorage.getItem("hasVisited");

    if (!hasVisited) {
      incrementTotalViews();
      sessionStorage.setItem("hasVisited", "true");
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {/* UI Notification components */}
        <Toaster />
        <Sonner position="bottom-right" />

        {/* BrowserRouter with Future Flags:
          - v7_startTransition: Uses React.startTransition for state updates.
          - v7_relativeSplatPath: Fixes relative path resolution in splat (*) routes.
      */}
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}
        >
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />

            {/* Admin Routes (Protected) */}
            <Route element={<ProtectedRoute />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="gallery" element={<GalleryManager />} />
                <Route path="content" element={<ContentEditor />} />
                <Route path="messages" element={<Messages />} />
                <Route path="customers" element={<Customers />} />
                <Route path="pos" element={<POS />} />
                <Route path="transactions" element={<Transactions />} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Route>

            {/* Catch-all route for 404 pages */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <PresenceTracker />
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;