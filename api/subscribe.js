const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://seu-projeto.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { member_name, subscription } = req.body || {};

    if (!member_name || !subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({ error: 'Payload incompleto. member_name e subscription são obrigatórios.' });
    }

    const cleanName = member_name.toUpperCase().trim();
    const endpoint = subscription.endpoint;
    const p256dh = subscription.keys.p256dh;
    const auth = subscription.keys.auth;

    const { data, error } = await supabase
      .from('push_subscriptions')
      .upsert({
        member_name: cleanName,
        endpoint,
        p256dh,
        auth,
        created_at: new Date().toISOString()
      }, { onConflict: 'endpoint' });

    if (error) throw error;

    return res.status(200).json({ success: true, message: 'Inscrição de notificação salva com sucesso!' });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Erro interno ao salvar inscrição de push' });
  }
};
