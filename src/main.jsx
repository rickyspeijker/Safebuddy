import React from 'react';
import './index.css';
import 'leaflet/dist/leaflet.css';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// Import Layout component with explicit .jsx extension
import Layout from './Layout.jsx';

// Pages
import Home from './Pages/Home';
import RoutePlanner from './Pages/RoutePlanner';
import BuddyMatch from './Pages/BuddyMatch';
import Community from './Pages/Community';
import Profile from './Pages/Profile';

const queryClient = new QueryClient();

function AppRouter() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Home />} />
          <Route path="/route" element={<RoutePlanner />} />
          <Route path="/buddy" element={<BuddyMatch />} />
          <Route path="/community" element={<Community />} />
          <Route path="/profile" element={<Profile />} />
          {/* Fallback */}
          <Route path="*" element={<div style={{padding:24}}>Page not found</div>} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppRouter />
    </QueryClientProvider>
  </React.StrictMode>
);
