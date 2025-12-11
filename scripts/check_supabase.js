const fs = require('fs');
const path = require('path');
const fetch = global.fetch || require('node-fetch');

function loadEnv(envPath) {
  const content = fs.readFileSync(envPath, 'utf8');
  const lines = content.split(/\r?\n/);
  const env = {};
  for (const line of lines) {
    const m = line.match(/^\s*([^#][^=\s]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2];
  }
  return env;
}

(async function main(){
  try {
    const envPath = path.resolve(__dirname, '..', '.env');
    if (!fs.existsSync(envPath)) {
      console.error('.env not found at', envPath);
      process.exit(1);
    }
    const env = loadEnv(envPath);
    const url = env.EXPO_PUBLIC_SUPABASE_URL;
    const key = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      console.error('Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY in .env');
      process.exit(1);
    }

    console.log('Using Supabase URL:', url);

    async function checkTable(table) {
      const endpoint = `${url.replace(/\/+$/,'')}/rest/v1/${table}?select=id&limit=1`;
      console.log('\nChecking table:', table);
      try {
        const res = await fetch(endpoint, { method: 'GET', headers: { apikey: key, Authorization: `Bearer ${key}` } });
        console.log('HTTP', res.status, res.statusText);
        const text = await res.text();
        let parsed = text;
        try { parsed = JSON.parse(text); } catch {};
        console.log('Body:', parsed);
      } catch (err) {
        console.error('Request failed:', err.message || err);
      }
    }

    // Check health/root
    try {
      const healthUrl = `${url.replace(/\/+$/,'')}/rest/v1/`;
      console.log('\nChecking REST root:', healthUrl);
      const r = await fetch(healthUrl, { method: 'HEAD', headers: { apikey: key } });
      console.log('Root HEAD status', r.status);
    } catch (err) {
      console.error('Root check failed:', err.message || err);
    }

    await checkTable('profiles');
    await checkTable('water_intake');

    console.log('\nDone.');
  } catch (err) {
    console.error('Fatal error:', err);
    process.exit(2);
  }
})();
