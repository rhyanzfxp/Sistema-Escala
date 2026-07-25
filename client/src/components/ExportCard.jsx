import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import { useApp } from '../context/AppContext';
import { formatDateBR } from '../services/api';
import { Download, X, Music } from 'lucide-react';

export default function ExportCard({ onClose, scheduleItems }) {
  const { church, month, showToast } = useApp();
  const cardRef = useRef(null);

  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#0a0e17',
        scale: 2
      });
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `Escala_Louvor_${church}_${month}.png`;
      link.click();
      showToast('Imagem da escala gerada para download!', 'success');
      onClose();
    } catch (err) {
      showToast('Erro ao gerar imagem', 'danger');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Exportar para WhatsApp</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div
          ref={cardRef}
          style={{
            background: 'linear-gradient(135deg, #0a0e17 0%, #121824 100%)',
            border: '2px solid rgba(201, 168, 122, 0.4)',
            borderRadius: '16px',
            padding: '1.5rem',
            color: '#fff'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.85rem' }}>
            <img
              src="/logo.jpg"
              alt="Logo"
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                objectFit: 'cover',
                border: '2px solid rgba(212, 178, 140, 0.5)'
              }}
            />
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc' }}>ESCALA - MINISTÉRIO DE LOUVOR</h2>
              <div style={{ fontSize: '0.85rem', color: '#c9a87a' }}>Igreja {church.toUpperCase()} • Mês: {month}</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {scheduleItems.slice(0, 8).map((item) => (
              <div
                key={item.service_id}
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  padding: '0.75rem 1rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.2rem' }}>
                  <span>{item.church} • {formatDateBR(item.date)} ({item.day_time})</span>
                  <span style={{ color: '#c9a87a', fontWeight: 700 }}>{item.title}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.4rem', fontSize: '0.82rem', marginTop: '0.35rem' }}>
                  <div><strong>Teclado:</strong> {item.keyboard_member || '-'}</div>
                  <div><strong>Violão:</strong> {item.guitar_member || '-'}</div>
                  <div><strong>Baixo:</strong> {item.bass_member || '-'}</div>
                  <div><strong>Bateria:</strong> {item.drums_member || '-'}</div>
                  <div><strong>Vocais:</strong> {item.vocal_members || '-'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem' }}>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleDownloadImage}>
            <Download size={18} /> Baixar Imagem (PNG)
          </button>
        </div>
      </div>
    </div>
  );
}
