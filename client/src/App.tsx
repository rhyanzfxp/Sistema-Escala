import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import ScheduleView from './components/ScheduleView';
import AvailabilityForm from './components/AvailabilityForm';
import AdminPanel from './components/AdminPanel';
import SwapModal from './components/SwapModal';

function LoadingScreen() {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'var(--bg-deep)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      gap: '1.25rem'
    }}>
      {/* Spinner */}
      <div style={{
        width: '52px',
        height: '52px',
        borderRadius: '50%',
        border: '4px solid rgba(201, 168, 122, 0.15)',
        borderTopColor: 'var(--primary)',
        animation: 'spin 0.9s linear infinite'
      }} />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
        <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
          Carregando escala...
        </span>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          Sincronizando dados com a equipe
        </span>
      </div>
    </div>
  );
}

function MainContent() {
  const { activeTab, toast, loading } = useApp();

  return (
    <>
      {loading && <LoadingScreen />}
      <div className="main-scroll-area">
        <main className="container" style={{ opacity: loading ? 0 : 1, transition: 'opacity 0.3s ease' }}>
          {toast && (
            <div style={{
              position: 'fixed',
              top: '72px',
              right: '1rem',
              zIndex: 1000,
              background: toast.type === 'danger' ? 'rgba(220, 60, 60, 0.95)' : 'rgba(16, 185, 129, 0.95)',
              backdropFilter: 'blur(10px)',
              color: '#fff',
              padding: '0.7rem 1.2rem',
              borderRadius: '12px',
              fontWeight: 600,
              fontSize: '0.88rem',
              boxShadow: 'var(--shadow-main)',
              animation: 'slideUp 0.2s ease',
              maxWidth: 'calc(100vw - 2rem)'
            }}>
              {toast.message}
            </div>
          )}

          {activeTab === 'schedule' && <ScheduleView />}
          {activeTab === 'availability' && <AvailabilityForm />}
          {activeTab === 'admin' && <AdminPanel />}

          <SwapModal />
        </main>
      </div>
    </>
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
