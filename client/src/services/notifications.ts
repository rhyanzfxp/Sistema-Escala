import { ScheduleItem } from '../types/database';
import { formatDateBR } from './api';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const VAPID_PUBLIC_KEY =
  import.meta.env.VITE_VAPID_PUBLIC_KEY ||
  'BE0cmygORmaIm-Nvk7oROFRKHqPUSlXzs1cnPLrMUnx2w1pX8lp2i8ImhW6dZOAQsPG8gItoQjZNAvehHFCz2bw';

/** Converte base64url para Uint8Array (formato aceito pelo PushManager) */
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

/** Registra o Service Worker e retorna a registration ativa */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('[SW] Service Worker não suportado neste navegador.');
    return null;
  }
  try {
    // Registra o SW
    await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    // Aguarda até estar ativo (resolve com o SW ativo)
    const reg = await navigator.serviceWorker.ready;
    console.log('[SW] Service Worker ativo:', reg.active?.state);
    return reg;
  } catch (err) {
    console.error('[SW] Falha ao registrar Service Worker:', err);
    return null;
  }
}

export function isNotificationSupported(): boolean {
  return (
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  );
}

export function isNotificationGranted(): boolean {
  return 'Notification' in window && Notification.permission === 'granted';
}

export async function subscribeUserToPush(
  memberName: string
): Promise<{ success: boolean; message: string }> {
  if (!isNotificationSupported()) {
    return {
      success: false,
      message: 'Notificações Push não são suportadas neste navegador.',
    };
  }

  // Pede permissão
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return {
      success: false,
      message: 'Permissão de notificação foi negada. Habilite nas configurações do navegador.',
    };
  }

  // Registra o SW e aguarda estar ativo
  const reg = await registerServiceWorker();
  if (!reg) {
    return {
      success: false,
      message: 'Não foi possível registrar o Service Worker. Tente em outro navegador.',
    };
  }

  try {
    // Cancela assinatura antiga (chave VAPID pode ter mudado)
    const existingSub = await reg.pushManager.getSubscription();
    if (existingSub) {
      await existingSub.unsubscribe();
      console.log('[Push] Assinatura antiga cancelada.');
    }

    // Converte a chave VAPID para ArrayBuffer (evita erro de tipo TS com Uint8Array<ArrayBufferLike>)
    const appServerKeyArr = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
    console.log('[Push] VAPID key bytes:', appServerKeyArr.length, '| primeiro byte:', appServerKeyArr[0]);
    const appServerKey = appServerKeyArr.buffer.slice(
      appServerKeyArr.byteOffset,
      appServerKeyArr.byteOffset + appServerKeyArr.byteLength
    ) as ArrayBuffer;

    // Cria nova assinatura push
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: appServerKey,
    });

    const cleanName = memberName.toUpperCase().trim();
    const subJSON = sub.toJSON() as {
      endpoint: string;
      keys: { p256dh: string; auth: string };
    };

    console.log('[Push] Assinatura criada com sucesso. Endpoint:', subJSON.endpoint?.substring(0, 40) + '...');

    // Salva no Supabase
    if (isSupabaseConfigured && subJSON.endpoint && subJSON.keys) {
      const { error: supaErr } = await supabase
        .from('push_subscriptions')
        .upsert(
          {
            member_name: cleanName,
            endpoint: subJSON.endpoint,
            p256dh: subJSON.keys.p256dh,
            auth: subJSON.keys.auth,
            created_at: new Date().toISOString(),
          },
          { onConflict: 'endpoint' }
        );
      if (supaErr) {
        console.warn('[Push] Aviso ao salvar no Supabase:', supaErr.message);
      }
    }

    // Salva também via API serverless
    try {
      const resp = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_name: cleanName, subscription: subJSON }),
      });
      console.log('[Push] API /subscribe status:', resp.status);
    } catch (apiErr) {
      console.warn('[Push] Erro ao chamar /api/subscribe:', apiErr);
    }

    localStorage.setItem('le_user_member_name', cleanName);
    localStorage.setItem('le_push_subscribed', 'true');

    return {
      success: true,
      message: `✅ Lembretes ativados com sucesso para ${cleanName}!`,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[Push] Erro ao criar assinatura push:', err);
    return {
      success: false,
      message: `Erro ao ativar notificações: ${message}`,
    };
  }
}

export async function showWebNotification(title: string, body: string, tag?: string) {
  if (!isNotificationGranted()) return;
  const reg = await navigator.serviceWorker.getRegistration();
  if (reg?.showNotification) {
    reg.showNotification(title, {
      body,
      icon: '/logo.jpg',
      badge: '/logo.jpg',
      tag: tag || 'escala-reminder',
      data: { url: window.location.origin },
    });
  } else if ('Notification' in window) {
    new Notification(title, { body, icon: '/logo.jpg', tag: tag || 'escala-reminder' });
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

    const diffDays = Math.round(
      (serviceDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    const upperName = savedMemberName.toUpperCase().trim();
    const isMemberEscalated = [
      item.keyboard_member,
      item.guitar_member,
      item.bass_member,
      item.drums_member,
      item.vocal_members,
    ].some((val) => val && val.toUpperCase().includes(upperName));

    if (!isMemberEscalated) return;

    if (diffDays === 7 || diffDays === 1 || diffDays === 0) {
      const notifKey = `le_notif_sent_${item.service_id}_${diffDays}`;
      if (!localStorage.getItem(notifKey)) {
        const timeOnly = item.day_time.replace(/^[^\d]*/, '').trim();
        showWebNotification(
          '🎵 Lembrete de Escala',
          `Você está escalado para:\n${item.title}\n📅 ${formatDateBR(item.date)} às ${
            timeOnly || item.day_time
          } — Igreja ${item.church}`,
          `service-${item.service_id}-${diffDays}`
        );
        localStorage.setItem(notifKey, 'true');
      }
    }
  });
}
