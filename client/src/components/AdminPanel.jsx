import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { updateServiceSchedule, addMember, clearAllSchedules, clearAllAvailability, togglePublishSchedule, formatDateBR } from '../services/api';
import { Shield, Save, UserPlus, Users, Trash2, Send, X, Check, Music, Disc, Mic, Volume2, Calendar, Radio, AlertTriangle } from 'lucide-react';

export default function AdminPanel() {
  const { services, scheduleData, availabilityList, members, church, month, showToast, loadAllData } = useApp();

  const [activeModalService, setActiveModalService] = useState(null);
  const [editForm, setEditForm] = useState({
    keyboard_member: '',
    guitar_member: '',
    bass_member: '',
    drums_member: '',
    vocal_members: ''
  });

  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showClearAvailModal, setShowClearAvailModal] = useState(false);
  const [showClearSchedModal, setShowClearSchedModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('Vocal');
  const [saving, setSaving] = useState(false);

  const filteredServices = services.filter((s) => church === 'Todas' || s.church === church);
  const isPublished = scheduleData.length > 0 && scheduleData.some((s) => s.published === 1);

  const openEditModal = (service) => {
    const currentSched = scheduleData.find((s) => s.service_id === service.id) || {};
    setActiveModalService(service);
    setEditForm({
      keyboard_member: currentSched.keyboard_member || '-',
      guitar_member: currentSched.guitar_member || '-',
      bass_member: currentSched.bass_member || '-',
      drums_member: currentSched.drums_member || '-',
      vocal_members: currentSched.vocal_members || '-'
    });
  };

  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    if (!activeModalService) return;
    setSaving(true);
    try {
      await updateServiceSchedule({
        service_id: activeModalService.id,
        ...editForm
      });
      showToast('Escala salva com sucesso!', 'success');
      setActiveModalService(null);
      await loadAllData();
    } catch (err) {
      showToast('Erro ao salvar escala', 'danger');
    } finally {
      setSaving(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;
    try {
      await addMember({ name: newMemberName, default_role: newMemberRole });
      showToast(`Integrante ${newMemberName.toUpperCase()} adicionado!`, 'success');
      setNewMemberName('');
      setShowMemberModal(false);
      await loadAllData();
    } catch (err) {
      showToast('Erro ao adicionar integrante', 'danger');
    }
  };

  const handleClearAll = async () => {
    setShowClearSchedModal(false);
    try {
      await clearAllSchedules();
      showToast('Todas as escalas foram zeradas!', 'success');
      await loadAllData();
    } catch (err) {
      showToast('Erro ao zerar escalas', 'danger');
    }
  };

  const handleClearAvailability = async () => {
    setShowClearAvailModal(false);
    try {
      await clearAllAvailability();
      showToast('Todas as disponibilidades foram removidas!', 'success');
      await loadAllData();
    } catch (err) {
      showToast('Erro ao limpar disponibilidades', 'danger');
    }
  };

  const handleTogglePublish = () => {
    setShowPublishModal(true);
  };

  const confirmTogglePublish = async () => {
    setShowPublishModal(false);
    const nextPublished = !isPublished;
    try {
      await togglePublishSchedule({
        published: nextPublished,
        month,
        church: church === 'Todas' ? '' : church
      });
      showToast(
        nextPublished ? 'Escala oficial disponibilizada para a equipe!' : 'Escala retornada para o modo Rascunho.',
        'success'
      );
      await loadAllData();
    } catch (err) {
      showToast('Erro ao alterar status da escala', 'danger');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="card" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <Shield color="var(--primary)" size={24} /> Painel do Líder
            </h2>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '0.25rem 0.65rem',
              borderRadius: '20px',
              background: isPublished ? 'rgba(34, 197, 94, 0.15)' : 'rgba(234, 179, 8, 0.15)',
              color: isPublished ? '#4ade80' : '#facc15',
              border: `1px solid ${isPublished ? 'rgba(34, 197, 94, 0.3)' : 'rgba(234, 179, 8, 0.3)'}`
            }}>
              {isPublished ? 'Escala Liberada' : 'Modo Rascunho'}
            </span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Gerencie e monte a escala com base na disponibilidade dos integrantes.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary"
            onClick={() => setShowMemberModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
          >
            <UserPlus size={16} /> Cadastrar Integrante
          </button>

          <button
            className={`btn ${isPublished ? 'btn-secondary' : 'btn-primary'}`}
            onClick={handleTogglePublish}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.85rem' }}
          >
            <Send size={16} />
            {isPublished ? 'Tornar Rascunho' : 'Disponibilizar Escala'}
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => setShowClearAvailModal(true)}
            style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: '#f87171', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
            title="Limpar todas as disponibilidades"
          >
            <Trash2 size={16} /> Limpar Disponibilidades
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => setShowClearSchedModal(true)}
            style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: '#f87171', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
            title="Zerar Integrantes Escalados"
          >
            <Trash2 size={16} /> Limpar Escalas
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Cultos e Escalamento</h3>

        {filteredServices.map((service) => {
          const currentSched = scheduleData.find((s) => s.service_id === service.id) || {};
          const serviceAvails = availabilityList.filter((a) => a.service_id === service.id);

          return (
            <div key={service.id} className="card" style={{ borderLeft: '4px solid var(--primary)', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                    <span className={`badge badge-${service.church.toLowerCase()}`}>{service.church}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      <Calendar size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '3px' }} />
                      {formatDateBR(service.date)} • {service.day_time}
                    </span>
                  </div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{service.title}</h4>
                </div>

                <button
                  className="btn btn-primary"
                  style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', height: '38px' }}
                  onClick={() => openEditModal(service)}
                >
                  Montar / Editar Escala
                </button>
              </div>

              <div style={{
                background: 'rgba(10, 14, 23, 0.5)',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                fontSize: '0.8rem'
              }}>
                <div style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Users size={14} /> Voluntários disponíveis ({serviceAvails.length}):
                </div>
                {serviceAvails.length === 0 ? (
                  <span style={{ color: 'var(--text-dark)' }}>Nenhum integrante respondeu disponibilidade para este culto.</span>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {serviceAvails.map((a) => (
                      <span
                        key={a.id}
                        style={{
                          background: 'rgba(201, 168, 122, 0.12)',
                          border: '1px solid rgba(201, 168, 122, 0.25)',
                          color: '#e5c99f',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '6px',
                          fontWeight: 600,
                          fontSize: '0.78rem'
                        }}
                      >
                        {a.member_name} ({a.role})
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.6rem', fontSize: '0.82rem', background: 'rgba(255,255,255,0.02)', padding: '0.65rem 0.85rem', borderRadius: '8px' }}>
                <div><span style={{ color: 'var(--text-muted)' }}>Teclado:</span> <strong>{currentSched.keyboard_member || '-'}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Violão:</span> <strong>{currentSched.guitar_member || '-'}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Baixo:</span> <strong>{currentSched.bass_member || '-'}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Bateria:</span> <strong>{currentSched.drums_member || '-'}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Vocais:</span> <strong>{currentSched.vocal_members || '-'}</strong></div>
              </div>
            </div>
          );
        })}
      </div>

      {activeModalService && (
        <div className="modal-overlay" onClick={() => setActiveModalService(null)}>
          <div className="modal-content" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div>
                <span className={`badge badge-${activeModalService.church.toLowerCase()}`} style={{ marginRight: '0.5rem' }}>{activeModalService.church}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{formatDateBR(activeModalService.date)} • {activeModalService.day_time}</span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '0.2rem' }}>Montar Escala do Culto</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalService(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.3rem' }}
              >
                <X size={20} />
              </button>
            </div>

            {(() => {
              const serviceAvails = availabilityList.filter((a) => a.service_id === activeModalService.id);
              return (
                <form onSubmit={handleSaveSchedule} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ background: 'rgba(10, 14, 23, 0.6)', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Users size={15} /> Voluntários Disponíveis (Toque para alocar):
                    </div>
                    {serviceAvails.length === 0 ? (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-dark)' }}>Nenhum voluntário respondeu disponível para este culto.</div>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {serviceAvails.map((a) => (
                          <button
                            type="button"
                            key={a.id}
                            onClick={() => {
                              const r = a.role.toLowerCase();
                              if (r.includes('teclado')) setEditForm((prev) => ({ ...prev, keyboard_member: a.member_name }));
                              else if (r.includes('viol') || r.includes('guit')) setEditForm((prev) => ({ ...prev, guitar_member: a.member_name }));
                              else if (r.includes('baixo')) setEditForm((prev) => ({ ...prev, bass_member: a.member_name }));
                              else if (r.includes('bater')) setEditForm((prev) => ({ ...prev, drums_member: a.member_name }));
                              else if (r.includes('vocal')) {
                                setEditForm((prev) => ({
                                  ...prev,
                                  vocal_members: prev.vocal_members && prev.vocal_members !== '-' ? `${prev.vocal_members} / ${a.member_name}` : a.member_name
                                }));
                              }
                              showToast(`${a.member_name} selecionado para ${a.role}!`, 'success');
                            }}
                            style={{
                              background: 'rgba(201, 168, 122, 0.15)',
                              border: '1px solid rgba(201, 168, 122, 0.3)',
                              color: '#f5ede0',
                              padding: '0.35rem 0.7rem',
                              borderRadius: '8px',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            + {a.member_name} ({a.role})
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                    <div>
                      <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Music size={15} color="var(--primary)" /> Teclado
                      </label>
                      <select
                        className="form-select"
                        value={editForm.keyboard_member}
                        onChange={(e) => setEditForm({ ...editForm, keyboard_member: e.target.value })}
                      >
                        <option value="-">- Ninguém</option>
                        <option value="CONVIDADO">CONVIDADO</option>
                        {members.map((m) => (
                          <option key={m.id} value={m.name}>
                            {m.name} {serviceAvails.some((a) => a.member_name === m.name) ? '(Disponível)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Volume2 size={15} color="var(--primary)" /> Violão / Guitarra
                      </label>
                      <select
                        className="form-select"
                        value={editForm.guitar_member}
                        onChange={(e) => setEditForm({ ...editForm, guitar_member: e.target.value })}
                      >
                        <option value="-">- Ninguém</option>
                        <option value="CONVIDADO">CONVIDADO</option>
                        {members.map((m) => (
                          <option key={m.id} value={m.name}>
                            {m.name} {serviceAvails.some((a) => a.member_name === m.name) ? '(Disponível)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Radio size={15} color="var(--primary)" /> Baixo
                      </label>
                      <select
                        className="form-select"
                        value={editForm.bass_member}
                        onChange={(e) => setEditForm({ ...editForm, bass_member: e.target.value })}
                      >
                        <option value="-">- Ninguém</option>
                        <option value="CONVIDADO">CONVIDADO</option>
                        {members.map((m) => (
                          <option key={m.id} value={m.name}>
                            {m.name} {serviceAvails.some((a) => a.member_name === m.name) ? '(Disponível)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Disc size={15} color="var(--primary)" /> Bateria / Cajón
                      </label>
                      <select
                        className="form-select"
                        value={editForm.drums_member}
                        onChange={(e) => setEditForm({ ...editForm, drums_member: e.target.value })}
                      >
                        <option value="-">- Ninguém</option>
                        <option value="CONVIDADO">CONVIDADO</option>
                        {members.map((m) => (
                          <option key={m.id} value={m.name}>
                            {m.name} {serviceAvails.some((a) => a.member_name === m.name) ? '(Disponível)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Mic size={15} color="var(--primary)" /> Ministro / Vocais
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ex: ANDREIA / BARBARA"
                      value={editForm.vocal_members}
                      onChange={(e) => setEditForm({ ...editForm, vocal_members: e.target.value })}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setActiveModalService(null)}>
                      Cancelar
                    </button>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>
                      <Save size={16} /> {saving ? 'Salvando...' : 'Salvar Escala'}
                    </button>
                  </div>
                </form>
              );
            })()}
          </div>
        </div>
      )}

      {showMemberModal && (
        <div className="modal-overlay" onClick={() => setShowMemberModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserPlus size={20} color="var(--primary)" /> Cadastrar Novo Integrante
              </h3>
              <button
                type="button"
                onClick={() => setShowMemberModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddMember} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Nome Completo</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: LUCAS BASTOS"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label">Função / Instrumento Principal</label>
                <select className="form-select" value={newMemberRole} onChange={(e) => setNewMemberRole(e.target.value)}>
                  <option value="Teclado">Teclado</option>
                  <option value="Violão">Violão</option>
                  <option value="Baixo">Baixo</option>
                  <option value="Bateria">Bateria</option>
                  <option value="Vocal">Vocal</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowMemberModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Salvar Integrante
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showClearAvailModal && (
        <div className="modal-overlay" onClick={() => setShowClearAvailModal(false)}>
          <div className="modal-content" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: 'center', padding: '0.5rem 0 1rem' }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.15)', color: '#f87171',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1rem'
              }}>
                <AlertTriangle size={28} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.5rem' }}>Limpar Disponibilidades</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Esta ação irá remover <strong>todas as disponibilidades</strong> registradas pelos integrantes. Eles terão que informar novamente para o próximo período.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowClearAvailModal(false)}>
                Cancelar
              </button>
              <button
                className="btn"
                style={{ flex: 1, background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.35)', fontWeight: 700 }}
                onClick={handleClearAvailability}
              >
                <Trash2 size={16} /> Confirmar Limpeza
              </button>
            </div>
          </div>
        </div>
      )}

      {showClearSchedModal && (
        <div className="modal-overlay" onClick={() => setShowClearSchedModal(false)}>
          <div className="modal-content" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: 'center', padding: '0.5rem 0 1rem' }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.15)', color: '#f87171',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1rem'
              }}>
                <AlertTriangle size={28} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.5rem' }}>Zerar Escalas</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Esta ação irá remover <strong>todos os integrantes escalados</strong> de todos os cultos do período atual. As disponibilidades serão mantidas.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowClearSchedModal(false)}>
                Cancelar
              </button>
              <button
                className="btn"
                style={{ flex: 1, background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.35)', fontWeight: 700 }}
                onClick={handleClearAll}
              >
                <Trash2 size={16} /> Confirmar Limpeza
              </button>
            </div>
          </div>
        </div>
      )}

      {showPublishModal && (
        <div className="modal-overlay" onClick={() => setShowPublishModal(false)}>
          <div className="modal-content" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: 'center', padding: '0.5rem 0 1rem' }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '50%',
                background: isPublished ? 'rgba(234,179,8,0.15)' : 'rgba(99,102,241,0.15)',
                color: isPublished ? '#facc15' : 'var(--primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1rem'
              }}>
                <Send size={26} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                {isPublished ? 'Voltar para Rascunho?' : 'Disponibilizar Escala?'}
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {isPublished
                  ? 'A escala será ocultada dos voluntários e voltará ao modo de edição.'
                  : 'A escala será publicada e todos os integrantes poderão visualizá-la.'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowPublishModal(false)}>
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                style={{ flex: 1, fontWeight: 700 }}
                onClick={confirmTogglePublish}
              >
                <Check size={16} /> {isPublished ? 'Confirmar' : 'Publicar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
