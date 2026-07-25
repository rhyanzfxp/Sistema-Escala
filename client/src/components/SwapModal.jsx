import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { fetchAvailableSubstitutes, executeSwap } from '../services/api';
import { ArrowRightLeft, UserCheck, AlertTriangle, Check, X } from 'lucide-react';

export default function SwapModal() {
  const { swapModal, setSwapModal, showToast, loadAllData } = useApp();
  const [availableList, setAvailableList] = useState([]);
  const [selectedSubstitute, setSelectedSubstitute] = useState('');
  const [customName, setCustomName] = useState('');
  const [loadingSubs, setLoadingSubs] = useState(true);
  const [swapping, setSwapping] = useState(false);

  const { serviceId, roleField, currentMember, serviceTitle, churchName, dateStr } = swapModal;

  const roleLabelMap = {
    keyboard_member: 'Teclado / Sanfona',
    guitar_member: 'Violão / Guitarra',
    bass_member: 'Baixista',
    drums_member: 'Baterista',
    vocal_members: 'Ministro / Vocais'
  };

  const roleName = roleLabelMap[roleField] || 'Função';

  useEffect(() => {
    if (swapModal.open && serviceId) {
      setLoadingSubs(true);
      fetchAvailableSubstitutes(serviceId, roleName)
        .then((res) => {
          const filtered = res.filter((item) => item.member_name !== currentMember);
          setAvailableList(filtered);
          if (filtered.length > 0) {
            setSelectedSubstitute(filtered[0].member_name);
          }
        })
        .catch(() => setAvailableList([]))
        .finally(() => setLoadingSubs(false));
    }
  }, [swapModal, serviceId, roleName, currentMember]);

  if (!swapModal.open) return null;

  const handleConfirmSwap = async (e) => {
    e.preventDefault();
    const finalNewMember = customName.trim() ? customName.toUpperCase().trim() : selectedSubstitute;

    if (!finalNewMember) {
      showToast('Selecione ou digite um integrante substituto', 'danger');
      return;
    }

    setSwapping(true);
    try {
      await executeSwap({
        service_id: serviceId,
        role_field: roleField,
        old_member: currentMember,
        new_member: finalNewMember
      });

      showToast(`Troca realizada com sucesso! ${currentMember} ➔ ${finalNewMember}`, 'success');
      setSwapModal({ open: false });
      await loadAllData();
    } catch (err) {
      showToast('Erro ao realizar a troca', 'danger');
    } finally {
      setSwapping(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => setSwapModal({ open: false })}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowRightLeft color="var(--primary)" size={22} /> Troca Direta por Imprevisto
          </h3>
          <button
            onClick={() => setSwapModal({ open: false })}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ background: 'rgba(10, 14, 23, 0.7)', padding: '0.85rem 1rem', borderRadius: '12px', marginBottom: '1.25rem', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span className={`badge badge-${churchName?.toLowerCase()}`}>{churchName}</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{dateStr}</span>
          </div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{serviceTitle}</div>
          <div style={{ fontSize: '0.85rem', color: '#fca5a5', marginTop: '0.4rem', fontWeight: 600 }}>
            Função: {roleName} ({currentMember})
          </div>
        </div>

        <form onSubmit={handleConfirmSwap}>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <UserCheck size={16} /> Voluntários que Informaram Disponibilidade
            </label>

            {loadingSubs ? (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', padding: '0.5rem' }}>Carregando disponíveis...</div>
            ) : availableList.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto' }}>
                {availableList.map((sub) => (
                  <label
                    key={sub.member_name}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.65rem 0.85rem',
                      background: selectedSubstitute === sub.member_name && !customName ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                      border: `1px solid ${selectedSubstitute === sub.member_name && !customName ? 'var(--primary)' : 'var(--border-color)'}`,
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      setSelectedSubstitute(sub.member_name);
                      setCustomName('');
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '0.9rem' }}>{sub.member_name}</strong>
                      {sub.notes && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sub.notes}</div>}
                    </div>
                    {selectedSubstitute === sub.member_name && !customName && <Check size={18} color="var(--primary)" />}
                  </label>
                ))}
              </div>
            ) : (
              <div style={{
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                padding: '0.75rem',
                borderRadius: '8px',
                fontSize: '0.82rem',
                color: '#fcd34d',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <AlertTriangle size={18} /> Nenhum voluntário marcou disponibilidade para esta função. Digite outro nome abaixo.
              </div>
            )}
          </div>

          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label className="form-label">Ou digite o nome de outro substituto acordado</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ex: RENE, CONVIDADO..."
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ flex: 1 }}
              onClick={() => setSwapModal({ open: false })}
            >
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={swapping}>
              {swapping ? 'Efetivando...' : 'Confirmar Troca'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
