import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatDateBR } from '../services/api';
import { RefreshCw, Share2, ArrowRightLeft, Music, Volume2, Radio, Disc, Mic, Calendar, AlertCircle, CalendarCheck, Clock } from 'lucide-react';
import ExportCard from './ExportCard';

export default function ScheduleView() {
  const { scheduleData, church, setSwapModal, isAdmin, loading, loadAllData, setActiveTab } = useApp();
  const [showExportModal, setShowExportModal] = useState<boolean>(false);

  const filteredSchedule = scheduleData.filter((item) => church === 'Todas' || item.church === church);
  const isPublished = filteredSchedule.length > 0 && filteredSchedule.some((item) => item.published === 1);

  const openSwap = (
    serviceId: number,
    roleField: 'keyboard_member' | 'guitar_member' | 'bass_member' | 'drums_member' | 'vocal_members',
    currentMember: string,
    serviceTitle: string,
    churchName: string,
    dateStr: string
  ) => {
    if (!currentMember || currentMember === '-' || currentMember === 'CONVIDADO') return;
    setSwapModal({
      open: true,
      item: {
        serviceId,
        roleField,
        roleName: roleField,
        currentMember,
        title: serviceTitle,
        date: formatDateBR(dateStr)
      }
    });
  };

  if (!isPublished && !isAdmin) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.3px' }}>Escala de Louvor</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Status da Escala Mensal</p>
          </div>
          <button className="btn btn-secondary" onClick={loadAllData} title="Atualizar">
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
          </button>
        </div>

        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem', border: '1px dashed rgba(234, 179, 8, 0.5)' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(234, 179, 8, 0.15)',
            color: '#facc15',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem'
          }}>
            <Clock size={32} />
          </div>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f8fafc', marginBottom: '0.5rem' }}>
            Escala deste mês em Fase de Montagem
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', maxWidth: '520px', margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
            O líder do ministério de louvor está organizando a escala de acordo com a disponibilidade informada pelos voluntários. Assim que todos forem alocados, a escala oficial será divulgada aqui.
          </p>
          <button className="btn btn-primary" onClick={() => setActiveTab('availability')} style={{ margin: '0 auto', fontSize: '0.95rem', padding: '0.65rem 1.25rem' }}>
            <CalendarCheck size={18} /> Registrar ou Atualizar Minha Disponibilidade
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.3px', margin: 0 }}>Escala de Louvor</h2>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '0.2rem 0.55rem',
              borderRadius: '20px',
              background: isPublished ? 'rgba(34, 197, 94, 0.15)' : 'rgba(234, 179, 8, 0.15)',
              color: isPublished ? '#4ade80' : '#facc15',
              border: `1px solid ${isPublished ? 'rgba(34, 197, 94, 0.3)' : 'rgba(234, 179, 8, 0.3)'}`
            }}>
              {isPublished ? 'Oficial Liberada' : 'Rascunho (Líder)'}
            </span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Clique em qualquer integrante escalado para solicitar ou realizar uma troca por imprevisto.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={loadAllData} title="Atualizar Escala">
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
          </button>
          <button className="btn btn-primary" onClick={() => setShowExportModal(true)}>
            <Share2 size={16} /> Compartilhar WhatsApp
          </button>
        </div>
      </div>

      {filteredSchedule.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <AlertCircle size={40} color="var(--text-muted)" style={{ marginBottom: '0.75rem' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Nenhuma escala encontrada</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Selecione outro mês ou igreja no topo da tela.
          </p>
        </div>
      ) : (
        <>
          <div className="desktop-only table-responsive">
            <table className="schedule-table">
              <thead>
                <tr>
                  <th>Data / Hora</th>
                  <th>Igreja & Culto</th>
                  <th><Music size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} /> Teclado</th>
                  <th><Volume2 size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} /> Violão</th>
                  <th><Radio size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} /> Baixo</th>
                  <th><Disc size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} /> Bateria</th>
                  <th><Mic size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} /> Vocais</th>
                </tr>
              </thead>
              <tbody>
                {filteredSchedule.map((item) => (
                  <tr key={item.service_id}>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{formatDateBR(item.date)}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.day_time}</div>
                    </td>
                    <td>
                      <span className={`badge badge-${item.church.toLowerCase()}`} style={{ marginRight: '0.5rem' }}>
                        {item.church}
                      </span>
                      <strong style={{ fontSize: '0.9rem' }}>{item.title}</strong>
                    </td>
                    <td>
                      <span
                        className={`role-slot ${!item.keyboard_member || item.keyboard_member === '-' ? 'empty' : ''}`}
                        onClick={() => openSwap(item.service_id, 'keyboard_member', item.keyboard_member, item.title, item.church, item.date)}
                      >
                        {item.keyboard_member || '-'}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`role-slot ${!item.guitar_member || item.guitar_member === '-' ? 'empty' : ''}`}
                        onClick={() => openSwap(item.service_id, 'guitar_member', item.guitar_member, item.title, item.church, item.date)}
                      >
                        {item.guitar_member || '-'}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`role-slot ${!item.bass_member || item.bass_member === '-' ? 'empty' : ''}`}
                        onClick={() => openSwap(item.service_id, 'bass_member', item.bass_member, item.title, item.church, item.date)}
                      >
                        {item.bass_member || '-'}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`role-slot ${!item.drums_member || item.drums_member === '-' ? 'empty' : ''}`}
                        onClick={() => openSwap(item.service_id, 'drums_member', item.drums_member, item.title, item.church, item.date)}
                      >
                        {item.drums_member || '-'}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`role-slot ${!item.vocal_members || item.vocal_members === '-' ? 'empty' : ''}`}
                        onClick={() => openSwap(item.service_id, 'vocal_members', item.vocal_members, item.title, item.church, item.date)}
                      >
                        {item.vocal_members || '-'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mobile-only" style={{ flexDirection: 'column', gap: '1rem' }}>
            {filteredSchedule.map((item) => (
              <div key={item.service_id} className="card" style={{ position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
                  <div>
                    <span className={`badge badge-${item.church.toLowerCase()}`}>{item.church}</span>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginTop: '0.25rem' }}>{item.title}</h3>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.15rem' }}>
                      <Calendar size={13} /> {formatDateBR(item.date)} • {item.day_time}
                    </div>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--primary)', opacity: 0.8, fontWeight: 600, textAlign: 'right' }}>
                    Toque no nome para trocar
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.4rem' }}>
                  <div
                    onClick={() => openSwap(item.service_id, 'keyboard_member', item.keyboard_member, item.title, item.church, item.date)}
                    style={{
                      background: 'rgba(10, 14, 23, 0.6)',
                      padding: '0.55rem 0.7rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Music size={12} /> Teclado
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, marginTop: '0.1rem', color: item.keyboard_member && item.keyboard_member !== '-' ? '#fff' : 'var(--text-dark)' }}>
                      {item.keyboard_member || '-'}
                    </div>
                  </div>

                  <div
                    onClick={() => openSwap(item.service_id, 'guitar_member', item.guitar_member, item.title, item.church, item.date)}
                    style={{
                      background: 'rgba(10, 14, 23, 0.6)',
                      padding: '0.55rem 0.7rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Volume2 size={12} /> Violão
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, marginTop: '0.1rem', color: item.guitar_member && item.guitar_member !== '-' ? '#fff' : 'var(--text-dark)' }}>
                      {item.guitar_member || '-'}
                    </div>
                  </div>

                  <div
                    onClick={() => openSwap(item.service_id, 'bass_member', item.bass_member, item.title, item.church, item.date)}
                    style={{
                      background: 'rgba(10, 14, 23, 0.6)',
                      padding: '0.55rem 0.7rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Radio size={12} /> Baixo
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, marginTop: '0.1rem', color: item.bass_member && item.bass_member !== '-' ? '#fff' : 'var(--text-dark)' }}>
                      {item.bass_member || '-'}
                    </div>
                  </div>

                  <div
                    onClick={() => openSwap(item.service_id, 'drums_member', item.drums_member, item.title, item.church, item.date)}
                    style={{
                      background: 'rgba(10, 14, 23, 0.6)',
                      padding: '0.55rem 0.7rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Disc size={12} /> Bateria
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, marginTop: '0.1rem', color: item.drums_member && item.drums_member !== '-' ? '#fff' : 'var(--text-dark)' }}>
                      {item.drums_member || '-'}
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => openSwap(item.service_id, 'vocal_members', item.vocal_members, item.title, item.church, item.date)}
                  style={{
                    background: 'rgba(10, 14, 23, 0.6)',
                    padding: '0.55rem 0.7rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    marginTop: '0.4rem',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Mic size={12} /> Ministro / Vocais
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, marginTop: '0.1rem', color: item.vocal_members && item.vocal_members !== '-' ? '#fff' : 'var(--text-dark)' }}>
                    {item.vocal_members || '-'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {showExportModal && <ExportCard onClose={() => setShowExportModal(false)} scheduleItems={filteredSchedule} />}
    </div>
  );
}
