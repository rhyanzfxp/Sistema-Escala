import React, { useState, useRef, FormEvent } from 'react';
import { useApp } from '../context/AppContext';
import { Shield, ShieldAlert, Calendar } from 'lucide-react';

export default function Navbar() {
  const { church, setChurch, month, setMonth, isAdmin, setIsAdmin, showToast } = useApp();
  const [pinInput, setPinInput] = useState<string>('');
  const [showPinModal, setShowPinModal] = useState<boolean>(false);

  // Clique secreto no logo para abrir o painel admin
  const clickCount = useRef<number>(0);
  const clickTimer = useRef<NodeJS.Timeout | number | null>(null);

  const handleLogoClick = () => {
    clickCount.current += 1;
    if (clickTimer.current) clearTimeout(clickTimer.current as number);

    if (clickCount.current >= 5) {
      clickCount.current = 0;
      if (isAdmin) {
        setIsAdmin(false);
        showToast('Modo Voluntário ativado', 'success');
      } else {
        setShowPinModal(true);
      }
    } else {
      clickTimer.current = setTimeout(() => {
        clickCount.current = 0;
      }, 2000);
    }
  };

  const verifyPin = (e: FormEvent) => {
    e.preventDefault();
    if (pinInput === '1234' || pinInput === 'admin') {
      setIsAdmin(true);
      setShowPinModal(false);
      setPinInput('');
      showToast('Acesso de Administrador concedido!', 'success');
    } else {
      showToast('PIN Incorreto!', 'danger');
      setPinInput('');
    }
  };

  return (
    <header style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-color)', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 4px 20px rgba(0,0,0,0.35)' }}>
      <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.85rem 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <img
              src="/logo.jpg"
              alt="Logo Ministério de Louvor"
              onClick={handleLogoClick}
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                objectFit: 'cover',
                border: `2px solid ${isAdmin ? 'rgba(99,102,241,0.6)' : 'rgba(212, 178, 140, 0.4)'}`,
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.4)',
                cursor: 'pointer',
                userSelect: 'none',
                transition: 'border-color 0.3s ease'
              }}
            />
            <div>
              <h1 style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.4px', color: '#f8fafc' }}>
                Escala - Ministério de Louvor
              </h1>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>CCHABITAREI Itaperi &amp; Industrial</p>
            </div>
          </div>

          {isAdmin && (
            <button
              onClick={() => { setIsAdmin(false); showToast('Modo Voluntário ativado', 'success'); }}
              className="btn btn-secondary"
              style={{ padding: '0.5rem 0.85rem', fontSize: '0.8rem', height: '36px', borderColor: 'rgba(99,102,241,0.4)', color: '#818cf8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <ShieldAlert size={15} />
              <span>Sair Admin</span>
            </button>
          )}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
          <div style={{ display: 'flex', background: 'rgba(30, 42, 26, 0.8)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            {['Todas', 'Itaperi', 'Industrial'].map((item) => (
              <button
                key={item}
                onClick={() => setChurch(item)}
                style={{
                  border: 'none',
                  background: church === item ? 'var(--primary)' : 'transparent',
                  color: church === item ? '#1e2a1a' : 'var(--text-muted)',
                  padding: '0.4rem 0.85rem',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: church === item ? 700 : 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {item}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={16} color="var(--text-muted)" />
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="form-select"
              style={{ minHeight: '38px', padding: '0.4rem 0.75rem', fontSize: '0.85rem', width: 'auto' }}
            >
              <option value="2026-07">Julho 2026</option>
              <option value="2026-08">Agosto 2026</option>
              <option value="2026-09">Setembro 2026</option>
            </select>
          </div>
        </div>
      </div>

      {showPinModal && (
        <div className="modal-overlay" onClick={() => { setShowPinModal(false); setPinInput(''); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div style={{
                width: '52px', height: '52px', borderRadius: '50%',
                background: 'rgba(99,102,241,0.15)', color: 'var(--primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 0.75rem'
              }}>
                <Shield size={24} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Acesso Restrito</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                Digite o PIN do líder para continuar.
              </p>
            </div>
            <form onSubmit={verifyPin}>
              <div className="form-group">
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  autoFocus
                  style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setShowPinModal(false); setPinInput(''); }}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Entrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
