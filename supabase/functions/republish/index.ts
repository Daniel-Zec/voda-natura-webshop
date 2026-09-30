// Starts the GitHub Actions "Deploy to GitHub Pages" workflow, so admin changes
// (prices, stock, texts) appear on the static shop. Only a signed-in admin with the
// second login step (aal2) may call it.
//
// Setup (once): Supabase → Edge Functions → Secrets:
//   GITHUB_TOKEN = fine-grained token for daniel-zec/voda-natura-webshop with "Actions: read and write"
//   GITHUB_REPO  = daniel-zec/voda-natura-webshop   (optional, this is the default)
//   GITHUB_WORKFLOW = deploy.yml                     (optional, this is the default)
import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method' }, 405);

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });
  const { data: status, error } = await supabase.rpc('admin_status');
  if (error || !status?.listed || status?.aal !== 'aal2') return json({ error: 'not allowed' }, 403);

  const token = Deno.env.get('GITHUB_TOKEN');
  if (!token) return json({ error: 'not_configured' }, 501);
  const repo = Deno.env.get('GITHUB_REPO') ?? 'daniel-zec/voda-natura-webshop';
  const workflow = Deno.env.get('GITHUB_WORKFLOW') ?? 'deploy.yml';

  const res = await fetch(`https://api.github.com/repos/${repo}/actions/workflows/${workflow}/dispatches`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'vodanatura-admin',
    },
    body: JSON.stringify({ ref: 'main' }),
  });
  if (!res.ok) return json({ error: 'github', status: res.status, detail: await res.text() }, 502);
  return json({ ok: true, startedAt: new Date().toISOString() });
});
