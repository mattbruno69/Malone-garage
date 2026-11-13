// Cloudflare Worker: set secrets with Wrangler, never publish credentials in GitHub Pages.
// DVLA_KEY; optional DVSA_KEY, DVSA_CLIENT_ID, DVSA_CLIENT_SECRET, DVSA_SCOPE, DVSA_TOKEN_URL
let cachedToken = null, tokenExpires = 0;
export default {async fetch(request, env) {
  const origin = request.headers.get('Origin') || '';
  // Restrict to your GitHub Pages domain by setting ALLOWED_ORIGIN (e.g. https://username.github.io).
  const allowed = env.ALLOWED_ORIGIN || '';
  const headers = {'Content-Type':'application/json','Cache-Control':'no-store','Access-Control-Allow-Origin':allowed||'null','Vary':'Origin'};
  if(request.method==='OPTIONS') return new Response(null,{status:204,headers:{...headers,'Access-Control-Allow-Methods':'GET, OPTIONS','Access-Control-Allow-Headers':'Content-Type'}});
  if(!allowed || origin!==allowed) return new Response(JSON.stringify({error:'Origin not authorised; configure ALLOWED_ORIGIN'}),{status:403,headers});
  const url = new URL(request.url);
  if(request.method!=='GET'||url.pathname!=='/lookup')return new Response(JSON.stringify({error:'Not found'}),{status:404,headers});
  const reg=(url.searchParams.get('registration')||'').replace(/[^A-Za-z0-9]/g,'').toUpperCase();
  if(!/^[A-Z0-9]{2,8}$/.test(reg))return new Response(JSON.stringify({error:'Invalid registration'}),{status:400,headers});
  const result={dvla:null,dvsa:null,errors:[]};
  try {if(!env.DVLA_KEY)throw Error('DVLA_KEY not configured');const r=await fetch('https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles',{method:'POST',headers:{'x-api-key':env.DVLA_KEY,'Content-Type':'application/json'},body:JSON.stringify({registrationNumber:reg})});if(!r.ok)throw Error('DVLA returned '+r.status);result.dvla=await r.json()}catch(e){result.errors.push('DVLA: '+e.message)}
  if(env.DVSA_KEY&&env.DVSA_CLIENT_ID&&env.DVSA_CLIENT_SECRET&&env.DVSA_SCOPE&&env.DVSA_TOKEN_URL){try{
    if(!cachedToken||Date.now()>tokenExpires){const body=new URLSearchParams({grant_type:'client_credentials',client_id:env.DVSA_CLIENT_ID,client_secret:env.DVSA_CLIENT_SECRET,scope:env.DVSA_SCOPE});const r=await fetch(env.DVSA_TOKEN_URL,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body});if(!r.ok)throw Error('OAuth token '+r.status);const j=await r.json();cachedToken=j.access_token;tokenExpires=Date.now()+(Math.max(60,(j.expires_in||3600)-120)*1000)}
    const r=await fetch('https://history.mot.api.gov.uk/v1/trade/vehicles/registration/'+encodeURIComponent(reg),{headers:{Authorization:'Bearer '+cachedToken,'X-API-Key':env.DVSA_KEY,'Accept':'application/json'}});if(!r.ok)throw Error('DVSA returned '+r.status);result.dvsa=await r.json();
  }catch(e){result.errors.push('DVSA: '+e.message)}}
  return new Response(JSON.stringify(result),{status:result.dvla||result.dvsa?200:502,headers});
}};
