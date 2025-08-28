// web/auth0_bridge.js

// === Config ===
const __auth0Cfg__ = {
  domain: 'dev-ohuspam6fnmh4tgt.us.auth0.com',
  clientId: '2H45P97qEyC9HfiKFj8FOvb8DnSOgFwY',
  audience: 'logger',              // Debe coincidir con el API Identifier de tu API en Auth0
  redirectUri: 'http://localhost:8080'
};

// Promesa global: se resuelve cuando el cliente queda listo
window.__auth0Ready = new Promise((resolve) => { window.__auth0ReadyResolve = resolve; });

// Helpers globales SIEMPRE definidos (stubs que esperan al cliente)
window.auth0Login = async () => {
  const c = window.auth0Client || await window.__auth0Ready;
  return c.loginWithRedirect();
};

window.auth0Refresh = async () => {
  const c = window.auth0Client || await window.__auth0Ready;
  const t = await c.getTokenSilently({
    authorizationParams: { audience: __auth0Cfg__.audience }
  });
  localStorage.setItem('flutter.access_token', t);
  return t; // Promise<string>
};

window.auth0Logout = () => {
  const c = window.auth0Client;
  if (!c) return;
  c.logout({ logoutParams: { returnTo: __auth0Cfg__.redirectUri } });
};

// Esperar a que el SDK exponga alguna factory válida
function waitForAuth0Sdk(maxMs = 10000) {
  return new Promise((resolve, reject) => {
    const t0 = Date.now();
    (function poll() {
      const hasGlobal = typeof window.createAuth0Client === 'function';
      const hasNs = window.auth0 && (
        typeof window.auth0.createAuth0Client === 'function' ||
        typeof window.auth0.Auth0Client === 'function'
      );
      if (hasGlobal || hasNs) return resolve();
      if (Date.now() - t0 > maxMs) return reject(new Error('Auth0 SDK not loaded'));
      setTimeout(poll, 30);
    })();
  });
}

// Crear cliente usando la factory disponible
async function createClient() {
  const commonCfg = {
    domain: __auth0Cfg__.domain,
    clientId: __auth0Cfg__.clientId,
    authorizationParams: { audience: __auth0Cfg__.audience, redirect_uri: __auth0Cfg__.redirectUri },
    cacheLocation: 'localstorage',
    useRefreshTokens: true
  };

  if (typeof window.createAuth0Client === 'function') {
    return window.createAuth0Client(commonCfg);
  }
  if (window.auth0 && typeof window.auth0.createAuth0Client === 'function') {
    return window.auth0.createAuth0Client(commonCfg);
  }
  if (window.auth0 && typeof window.auth0.Auth0Client === 'function') {
    return new window.auth0.Auth0Client(commonCfg);
  }
  throw new Error('No Auth0 factory found');
}

// Init inmediato (sin lógica en index)
(async () => {
  try {
    // 1) Esperar SDK
    await waitForAuth0Sdk();

    // 2) Crear cliente
    window.auth0Client = await createClient();

    // 3) Manejar redirect tras login
    if (location.search.includes('code=') && location.search.includes('state=')) {
      try {
        await window.auth0Client.handleRedirectCallback();
      } catch (e) {
        console.error('handleRedirectCallback error:', e);
      } finally {
        history.replaceState({}, document.title, location.pathname);
      }
    }

    // 4) Si ya hay sesión, guardar el access token para Flutter
    try {
      if (await window.auth0Client.isAuthenticated()) {
        const t = await window.auth0Client.getTokenSilently({
          authorizationParams: { audience: __auth0Cfg__.audience }
        });
        localStorage.setItem('flutter.access_token', t);
      }
    } catch (e) {
      console.warn('getTokenSilently inicial falló:', e);
    }

    // 5) Señalar que el cliente está listo (desbloquea helpers)
    window.__auth0ReadyResolve(window.auth0Client);
  } catch (err) {
    console.error('Auth0 init error:', err);
  }
})();
