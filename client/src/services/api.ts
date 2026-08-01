import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  Member,
  Service,
  Availability,
  ScheduleItem,
  SwapLog,
  SubmitAvailabilityPayload,
  SwapDataPayload,
  UpdateSchedulePayload,
  AddMemberPayload
} from '../types/database';

const FALLBACK_MEMBERS: Member[] = [
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

const FALLBACK_SERVICES: Service[] = [
  { id: 1, church: 'Itaperi', date: '2026-07-29', day_time: 'QUARTA 19:30', title: 'CULTO DA PALAVRA ITAPERI', week_num: 1 },
  { id: 2, church: 'Industrial', date: '2026-07-30', day_time: 'QUINTA 19:30', title: 'CULTO DA PALAVRA INDUSTRIAL', week_num: 1 },
  { id: 3, church: 'Industrial', date: '2026-08-02', day_time: 'DOMINGO 10:00', title: 'CULTO INDUSTRIAL (MANHÃ)', week_num: 1 },
  { id: 4, church: 'Industrial', date: '2026-08-02', day_time: 'DOMINGO 17:00', title: 'CULTO INDUSTRIAL (TARDE)', week_num: 1 },
  { id: 5, church: 'Industrial', date: '2026-08-02', day_time: 'DOMINGO 19:00', title: 'CULTO INDUSTRIAL (NOITE)', week_num: 1 },
  { id: 6, church: 'Itaperi', date: '2026-08-02', day_time: 'DOMINGO 18:00', title: 'CULTO ITAPERI (NOITE)', week_num: 1 }
];

function saveToCache<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('LocalStorage write error:', e);
  }
}

function loadFromCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export async function fetchMembers(): Promise<Member[]> {
  const cacheKey = 'le_members_v2';
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      if (data && data.length > 0) {
        saveToCache(cacheKey, data);
        return data as Member[];
      }
    } catch (err) {
      console.warn('Supabase fetchMembers error, falling back to cache:', err);
    }
  }

  return loadFromCache<Member[]>(cacheKey) || FALLBACK_MEMBERS;
}

