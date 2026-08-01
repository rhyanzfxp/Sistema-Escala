const { createClient } = require('@supabase/supabase-js');
const webpush = require('web-push');

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || 'BKPms99uKMuhQ9UTvbfzX2-7sWbMuAfI3LDu-6oRnrnZKhUMY9KqFOWwZutR-CxGj9nf-SYWB7pXhd5R6crUu6M';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || 'za8DRf-eePxAT6ZDjqztZxhvqSvUTUX4pIftIIA2SEk';

webpush.setVapidDetails(
  'mailto:contato@louvorescala.com',
  vapidPublicKey,
  vapidPrivateKey
);

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://seu-projeto.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
const supabase = createClient(supabaseUrl, supabaseKey);

function formatDateBR(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

module.exports = async (req, res) => {
  try {
    const today = new Date();
    const targetDate = new Date();
    targetDate.setDate(today.getDate() + 7);
    const targetDateStr = targetDate.toISOString().split('T')[0];

    const { data: servicesData, error: servicesError } = await supabase
      .from('services')
      .select('*')
      .eq('date', targetDateStr);

    if (servicesError) throw servicesError;
    if (!servicesData || servicesData.length === 0) {
      return res.status(200).json({ success: true, message: `Nenhum culto encontrado para daqui a 7 dias (${targetDateStr})` });
    }

    const serviceIds = servicesData.map(s => s.id);

    const { data: schedData, error: schedError } = await supabase
      .from('schedule')
      .select('*')
      .in('service_id', serviceIds);

    if (schedError) throw schedError;
    if (!schedData || schedData.length === 0) {
      return res.status(200).json({ success: true, message: 'Nenhuma escala publicada para os cultos de 7 dias.' });
    }

    const serviceMap = new Map();
    servicesData.forEach(s => serviceMap.set(s.id, s));

    const scheduledMembersToNotify = [];

    schedData.forEach(sched => {
      const service = serviceMap.get(sched.service_id);
      if (!service) return;

      const roles = [
        sched.keyboard_member,
        sched.guitar_member,
        sched.bass_member,
        sched.drums_member,
        sched.vocal_members
      ];

      roles.forEach(memberStr => {
        if (!memberStr || memberStr === '-' || memberStr === 'CONVIDADO') return;
        const names = memberStr.split('/').map(n => n.trim().toUpperCase()).filter(Boolean);
        names.forEach(name => {
          scheduledMembersToNotify.push({
            memberName: name,
            service
          });
        });
      });
    });

    if (scheduledMembersToNotify.length === 0) {
      return res.status(200).json({ success: true, message: 'Nenhum integrante escalado encontrado para notificar.' });
    }

    const { data: subData, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*');

    if (subError) throw subError;
    if (!subData || subData.length === 0) {
      return res.status(200).json({ success: true, message: 'Nenhuma inscrição de push salva no banco.' });
    }

    let notificationsSent = 0;

    for (const item of scheduledMembersToNotify) {
      const matchingSubs = subData.filter(s => s.member_name.toUpperCase().trim() === item.memberName);

      for (const sub of matchingSubs) {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth
          }
        };

        const timeOnly = item.service.day_time.replace(/^[^\d]*/, '').trim();

        const payload = JSON.stringify({
          title: '🎵 Lembrete de Escala',
          body: `Você está escalado para:\n${item.service.title}\n📅 ${formatDateBR(item.service.date)} às ${timeOnly || item.service.day_time} — Igreja ${item.service.church}`,
          url: '/'
        });

        try {
          await webpush.sendNotification(pushSubscription, payload);
          notificationsSent++;
        } catch (err) {
          if (err.statusCode === 410 || err.statusCode === 404) {
            await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
          }
        }
      }
    }

    return res.status(200).json({
      success: true,
      targetDate: targetDateStr,
      notificationsSent,
      message: `Enviados ${notificationsSent} lembretes para cultos do dia ${formatDateBR(targetDateStr)}`
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Erro ao executar cron de lembretes' });
  }
};
