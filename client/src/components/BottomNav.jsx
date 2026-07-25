import React from 'react';
import { useApp } from '../context/AppContext';
import { CalendarDays, CheckSquare, Settings } from 'lucide-react';

export default function BottomNav() {
  const { activeTab, setActiveTab, isAdmin } = useApp();

  const tabs = [
    { id: 'schedule', label: 'Escala Oficial', icon: CalendarDays },
    { id: 'availability', label: 'Marcar Presença', icon: CheckSquare },
    { id: 'admin', label: 'Painel Líder', icon: Settings, adminOnly: true }
  ];

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: '65px',
      background: 'rgba(36, 48, 32, 0.97)',
      backdropFilter: 'blur(14px)',
      borderTop: '1px solid var(--border-color)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      zIndex: 90
    }}>
      {tabs.map((t) => {
        if (t.adminOnly && !isAdmin) return null;
        const Icon = t.icon;
        const isActive = activeTab === t.id;

        return (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              border: 'none',
              background: 'transparent',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              color: isActive ? 'var(--primary)' : 'var(--text-muted)',
              flex: 1,
              height: '100%',
              cursor: 'pointer',
              transition: 'color 0.2s ease',
              borderTop: isActive ? '2px solid var(--primary)' : '2px solid transparent'
            }}
          >
            <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
            <span style={{ fontSize: '0.72rem', fontWeight: isActive ? 700 : 500 }}>{t.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