export async function fetchServices(church?: string, month?: string): Promise<Service[]> {
  const cacheKey = `le_services_${church || 'all'}_${month || 'all'}`;
  if (isSupabaseConfigured) {
    try {
      let query = supabase.from('services').select('*').order('date', { ascending: true }).order('id', { ascending: true });

      if (church && church !== 'Todas') {
        query = query.eq('church', church);
      }
      if (month) {
        // e.g. 2026-08
        const startDate = `${month}-01`;
        const endDate = `${month}-31`;
        query = query.gte('date', startDate).lte('date', endDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      if (data) {
        saveToCache(cacheKey, data);
        return data as Service[];
      }
    } catch (err) {
      console.warn('Supabase fetchServices error, falling back to cache:', err);
    }
  }

  const cached = loadFromCache<Service[]>(cacheKey);
  if (cached) return cached;
  return FALLBACK_SERVICES.filter(s => (!church || church === 'Todas' || s.church === church) && (!month || s.date.startsWith(month)));
}

export async function fetchSchedule(church?: string, month?: string): Promise<ScheduleItem[]> {
  const cacheKey = `le_schedule_${church || 'all'}_${month || 'all'}`;

  if (isSupabaseConfigured) {
    try {
      // Get all services matching criteria
      let serviceQuery = supabase.from('services').select('*').order('date', { ascending: true }).order('id', { ascending: true });
      if (church && church !== 'Todas') {
        serviceQuery = serviceQuery.eq('church', church);
      }
      if (month) {
        serviceQuery = serviceQuery.gte('date', `${month}-01`).lte('date', `${month}-31`);
      }

      const { data: servicesData, error: servicesError } = await serviceQuery;
      if (servicesError) throw servicesError;
      if (!servicesData || servicesData.length === 0) return [];

      const serviceIds = servicesData.map(s => s.id);

      // Fetch schedule for these services
      const { data: schedData, error: schedError } = await supabase
        .from('schedule')
        .select('*')
        .in('service_id', serviceIds);

      if (schedError) throw schedError;

      const schedMap = new Map<number, any>();
      (schedData || []).forEach(sc => schedMap.set(sc.service_id, sc));

      const combined: ScheduleItem[] = servicesData.map(s => {
        const sc = schedMap.get(s.id);
        return {
          service_id: s.id,
          church: s.church,
          date: s.date,
          day_time: s.day_time,
          title: s.title,
          week_num: s.week_num,
          schedule_id: sc?.id,
          keyboard_member: sc?.keyboard_member || '-',
          guitar_member: sc?.guitar_member || '-',
          bass_member: sc?.bass_member || '-',
          drums_member: sc?.drums_member || '-',
          vocal_members: sc?.vocal_members || '-',
          published: sc?.published || 0,
          updated_at: sc?.updated_at
        };
      });

      saveToCache(cacheKey, combined);
      return combined;
    } catch (err) {
      console.warn('Supabase fetchSchedule error, using cache:', err);
    }
  }

  const cached = loadFromCache<ScheduleItem[]>(cacheKey);
  if (cached) return cached;

  // Build fallback schedule from FALLBACK_SERVICES
  const filteredServices = FALLBACK_SERVICES.filter(s => (!church || church === 'Todas' || s.church === church) && (!month || s.date.startsWith(month)));
  return filteredServices.map(s => ({
    service_id: s.id,
    church: s.church,
    date: s.date,
    day_time: s.day_time,
    title: s.title,
    week_num: s.week_num,
    keyboard_member: '-',
    guitar_member: '-',
    bass_member: '-',
    drums_member: '-',
    vocal_members: '-',
    published: 0
  }));
}

export async function fetchAvailability(church?: string, month?: string): Promise<Availability[]> {
  const cacheKey = `le_avail_${church || 'all'}_${month || 'all'}`;

  if (isSupabaseConfigured) {
    try {
      let query = supabase.from('availability').select('*, services!inner(*)');
      
      if (church && church !== 'Todas') {
        query = query.eq('services.church', church);
      }
      if (month) {
        query = query.gte('services.date', `${month}-01`).lte('services.date', `${month}-31`);
      }

      const { data, error } = await query;
      if (error) throw error;

      const formatted: Availability[] = (data || []).map((item: any) => ({
        id: item.id,
        service_id: item.service_id,
        member_name: item.member_name,
        role: item.role,
        notes: item.notes,
        created_at: item.created_at,
        church: item.services?.church,
        date: item.services?.date,
        day_time: item.services?.day_time,
        title: item.services?.title
      }));

      saveToCache(cacheKey, formatted);
      return formatted;
    } catch (err) {
      console.warn('Supabase fetchAvailability error:', err);
    }
  }

  return loadFromCache<Availability[]>(cacheKey) || [];
}

export async function submitAvailability(payload: SubmitAvailabilityPayload): Promise<{ success: boolean; count: number }> {
  const cleanName = payload.member_name.toUpperCase().trim();
  const cleanNotes = payload.notes ? payload.notes.trim() : '';

  if (isSupabaseConfigured) {
    try {
      const rowsToInsert = payload.service_ids.map(service_id => ({
        service_id,
        member_name: cleanName,
        role: payload.role,
        notes: cleanNotes
      }));

      const { error } = await supabase.from('availability').insert(rowsToInsert);
      if (error) throw error;
      return { success: true, count: payload.service_ids.length };
    } catch (err) {
      console.error('Error submitting availability to Supabase:', err);
    }
  }

  // Local storage fallback logic
  const currentAvail = loadFromCache<Availability[]>('le_avail_all_all') || [];
  const newItems: Availability[] = payload.service_ids.map((sId, index) => ({
    id: Date.now() + index,
    service_id: sId,
    member_name: cleanName,
    role: payload.role,
    notes: cleanNotes
  }));
  saveToCache('le_avail_all_all', [...currentAvail, ...newItems]);
  return { success: true, count: payload.service_ids.length };
}

export async function fetchAvailableSubstitutes(serviceId: number, role: string): Promise<Array<{ member_name: string; role: string; notes?: string }>> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('availability')
        .select('member_name, role, notes')
        .eq('service_id', serviceId)
        .ilike('role', `%${role}%`)
        .order('member_name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching substitutes from Supabase:', err);
    }
  }

  const avail = loadFromCache<Availability[]>('le_avail_all_all') || [];
  return avail
    .filter(a => a.service_id === serviceId && a.role.toLowerCase().includes(role.toLowerCase()))
    .map(a => ({ member_name: a.member_name, role: a.role, notes: a.notes }));
}

