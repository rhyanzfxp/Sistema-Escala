import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { fetchMembers, fetchServices, fetchSchedule, fetchAvailability } from '../services/api';
import { Member, Service, ScheduleItem, Availability } from '../types/database';

export interface SwapModalState {
  open: boolean;
  item: {
    serviceId: number;
    roleField: 'keyboard_member' | 'guitar_member' | 'bass_member' | 'drums_member' | 'vocal_members';
    roleName: string;
    currentMember: string;
    title: string;
    date: string;
  } | null;
}

export interface ToastState {
  message: string;
  type: 'success' | 'danger';
}

interface AppContextType {
  church: string;
  setChurch: (church: string) => void;
  month: string;
  setMonth: (month: string) => void;
  activeTab: 'schedule' | 'availability' | 'admin';
  setActiveTab: (tab: 'schedule' | 'availability' | 'admin') => void;
  isAdmin: boolean;
  setIsAdmin: (isAdmin: boolean) => void;
  members: Member[];
  services: Service[];
  scheduleData: ScheduleItem[];
  availabilityList: Availability[];
  loading: boolean;
  loadAllData: () => Promise<void>;
  swapModal: SwapModalState;
  setSwapModal: React.Dispatch<React.SetStateAction<SwapModalState>>;
  toast: ToastState | null;
  showToast: (message: string, type?: 'success' | 'danger') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [church, setChurch] = useState<string>('Todas');
  const [month, setMonth] = useState<string>('2026-08');
  const [activeTab, setActiveTab] = useState<'schedule' | 'availability' | 'admin'>('schedule');
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [scheduleData, setScheduleData] = useState<ScheduleItem[]>([]);
  const [availabilityList, setAvailabilityList] = useState<Availability[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [swapModal, setSwapModal] = useState<SwapModalState>({ open: false, item: null });
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = (message: string, type: 'success' | 'danger' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [membersRes, servicesRes, schedRes, availRes] = await Promise.all([
        fetchMembers(),
        fetchServices(church === 'Todas' ? '' : church, month),
        fetchSchedule(church === 'Todas' ? '' : church, month),
        fetchAvailability(church, month)
      ]);
      setMembers(membersRes);
      setServices(servicesRes);
      setScheduleData(schedRes);
      setAvailabilityList(availRes);
    } catch (err) {
      showToast('Erro ao carregar dados', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [church, month]);

  return (
    <AppContext.Provider
      value={{
        church,
        setChurch,
        month,
        setMonth,
        activeTab,
        setActiveTab,
        isAdmin,
        setIsAdmin,
        members,
        services,
        scheduleData,
        availabilityList,
        loading,
        loadAllData,
        swapModal,
        setSwapModal,
        toast,
        showToast
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
