import React, { useState, useEffect, FormEvent } from 'react';
import { useApp } from '../context/AppContext';
import { fetchAvailableSubstitutes, executeSwap, cleanServiceTitle } from '../services/api';
import { ArrowRightLeft, UserCheck, AlertTriangle, Check, X } from 'lucide-react';

interface AvailableSubstitute {
  member_name: string;
  role: string;
  notes?: string;
}

export default function SwapModal() {
  const { swapModal, setSwapModal, showToast, loadAllData } = useApp();
  const [availableList, setAvailableList] = useState<AvailableSubstitute[]>([]);
  const [selectedSubstitute, setSelectedSubstitute] = useState<string>('');
  const [customName, setCustomName] = useState<string>('');
  const [loadingSubs, setLoadingSubs] = useState<boolean>(true);
  const [swapping, setSwapping] = useState<boolean>(false);

  const item = swapModal.item;
  const serviceId = item?.serviceId;
  const roleField = item?.roleField;
  const currentMember = item?.currentMember || '';
  const rawServiceTitle = item?.title || '';
  const formattedTitle = cleanServiceTitle(rawServiceTitle);
  const dateStr = item?.date || '';

  const roleLabelMap: Record<string, string> = {
    keyboard_member: 'Teclado / Sanfona',
    guitar_member: 'Violão / Guitarra',
    bass_member: 'Baixista',
    drums_member: 'Baterista',
    vocal_members: 'Ministro / Vocais'
  };

  const roleName = roleField ? (roleLabelMap[roleField] || 'Função') : 'Função';

  useEffect(() => {
    if (swapModal.open && serviceId && roleField) {
      setLoadingSubs(true);
      fetchAvailableSubstitutes(serviceId, roleField)
        .then((res) => {
          const filtered = res.filter((sub) => sub.member_name.toUpperCase().trim() !== currentMember.toUpperCase().trim());
          setAvailableList(filtered);
          if (filtered.length > 0) {
            setSelectedSubstitute(filtered[0].member_name);
          } else {
            setSelectedSubstitute('');
          }
        })
        .catch(() => setAvailableList([]))
        .finally(() => setLoadingSubs(false));
    }
  }, [swapModal.open, serviceId, roleField, currentMember]);

  if (!swapModal.open || !item || !serviceId || !roleField) return null;

  const handleConfirmSwap = async (e: FormEvent) => {
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
      setSwapModal({ open: false, item: null });
      setCustomName('');
      await loadAllData();
    } catch (err) {
      showToast('Erro ao realizar a troca', 'danger');
    } finally {
      setSwapping(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => setSwapModal({ open: false, item: null })}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowRightLeft color="var(--primary)" size={22} /> Troca Direta por Imprevisto
          </h3>
          <button
            onClick={() => setSwapModal({ open: false, item: null })}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ background: 'rgba(10, 14, 23, 0.7)', padding: '0.85rem 1rem', borderRadius: '12px', marginBottom: '1.25rem', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{dateStr}</span>
          </div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{formattedTitle}</div>
          <div style={{ fontSize: '0.85rem', color: '#fca5a5', marginTop: '0.4rem', fontWeight: 600 }}>
            Função: {roleName} ({currentMember})
          </div>
        </div>

        <form onSubmit={handleConfirmSwap}>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <UserCheck size={16} /> Voluntários Disponíveis neste Culto
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <strong style={{ fontSize: '0.9rem' }}>{sub.member_name}</strong>
                        {sub.role && (
                          <span style={{ fontSize: '0.72rem', background: 'rgba(201,168,122,0.15)', color: '#e5c99f', padding: '0.1rem 0.45rem', borderRadius: '6px', fontWeight: 600 }}>
                            {sub.role}
                          </span>
                        )}
                      </div>
                      {sub.notes && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{sub.notes}</div>}
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
              onClick={() => setSwapModal({ open: false, item: null })}
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