export async function executeSwap(swapData: SwapDataPayload): Promise<{ success: boolean; updatedVal?: string }> {
  if (isSupabaseConfigured) {
    try {
      // 1. Get current schedule record
      const { data: sched, error: fetchErr } = await supabase
        .from('schedule')
        .select('*')
        .eq('service_id', swapData.service_id)
        .single();

      if (fetchErr && fetchErr.code !== 'PGRST116') throw fetchErr;

      let currentVal = (sched ? sched[swapData.role_field] : '') || '-';
      let updatedVal = currentVal;

      if (swapData.role_field === 'vocal_members' && currentVal.includes('/')) {
        updatedVal = currentVal.replace(swapData.old_member, swapData.new_member);
      } else {
        updatedVal = swapData.new_member;
      }

      // 2. Upsert schedule
      const { error: upsertErr } = await supabase
        .from('schedule')
        .upsert({
          service_id: swapData.service_id,
          [swapData.role_field]: updatedVal,
          updated_at: new Date().toISOString()
        }, { onConflict: 'service_id' });

      if (upsertErr) throw upsertErr;

      // 3. Log swap
      await supabase.from('swap_logs').insert({
        service_id: swapData.service_id,
        role: swapData.role_field,
        old_member: swapData.old_member,
        new_member: swapData.new_member
      });

      return { success: true, updatedVal };
    } catch (err) {
      console.error('Error executing swap in Supabase:', err);
    }
  }

  return { success: true };
}

export async function updateServiceSchedule(scheduleData: UpdateSchedulePayload): Promise<{ success: boolean }> {
  if (isSupabaseConfigured) {
    try {
      const payloadToSave = {
        service_id: scheduleData.service_id,
        keyboard_member: scheduleData.keyboard_member ?? '-',
        guitar_member: scheduleData.guitar_member ?? '-',
        bass_member: scheduleData.bass_member ?? '-',
        drums_member: scheduleData.drums_member ?? '-',
        vocal_members: scheduleData.vocal_members ?? '-',
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('schedule')
        .upsert(payloadToSave, { onConflict: 'service_id' });

      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.error('Error updating schedule in Supabase:', err);
    }
  }

  return { success: true };
}

export async function addMember(memberData: AddMemberPayload): Promise<Member> {
  const cleanName = memberData.name.toUpperCase().trim();
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('members')
        .insert({ name: cleanName, default_role: memberData.default_role })
        .select()
        .single();

      if (error) throw error;
      return data as Member;
    } catch (err) {
      console.error('Error adding member to Supabase:', err);
    }
  }

  const existing = loadFromCache<Member[]>('le_members_v2') || FALLBACK_MEMBERS;
  const newMember: Member = { id: Date.now(), name: cleanName, default_role: memberData.default_role };
  saveToCache('le_members_v2', [...existing, newMember]);
  return newMember;
}

export async function clearAllSchedules(): Promise<{ success: boolean }> {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase
        .from('schedule')
        .update({
          keyboard_member: '-',
          guitar_member: '-',
          bass_member: '-',
          drums_member: '-',
          vocal_members: '-',
          updated_at: new Date().toISOString()
        })
        .neq('id', 0); // update all rows

      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.error('Error clearing schedules in Supabase:', err);
    }
  }

  return { success: true };
}

export async function clearAllAvailability(): Promise<{ success: boolean }> {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('availability').delete().neq('id', 0);
      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.error('Error clearing availability in Supabase:', err);
    }
  }

  saveToCache('le_avail_all_all', []);
  return { success: true };
}

export async function togglePublishSchedule(params: { published: boolean; month?: string; church?: string }): Promise<{ success: boolean }> {
  if (isSupabaseConfigured) {
    try {
      let serviceIdsQuery = supabase.from('services').select('id');
      if (params.church && params.church !== 'Todas') {
        serviceIdsQuery = serviceIdsQuery.eq('church', params.church);
      }
      if (params.month) {
        serviceIdsQuery = serviceIdsQuery.gte('date', `${params.month}-01`).lte('date', `${params.month}-31`);
      }

      const { data: services, error: sErr } = await serviceIdsQuery;
      if (sErr) throw sErr;

      if (services && services.length > 0) {
        const ids = services.map(s => s.id);
        const { error } = await supabase
          .from('schedule')
          .update({
            published: params.published ? 1 : 0,
            updated_at: new Date().toISOString()
          })
          .in('service_id', ids);

        if (error) throw error;
      }
      return { success: true };
    } catch (err) {
      console.error('Error toggling publish state in Supabase:', err);
    }
  }

  return { success: true };
}

export function formatDateBR(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}
