import { ScheduleItem } from '../types/database';
import { formatDateBR } from './api';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || 'BE0cmygORmaIm-Nvk7oROFRKHqPUSlXzs1cnPLrMUnx2w1pX8lp2i8ImhW6dZOAQsPG8gItoQjZNAvehHFCz2bw';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  try {
    await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    // Usa a registration do ready (garantido com SW ativo)
    const readyReg = await navigator.serviceWorker.ready;
    return readyReg;
  } catch (err) {
    console.error('Erro ao registrar Service Worker:', err);
    return null;
  }
}

export function isNotificationSupported(): boolean {
  return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
}

export function isNotificationGranted(): boolean {
  return 'Notification' in window && Notification.permission === 'granted';
}

export async function subscribeUserToPush(memberName: string): Promise<{ success: boolean; message: string }> {
  if (!isNotificationSupported()) {
    return { success: false, message: 'Notificações Push não são suportadas neste navegador.' };
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return { success: false, message: 'Permissão de notificação foi negada no navegador.' };
  }

  const reg = await registerServiceWorker();
  if (!reg) {
    return { success: false, message: 'Não foi possível registrar o Service Worker no navegador.' };
  }

  try {
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      const convertedKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      console.log('[Push] VAPID key length:', convertedKey.length, 'first byte:', convertedKey[0]);
      // Passa o Uint8Array diretamente (não .buffer) para evitar bytes extras
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: new Uint8Array(convertedKey) as unknown as ArrayBuffer
      });
    }

    const cleanName = memberName.toUpperCase().trim();
    const subJSON = sub.toJSON();

    if (isSupabaseConfigured && subJSON.endpoint && subJSON.keys) {
      await supabase.from('push_subscriptions').upsert({
        member_name: cleanName,
        endpoint: subJSON.endpoint,
        p256dh: subJSON.keys.p256dh,
        auth: subJSON.keys.auth,
        created_at: new Date().toISOString()
      }, { onConflict: 'endpoint' });
    }

    try {
      await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_name: cleanName,
          subscription: subJSON
        })
      });
    } catch (e) {}

    localStorage.setItem('le_user_member_name', cleanName);
    localStorage.setItem('le_push_subscribed', 'true');

    return { success: true, message: `Lembretes ativados com sucesso para ${cleanName}!` };
  } catch (err: any) {
    return { success: false, message: err.message || 'Erro ao gerar assinatura de push.' };
  }
}

export async function showWebNotification(title: string, body: string, tag?: string) {
  if (!isNotificationGranted()) return;
  const reg = await navigator.serviceWorker.getRegistration();
  if (reg && reg.showNotification) {
    reg.showNotification(title, {
      body,
      icon: '/logo.jpg',
      badge: '/logo.jpg',
      tag: tag || 'escala-reminder',
      data: { url: window.location.origin }
    });
  } else {
    new Notification(title, {
      body,
      icon: '/logo.jpg',
      tag: tag || 'escala-reminder'
    });
  }
}

export function checkUpcomingScheduleReminders(scheduleList: ScheduleItem[]) {
  if (!isNotificationGranted() || scheduleList.length === 0) return;
  const savedMemberName = localStorage.getItem('le_user_member_name');
  if (!savedMemberName) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  scheduleList.forEach((item) => {
    if (!item.date) return;
    const serviceDate = new Date(item.date + 'T00:00:00');
    if (isNaN(serviceDate.getTime())) return;

    const diffTime = serviceDate.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    const upperName = savedMemberName.toUpperCase().trim();
    const isMemberEscalated = [
      item.keyboard_member,
      item.guitar_member,
      item.bass_member,
      item.drums_member,
      item.vocal_members
    ].some((val) => val && val.toUpperCase().includes(upperName));

    if (!isMemberEscalated) return;

    if (diffDays === 7 || diffDays === 1 || diffDays === 0) {
      const notifKey = `le_notif_sent_${item.service_id}_${diffDays}`;
      if (!localStorage.getItem(notifKey)) {
        const timeOnly = item.day_time.replace(/^[^\d]*/, '').trim();

        showWebNotification(
          '🎵 Lembrete de Escala',
          `Você está escalado para:\n${item.title}\n📅 ${formatDateBR(item.date)} às ${timeOnly || item.day_time} — Igreja ${item.church}`,
          `service-${item.service_id}-${diffDays}`
        );
        localStorage.setItem(notifKey, 'true');
      }
    }
  });
}
