import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { submitAvailability, formatDateBR } from '../services/api';
import { CheckCircle2, User, Music, CalendarCheck, Send, Check } from 'lucide-react';

export default function AvailabilityForm() {
  const { members, services, availabilityList, church, showToast, loadAllData } = useApp();

  const [name, setName] = useState('');
  const [role, setRole] = useState('Bateria');
  const [selectedServices, setSelectedServices] = useState([]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isCustomName, setIsCustomName] = useState(false);
  const [filterRole, setFilterRole] = useState('Bateria');

  const filteredServices = services.filter((s) => church === 'Todas' || s.church === church);

  const respondedServiceIds = availabilityList
    .filter((a) => name && a.member_name.toLowerCase() === name.toLowerCase())
    .map((a) => a.service_id);

  const roleCategories = ['Bateria', 'Teclado', 'Violão', 'Baixo', 'Vocal'];

  const filteredMembers = members
    .filter((m) => {
      if (!filterRole) return true;
      return (m.default_role || '').toLowerCase().includes(filterRole.toLowerCase());
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const toggleService = (id) => {
    if (selectedServices.includes(id)) {
      setSelectedServices(selectedServices.filter((sId) => sId !== id));
    } else {
      setSelectedServices([...selectedServices, id]);
    }
  };

  const selectAll = () => {
    if (selectedServices.length === filteredServices.length) {
      setSelectedServices([]);
    } else {
      setSelectedServices(filteredServices.map((s) => s.id));
    }
  };

  const handleMemberSelect = (selectedName) => {
    setName(selectedName);
    const found = members.find((m) => m.name === selectedName);
    if (found && found.default_role) {
      setRole(found.default_role);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Por favor, escolha ou digite o seu nome', 'danger');
      return;
    }
    if (selectedServices.length === 0) {
      showToast('Selecione pelo menos 1 culto para marcar disponibilidade', 'danger');
      return;
    }

    setSubmitting(true);
    try {
      await submitAvailability({
        service_ids: selectedServices,
        member_name: name,
        role,
        notes
      });
      showToast(`Disponibilidade registrada para ${selectedServices.length} culto(s)! O líder usará suas respostas para montar a escala.`, 'success');
      setSelectedServices([]);
      setNotes('');
      await loadAllData();
    } catch (err) {
      showToast('Erro ao salvar disponibilidade', 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: '650px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CalendarCheck color="var(--primary)" size={22} /> Registrar Disponibilidade
        </h2>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
          Escolha seu nome e selecione os cultos em que estará livre para servir.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0 }}>
              <User size={16} /> Seu Nome na Equipe
            </label>
            <button
              type="button"
              onClick={() => {
                setIsCustomName(!isCustomName);
                setName('');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary)',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {isCustomName ? 'Escolher da lista' : '+ Convidado?'}
            </button>
          </div>

          {!isCustomName ? (
            <>
              <select
                className="form-select"
                value={name}
                onChange={(e) => handleMemberSelect(e.target.value)}
                required
                style={{ fontSize: '0.95rem', fontWeight: 600 }}
              >
                <option value="">-- Selecione seu nome --</option>
                {members
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((m) => (
                    <option key={m.id} value={m.name}>
                      {m.name} ({m.default_role || 'Integrante'})
                    </option>
                  ))}
              </select>

              <div style={{ marginTop: '0.85rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 600 }}>
                  Ou filtre por instrumento:
                </div>
                <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingBottom: '0.35rem' }}>
                  {roleCategories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFilterRole(cat)}
                      style={{
                        border: `1px solid ${filterRole === cat ? 'var(--primary)' : 'var(--border-color)'}`,
                        background: filterRole === cat ? 'var(--primary)' : 'rgba(30, 42, 26, 0.6)',
                        color: filterRole === cat ? '#1e2a1a' : 'var(--text-muted)',
                        padding: '0.3rem 0.65rem',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: filterRole === cat ? 700 : 500,
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
                    {filteredMembers.map((m) => {
                      const isSelected = name === m.name;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => handleMemberSelect(m.name)}
                          style={{
                            border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border-color)'}`,
                            background: isSelected ? 'var(--primary)' : 'rgba(201, 168, 122, 0.08)',
                            color: isSelected ? '#1e2a1a' : 'var(--text-main)',
                            padding: '0.4rem 0.75rem',
                            borderRadius: '8px',
                            fontSize: '0.82rem',
                            fontWeight: isSelected ? 700 : 600,
                            cursor: 'pointer'
                          }}
                        >
                          {m.name}
                        </button>
                      );
                    })}
                  </div>
              </div>
            </>
          ) : (
            <input
              type="text"
              className="form-input"
              placeholder="Digite seu nome completo..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          )}
        </div>

        <div className="form-group" style={{ marginTop: '1rem' }}>
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Music size={16} /> Sua Função / Instrumento
          </label>
          <select className="form-select" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="Teclado">Teclado / Sanfona</option>
            <option value="Violão">Violão / Guitarra</option>
            <option value="Baixo">Baixista</option>
            <option value="Bateria">Baterista / Cajón</option>
            <option value="Vocal">Ministro / Vocal</option>
          </select>
        </div>

        <div style={{ marginTop: '1.25rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <label className="form-label">Selecione os Cultos Disponíveis</label>
            <button
              type="button"
              onClick={selectAll}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {selectedServices.length === filteredServices.length ? 'Desmarcar Todos' : 'Marcar Todos'}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: '320px', overflowY: 'auto' }}>
            {filteredServices.map((s) => {
              const isSelected = selectedServices.includes(s.id);
              const hasResponded = respondedServiceIds.includes(s.id);
              return (
                <div
                  key={s.id}
                  onClick={() => toggleService(s.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.85rem 1rem',
                    background: isSelected ? 'rgba(201, 168, 122, 0.15)' : 'rgba(30, 42, 26, 0.6)',
                    border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border-color)'}`,
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem', flexWrap: 'wrap' }}>
                      <span className={`badge badge-${s.church.toLowerCase()}`}>{s.church}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{formatDateBR(s.date)}</span>
                      {hasResponded && (
                        <span style={{ fontSize: '0.7rem', background: 'rgba(34,197,94,0.15)', color: '#4ade80', padding: '0.15rem 0.45rem', borderRadius: '4px', border: '1px solid rgba(34,197,94,0.3)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Check size={12} /> Respondido
                        </span>
                      )}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{s.title}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.day_time}</div>
                  </div>

                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '6px',
                    border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--border-color)'}`,
                    background: isSelected ? 'var(--primary)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {isSelected && <CheckCircle2 size={16} color="#1e2a1a" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Observações ou Restrições (Opcional)</label>
          <input
            type="text"
            className="form-input"
            placeholder="Ex: Disponível apenas no culto da noite..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={submitting}>
          <Send size={18} />
          {submitting ? 'Salvando...' : `Confirmar Presença (${selectedServices.length} cultos)`}
        </button>
      </form>
    </div>
  );
}
