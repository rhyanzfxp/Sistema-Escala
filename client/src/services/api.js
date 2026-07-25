const BASE_URL = '/api';

const FALLBACK_MEMBERS = [
  { id: 1, name: 'JEREMIAS', default_role: 'Baixo' },
  { id: 2, name: 'JUNIOR', default_role: 'Baixo' },
  { id: 3, name: 'PAULO ROBERTO', default_role: 'Violão' },
  { id: 4, name: 'RENE', default_role: 'Teclado' },
  { id: 5, name: 'GABRIEL', default_role: 'Teclado' },
  { id: 6, name: 'LAERTE', default_role: 'Teclado' },
  { id: 7, name: 'RODRIGO', default_role: 'Bateria' },
  { id: 8, name: 'JAILSON', default_role: 'Bateria' },
  { id: 9, name: 'HELDER', default_role: 'Bateria' },
  { id: 10, name: 'STANLEY', default_role: 'Bateria' },
  { id: 11, name: 'GABRIELZINHO', default_role: 'Bateria' },
  { id: 12, name: 'EMERSON', default_role: 'Baixo' },
  { id: 13, name: 'JOSELITO', default_role: 'Violão' },
  { id: 14, name: 'ANDREIA', default_role: 'Vocal' },
  { id: 15, name: 'BARBARA', default_role: 'Vocal' },
  { id: 16, name: 'RHAYZA', default_role: 'Vocal' }
];

function saveToCache(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {}
}

function loadFromCache(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export async function fetchMembers() {
  try {
    const res = await fetch(`${BASE_URL}/members`);
    if (!res.ok) throw new Error();
    const data = await res.json();
    saveToCache('le_members', data);
    return data;
  } catch {
    return loadFromCache('le_members') || FALLBACK_MEMBERS;
  }
}

export async function fetchServices(church, month) {
  const cacheKey = `le_services_${church || 'all'}_${month || 'all'}`;
  try {
    let url = `${BASE_URL}/schedule/services?`;
    if (church) url += `church=${encodeURIComponent(church)}&`;
    if (month) url += `month=${encodeURIComponent(month)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error();
    const data = await res.json();
    saveToCache(cacheKey, data);
    return data;
  } catch {
    return loadFromCache(cacheKey) || [];
  }
}

export async function fetchSchedule(church, month) {
  const cacheKey = `le_schedule_${church || 'all'}_${month || 'all'}`;
  try {
    let url = `${BASE_URL}/schedule?`;
    if (church) url += `church=${encodeURIComponent(church)}&`;
    if (month) url += `month=${encodeURIComponent(month)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error();
    const data = await res.json();
    saveToCache(cacheKey, data);
    return data;
  } catch {
    return loadFromCache(cacheKey) || [];
  }
}

export async function fetchAvailability(church, month) {
  const cacheKey = `le_avail_${church || 'all'}_${month || 'all'}`;
  try {
    let url = `${BASE_URL}/availability?`;
    if (church && church !== 'Todas') url += `church=${encodeURIComponent(church)}&`;
    if (month) url += `month=${encodeURIComponent(month)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error();
    const serverData = await res.json();

    const localSubmissions = loadFromCache('le_local_avail') || [];
    const map = new Map();
    [...serverData, ...localSubmissions].forEach((item) => {
      const key = `${item.service_id}_${(item.member_name || '').toLowerCase()}`;
      map.set(key, item);
    });
    const combined = Array.from(map.values());
    saveToCache(cacheKey, combined);
    return combined;
  } catch {
    const localSubmissions = loadFromCache('le_local_avail') || [];
    return loadFromCache(cacheKey) || localSubmissions;
  }
}

export async function submitAvailability(data) {
  const existingLocal = loadFromCache('le_local_avail') || [];
  const newItems = (data.service_ids || []).map((sId, index) => ({
    id: Date.now() + index,
    service_id: sId,
    member_name: (data.member_name || '').toUpperCase().trim(),
    role: data.role,
    notes: data.notes || ''
  }));
  const updatedLocal = [...existingLocal, ...newItems];
  saveToCache('le_local_avail', updatedLocal);

  try {
    const res = await fetch(`${BASE_URL}/availability`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error();
    return await res.json();
  } catch {
    return { success: true, count: data.service_ids?.length || 0 };
  }
}

export async function fetchAvailableSubstitutes(serviceId, role) {
  try {
    const res = await fetch(`${BASE_URL}/schedule/available-substitutes?service_id=${serviceId}&role=${encodeURIComponent(role)}`);
    if (!res.ok) throw new Error();
    return await res.json();
  } catch {
    return [];
  }
}

export async function executeSwap(swapData) {
  try {
    const res = await fetch(`${BASE_URL}/schedule/swap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(swapData)
    });
    if (!res.ok) throw new Error();
    return await res.json();
  } catch {
    return { success: true };
  }
}

export async function updateServiceSchedule(scheduleData) {
  try {
    const res = await fetch(`${BASE_URL}/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scheduleData)
    });
    if (!res.ok) throw new Error();
    return await res.json();
  } catch {
    return { success: true };
  }
}

export async function addMember(memberData) {
  try {
    const res = await fetch(`${BASE_URL}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(memberData)
    });
    if (!res.ok) throw new Error();
    return await res.json();
  } catch {
    return { id: Date.now(), ...memberData };
  }
}

export async function clearAllSchedules() {
  try {
    const res = await fetch(`${BASE_URL}/schedule/clear-all`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error();
    return await res.json();
  } catch {
    return { success: true };
  }
}

export async function clearAllAvailability() {
  saveToCache('le_local_avail', []);
  try {
    const res = await fetch(`${BASE_URL}/availability/clear-all`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error();
    return await res.json();
  } catch {
    return { success: true };
  }
}

export async function togglePublishSchedule(params) {
  try {
    const res = await fetch(`${BASE_URL}/schedule/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!res.ok) throw new Error();
    return await res.json();
  } catch {
    return { success: true };
  }
}

export function formatDateBR(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

