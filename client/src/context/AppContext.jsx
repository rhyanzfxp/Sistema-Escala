import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchMembers, fetchServices, fetchSchedule } from '../services/api';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [church, setChurch] = useState('Todas');
  const [month, setMonth] = useState('2026-08');
  const [activeTab, setActiveTab] = useState('schedule');
  const [isAdmin, setIsAdmin] = useState(false);
  const [members, setMembers] = useState([]);
  const [services, setServices] = useState([]);
  const [scheduleData, setScheduleData] = useState([]);
  const [availabilityList, setAvailabilityList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [swapModal, setSwapModal] = useState({ open: false, item: null });
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      let availUrl = `/api/availability?month=${month}`;
      if (church !== 'Todas') availUrl += `&church=${encodeURIComponent(church)}`;
      
      const [membersRes, servicesRes, schedRes, availRes] = await Promise.all([
        fetchMembers(),
        fetchServices(church === 'Todas' ? '' : church, month),
        fetchSchedule(church === 'Todas' ? '' : church, month),
        fetch(availUrl).then((r) => (r.ok ? r.json() : [])).catch(() => [])
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


export function useApp() {
  return useContext(AppContext);
}
