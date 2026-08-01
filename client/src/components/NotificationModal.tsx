import React, { useState, FormEvent } from 'react';
import { useApp } from '../context/AppContext';
import { subscribeUserToPush } from '../services/notifications';
import { Bell, Check, X, User } from 'lucide-react';

interface NotificationModalProps {
  onClose: () => void;
}

export default function NotificationModal({ onClose }: NotificationModalProps) {
  const { members, showToast } = useApp();
  const savedName = localStorage.getItem('le_user_member_name') || '';
  const [selectedName, setSelectedName] = useState<string>(savedName);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleSubscribe = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedName.trim()) {
      showToast('Por favor, selecione seu nome na lista', 'danger');
      return;
    }

    setSubmitting(true);
    try {
      const res = await subscribeUserToPush(selectedName);
      if (res.success) {
        showToast(res.message, 'success');
        onClose();
      } else {
        showToast(res.message, 'danger');
      }
    } catch (err) {
      showToast('Erro ao ativar notificações', 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '460px' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Bell size={20} color="var(--primary)" /> Ativar Lembretes de Escala
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            background: 'rgba(201, 168, 122, 0.15)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 0.75rem'
          }}>
            <Bell size={26} />
          </div>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Receba um aviso automático no seu celular ou computador <strong>1 semana (7 dias) antes</strong> de cada culto em que estiver escalado.
          </p>
        </div>

        <form onSubmit={handleSubscribe}>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <User size={15} /> Selecione seu nome na equipe
            </label>
            <select
              className="form-select"
              value={selectedName}
              onChange={(e) => setSelectedName(e.target.value)}
              required
            >
              <option value="">-- Selecione seu nome --</option>
              {members
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((m) => (
                  <option key={m.id} value={m.name}>
                    {m.name} ({m.default_role || 'Integrante'})
                  </option>
                ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1, fontWeight: 700 }} disabled={submitting}>
              <Check size={16} /> {submitting ? 'Ativando...' : 'Ativar Notificações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
