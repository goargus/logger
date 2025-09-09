const __auth0Cfg__ = {
  domain: 'dev-ohuspam6fnmh4tgt.us.auth0.com',
  clientId: '2H45P97qEyC9HfiKFj8FOvb8DnSOgFwY',
  audience: 'logger',
  redirectUri: window.location.origin,
};

window.__auth0Ready = new Promise((resolve) => { window.__auth0ReadyResolve = resolve; });
window.auth0Ready = function () { return window.__auth0Ready; };

function loadScriptOnce(url, globalName) {
  return new Promise((resolve, reject) => {
    if (globalName && typeof window[globalName] !== 'undefined') return resolve(window[globalName]);

    const existing = Array.from(document.getElementsByTagName('script')).find(s => s.src && s.src.indexOf(url) !== -1);
    if (existing) {
      existing.addEventListener('load', () => {
        if (!globalName || typeof window[globalName] !== 'undefined') return resolve(window[globalName] || true);
        const start = Date.now();
        const id = setInterval(() => {
          if (typeof window[globalName] !== 'undefined' || Date.now() - start > 5000) {
            clearInterval(id);
            return (typeof window[globalName] !== 'undefined')
              ? resolve(window[globalName])
              : reject(new Error(`Global ${globalName} not found after load`));
          }
        }, 50);
      });
      existing.addEventListener('error', (e) => reject(e));
    } else {
      const s = document.createElement('script');
      s.async = true; s.defer = true; s.src = url;
      s.onload = () => {
        if (!globalName || typeof window[globalName] !== 'undefined') return resolve(window[globalName] || true);
        const start = Date.now();
        const id = setInterval(() => {
          if (typeof window[globalName] !== 'undefined' || Date.now() - start > 5000) {
            clearInterval(id);
            return (typeof window[globalName] !== 'undefined')
              ? resolve(window[globalName])
              : reject(new Error(`Global ${globalName} not found after load`));
          }
        }, 50);
      };
      s.onerror = (e) => reject(e);
      document.head.appendChild(s);
    }
  });
}

function decodeJwtNoVerify(t) {
  try {
    const p = t.split('.')[1];
    const s = atob(p.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decodeURIComponent(escape(s)));
  } catch { return null; }
}

(function () {
  let client = null;

  async function init() {
    const CDN_URL = 'https://cdn.auth0.com/js/auth0-spa-js/2.1/auth0-spa-js.production.js';
    await loadScriptOnce(CDN_URL, 'auth0');

    const createClient =
      (window.auth0 && window.auth0.createAuth0Client) ||
      window.createAuth0Client;

    if (typeof createClient !== 'function') {
      throw new Error('Auth0 SPA SDK not available (neither v2 nor v1).');
    }

    client = await createClient({
      domain: __auth0Cfg__.domain,
      clientId: __auth0Cfg__.clientId,
      authorizationParams: {
        audience: __auth0Cfg__.audience,
        redirect_uri: __auth0Cfg__.redirectUri,
      },
      cacheLocation: 'localstorage',
      useRefreshTokens: true,
    });

    const qs = new URLSearchParams(window.location.search);
    if (qs.has('code') && qs.has('state')) {
      try {
        await client.handleRedirectCallback();
        const url = new URL(window.location.href);
        url.search = '';
        window.history.replaceState({}, document.title, url.toString());
      } catch (err) {
        console.error('[Auth0Bridge] handleRedirectCallback error:', err);
      }
    }

    try {
      const res = await client.getTokenSilently({
        authorizationParams: { audience: __auth0Cfg__.audience },
        detailedResponse: true,
      });
      if (res && res.access_token) {
        const payload = decodeJwtNoVerify(res.access_token) || {};
        console.debug('[Auth0Bridge] access_token aud:', payload.aud, 'iss:', payload.iss, 'scope:', payload.scope);
      }
    } catch (_) {}

    window.auth0Client = client;
    if (typeof window.__auth0ReadyResolve === 'function') {
      window.__auth0ReadyResolve(client);
      window.__auth0ReadyResolve = null;
    }
  }

  window.auth0Login = async () => {
    const c = window.auth0Client || (await window.auth0Ready());
    return c.loginWithRedirect();
  };

  window.auth0Refresh = async () => {
    const c = window.auth0Client || (await window.auth0Ready());
    const res = await c.getTokenSilently({
      authorizationParams: { audience: __auth0Cfg__.audience },
      detailedResponse: true,
    });
    const token = res && res.access_token ? res.access_token : (typeof res === 'string' ? res : null);

    const payload = token ? decodeJwtNoVerify(token) : null;
    if (payload) {
      console.debug('[Auth0Bridge] (refresh) aud:', payload.aud, 'iss:', payload.iss, 'scope:', payload.scope);
    } else {
      console.warn('[Auth0Bridge] (refresh) no access_token returned');
    }
    return token;
  };

  window.auth0Logout = async () => {
    const c = window.auth0Client || (await window.auth0Ready());
    return c.logout({ logoutParams: { returnTo: __auth0Cfg__.redirectUri } });
  };

  init().catch((e) => {
    console.error('[Auth0Bridge] init failed:', e);
    window.auth0Client = client;
    if (typeof window.__auth0ReadyResolve === 'function') {
      window.__auth0ReadyResolve(client);
      window.__auth0ReadyResolve = null;
    }
  });
})();
