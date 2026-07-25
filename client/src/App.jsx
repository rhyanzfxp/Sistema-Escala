import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import ScheduleView from './components/ScheduleView';
import AvailabilityForm from './components/AvailabilityForm';
import AdminPanel from './components/AdminPanel';
import SwapModal from './components/SwapModal';

function MainContent() {
  const { activeTab, toast } = useApp();

  return (
    <main className="container" style={{ flex: 1, paddingTop: '1.25rem' }}>
      {toast && (
        <div style={{
          position: 'fixed',
          top: '80px',
          right: '1rem',
          zIndex: 1000,
          background: toast.type === 'danger' ? 'rgba(239, 68, 68, 0.9)' : 'rgba(16, 185, 129, 0.9)',
          backdropFilter: 'blur(8px)',
          color: '#fff',
          padding: '0.75rem 1.25rem',
          borderRadius: '12px',
          fontWeight: 600,
          fontSize: '0.9rem',
          boxShadow: 'var(--shadow-main)',
          animation: 'slideUp 0.2s ease'
        }}>
          {toast.message}
        </div>
      )}

      {activeTab === 'schedule' && <ScheduleView />}
      {activeTab === 'availability' && <AvailabilityForm />}
      {activeTab === 'admin' && <AdminPanel />}

      <SwapModal />
    </main>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Navbar />
      <MainContent />
      <BottomNav />
    </AppProvider>
  );
}
