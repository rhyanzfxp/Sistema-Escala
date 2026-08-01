export interface Member {
  id: number;
  name: string;
  default_role: string;
  created_at?: string;
}

export interface Service {
  id: number;
  church: string;
  date: string;
  day_time: string;
  title: string;
  week_num?: number;
}

export interface Availability {
  id: number;
  service_id: number;
  member_name: string;
  role: string;
  notes?: string;
  created_at?: string;
  church?: string;
  date?: string;
  day_time?: string;
  title?: string;
}

export interface ScheduleItem {
  service_id: number;
  church: string;
  date: string;
  day_time: string;
  title: string;
  week_num?: number;
  schedule_id?: number;
  keyboard_member: string;
  guitar_member: string;
  bass_member: string;
  drums_member: string;
  vocal_members: string;
  published: number;
  updated_at?: string;
}

export interface SwapLog {
  id: number;
  service_id: number;
  role: string;
  old_member: string;
  new_member: string;
  created_at: string;
  church?: string;
  date?: string;
  title?: string;
}

export interface SubmitAvailabilityPayload {
  service_ids: number[];
  member_name: string;
  role: string;
  notes?: string;
}

export interface SwapDataPayload {
  service_id: number;
  role_field: 'keyboard_member' | 'guitar_member' | 'bass_member' | 'drums_member' | 'vocal_members';
  old_member: string;
  new_member: string;
}

export interface UpdateSchedulePayload {
  service_id: number;
  keyboard_member?: string;
  guitar_member?: string;
  bass_member?: string;
  drums_member?: string;
  vocal_members?: string;
}

export interface AddMemberPayload {
  name: string;
  default_role: string;
}
