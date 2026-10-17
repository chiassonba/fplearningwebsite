/* Personal Spotify playback. OAuth PKCE uses no client secret. */
(() => {
  'use strict';
  const el = id => document.getElementById(`spotify-${id}`);
  const redirect = `${location.origin}${location.pathname}`;
  const key = 'fpl.spotify.session', pendingKey = 'fpl.spotify.pending';
  const scopes = 'streaming user-read-email user-read-private user-read-playback-state user-modify-playback-state';
  let session = null, state = null, updated = 0, timer, busy = false, refreshTask, player, deviceId, sdkTask, cooldown = 0;
  const message = value => { el('status').textContent = value; };
  const stored = (store, name) => { try { return JSON.parse(store.getItem(name)); } catch { return null; } };
  const saveSession = value => { session = value; if (value) sessionStorage.setItem(key, JSON.stringify(value)); else sessionStorage.removeItem(key); };
  const base64 = bytes => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const random = () => base64(crypto.getRandomValues(new Uint8Array(32)));
  const time = ms => { const s = Math.floor(Math.max(0, ms || 0) / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
  const position = () => Math.min(state?.item?.duration_ms || 0, (state?.progress_ms || 0) + (state?.is_playing ? Date.now() - updated : 0));
  function connected() {
    const yes = !!session;
    el('disconnect').hidden = !yes; el('here').disabled = !yes; el('load').disabled = !yes;
    el('setup').open = !el('client').value; el('connect').hidden = yes;
    if (!yes) { state = null; draw(); }
  }
  function draw() {
    const item = state?.item, allowed = state?.actions?.disallows || {};
    el('transport').disabled = !session || !item || state?.device?.is_restricted;
    el('seek').disabled = !item || !!allowed.seeking;
    el('seek').max = Math.max(1, item?.duration_ms || 0);
    if (document.activeElement !== el('seek')) el('seek').value = position();
    el('position').textContent = time(position()); el('duration').textContent = time(item?.duration_ms);
    el('toggle').textContent = state?.is_playing ? 'PAUSE' : 'PLAY';
    el('now').textContent = item ? `${item.name} / ${(item.artists || []).map(a => a.name).join(', ') || item.show?.name || 'Spotify'}` : 'NOT PLAYING';
    el('now').href = item?.external_urls?.spotify || 'https://open.spotify.com/';
    el('device').textContent = state?.device ? `ACTIVE DEVICE: ${state.device.name}` : 'Start Spotify on a device, or choose Play here.';
    const restrictions = { previous: 'skipping_prev', next: 'skipping_next', back: 'seeking', forward: 'seeking', toggle: state?.is_playing ? 'pausing' : 'resuming' };
    document.querySelectorAll('[data-spotify]').forEach(b => { b.disabled = !!allowed[restrictions[b.dataset.spotify]]; });
  }
  async function tokenRequest(params) {
    const response = await fetch('https://accounts.spotify.com/api/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(params) });
    if (!response.ok) throw new Error('Spotify sign-in expired or was rejected. Connect again and check the app redirect address.');
    return response.json();
  }
  async function accessToken() {
    if (!session) throw new Error('Connect Spotify first.');
    if (session.expires > Date.now() + 60000) return session.access;
    if (!refreshTask) refreshTask = (async () => {
      const before = session;
      try {
        const data = await tokenRequest({ grant_type: 'refresh_token', refresh_token: before.refresh, client_id: before.client });
        if (session !== before) throw new Error('Spotify disconnected.');
        saveSession({ ...before, access: data.access_token, refresh: data.refresh_token || before.refresh, expires: Date.now() + data.expires_in * 1000 });
        return session.access;
      } catch (error) { disconnect(); throw error; }
      finally { refreshTask = null; }
    })();
    return refreshTask;
  }
  async function api(path, method = 'GET', body) {
    if (Date.now() < cooldown) throw new Error('Spotify requested a short wait. Try again shortly.');
    const access = await accessToken();
    const response = await fetch(`https://api.spotify.com/v1/me/player${path}`, { method, headers: { Authorization: `Bearer ${access}`, ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
    if (response.status === 401) { disconnect(); throw new Error('Spotify sign-in expired. Connect again.'); }
    if (response.status === 403) { cooldown = Date.now() + 30000; throw new Error('Spotify denied playback. Check Premium, app access in Users Management, and playback permissions.'); }
    if (response.status === 404) throw new Error('No active Spotify device. Choose Play here, or start a song in Spotify first.');
    if (response.status === 429) { cooldown = Date.now() + Math.max(5, Number(response.headers.get('Retry-After')) || 30) * 1000; throw new Error('Spotify requested a short wait. Try again shortly.'); }
    if (!response.ok) throw new Error(`Spotify could not complete the request (${response.status}). Try again.`);
    return response.status === 204 ? null : response.json();
  }
  function visible() { return !document.hidden && !el('playback').hidden; }
  function schedule() {
    clearTimeout(timer);
    if (session && visible()) timer = setTimeout(poll, Math.max(5000, cooldown - Date.now()));
  }
  async function poll() {
    if (!session || !visible() || busy) return;
    busy = true;
    try {
      state = await api(''); updated = Date.now(); draw();
      message(state?.item ? 'Connected. Drag the position slider to jump within the song.' : 'Connected. Choose Play here, or start Spotify on another device.');
    } catch (error) { message(error.message); }
    finally { busy = false; schedule(); }
  }
  async function run(task) {
    if (busy) return;
    busy = true; clearTimeout(timer);
    try { await task(); }
    catch (error) { message(error.message); }
    finally { busy = false; schedule(); }
  }
  function disconnect() {
    clearTimeout(timer); player?.disconnect(); player = null; deviceId = null;
    saveSession(null); sessionStorage.removeItem(pendingKey); connected(); message('Disconnected from LCARS. You can also revoke access in your Spotify account.');
  }
  async function authorize() {
    const client = el('client').value.trim();
    if (!/^[a-f0-9]{32}$/i.test(client)) throw new Error('Enter the 32-character Client ID from your Spotify developer app Settings, not your username.');
    const verifier = random(), nonce = random();
    const challenge = base64(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))));
    localStorage.setItem('fpl.spotify.client', client);
    sessionStorage.setItem(pendingKey, JSON.stringify({ verifier, nonce, client, redirect, created: Date.now() }));
    const params = new URLSearchParams({ client_id: client, response_type: 'code', redirect_uri: redirect, scope: scopes, state: nonce, code_challenge_method: 'S256', code_challenge: challenge });
    location.assign(`https://accounts.spotify.com/authorize?${params}`);
  }
  async function callback() {
    const params = new URLSearchParams(location.search);
    if (!params.has('code') && !params.has('error')) return false;
    const pending = stored(sessionStorage, pendingKey);
    for (const name of ['code', 'state', 'error']) params.delete(name);
    const query = params.toString();
    const original = new URLSearchParams(location.search);
    history.replaceState(null, '', location.pathname + (query ? `?${query}` : '') + location.hash);
    sessionStorage.removeItem(pendingKey);
    if (!pending || pending.nonce !== original.get('state') || pending.redirect !== redirect || Date.now() - pending.created > 600000) throw new Error('Spotify sign-in could not be verified. Use Connect to try again.');
    if (original.has('error')) throw new Error('Spotify connection was cancelled. You can still use the embed.');
    const data = await tokenRequest({ grant_type: 'authorization_code', code: original.get('code'), redirect_uri: redirect, client_id: pending.client, code_verifier: pending.verifier });
    saveSession({ client: pending.client, access: data.access_token, refresh: data.refresh_token, expires: Date.now() + data.expires_in * 1000 });
    return true;
  }
  function sdk() {
    if (window.Spotify?.Player) return Promise.resolve();
    if (!sdkTask) sdkTask = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      const timeout = setTimeout(() => { script.remove(); sdkTask = null; reject(new Error('Spotify player did not load. Check browser blocking settings and try again.')); }, 20000);
      window.onSpotifyWebPlaybackSDKReady = () => { clearTimeout(timeout); resolve(); };
      script.src = 'https://sdk.scdn.co/spotify-player.js';
      script.onerror = () => { clearTimeout(timeout); sdkTask = null; script.remove(); reject(new Error('Spotify player is blocked. Check browser blocking settings.')); };
      document.head.append(script);
    });
    return sdkTask;
  }
  async function playHere() {
    if (!player) {
      message('Starting the full Spotify player...');
      await sdk();
      player = new Spotify.Player({ name: 'FP-LCARS', getOAuthToken: cb => { accessToken().then(cb).catch(error => message(error.message)); }, volume: 0.5 });
      player.addListener('not_ready', () => { deviceId = null; message('LCARS player went offline. Choose Play here to reconnect.'); });
      player.addListener('autoplay_failed', () => message('Click Play to allow audio in this browser.'));
      for (const name of ['initialization_error', 'authentication_error', 'account_error', 'playback_error']) player.addListener(name, () => message(name === 'account_error' ? 'Full playback requires Spotify Premium.' : 'Spotify player could not play. Check protected content and Spotify sign-in, or use another active Spotify device.'));
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('LCARS player is not ready. Check protected content permissions and try again.')), 20000);
        player.addListener('ready', data => { deviceId = data.device_id; clearTimeout(timeout); resolve(); });
        player.connect().then(ok => { if (!ok) { clearTimeout(timeout); reject(new Error('Spotify could not connect the LCARS player.')); } }).catch(error => { clearTimeout(timeout); reject(error); });
      }).catch(error => { player?.disconnect(); player = null; throw error; });
    }
    if (!deviceId) { player.disconnect(); player = null; return playHere(); }
    await player.activateElement();
    // Stop the preview before transferring the full player into LCARS.
    document.getElementById('screen-frame').removeAttribute('src');
    document.getElementById('screen-frame').hidden = true;
    await api('', 'PUT', { device_ids: [deviceId], play: false });
    state = null; draw(); message('FP-LCARS is ready. Click Play loaded link to start your selection.');
  }
  async function loadLink() {
    const url = new URL(el('link').value);
    const match = url.hostname === 'open.spotify.com' && url.pathname.match(/^\/(?:intl-[a-z-]+\/)?(?:embed\/)?(track|album|playlist|artist|episode|show)\/([A-Za-z0-9]{22})\/?$/);
    if (!match) throw new Error('Paste a Spotify content link above first.');
    const uri = `spotify:${match[1]}:${match[2]}`;
    const body = ['track', 'episode'].includes(match[1]) ? { uris: [uri] } : { context_uri: uri };
    if (match[1] === 'show') throw new Error('Choose a podcast episode link to start playback.');
    await api(`/play${deviceId ? `?device_id=${encodeURIComponent(deviceId)}` : ''}`, 'PUT', body);
    message('Playback requested.');
  }
  async function seek(ms) {
    if (!state?.item || state.actions?.disallows?.seeking) throw new Error('Seeking is not available for this item.');
    const value = Math.round(Math.max(0, Math.min(ms, state.item.duration_ms - 1)));
    await api(`/seek?position_ms=${value}`, 'PUT');
    state.progress_ms = value; updated = Date.now(); draw(); message(`Position: ${time(value)}`);
  }
  el('redirect').textContent = redirect;
  try { el('client').value = localStorage.getItem('fpl.spotify.client') || 'cbfcdfdb43c94507937d71d50ef1360e'; session = stored(sessionStorage, key); } catch { message('Browser storage is unavailable. Allow site storage to connect Spotify.'); }
  el('connect').addEventListener('click', () => run(authorize));
  el('disconnect').addEventListener('click', disconnect);
  el('here').addEventListener('click', () => run(playHere));
  el('load').addEventListener('click', () => run(loadLink));
  el('seek').addEventListener('input', () => { el('position').textContent = time(Number(el('seek').value)); });
  el('seek').addEventListener('change', () => run(() => seek(Number(el('seek').value))));
  document.querySelectorAll('[data-spotify]').forEach(button => button.addEventListener('click', () => run(async () => {
    const action = button.dataset.spotify;
    if (['back', 'forward'].includes(action)) return seek(position() + (action === 'back' ? -15000 : 15000));
    if (action === 'toggle') { await api(state?.is_playing ? '/pause' : '/play', 'PUT'); if (state) { state.progress_ms = position(); state.is_playing = !state.is_playing; updated = Date.now(); draw(); } }
    else await api(`/${action}`, 'POST');
    message('Playback updated.');
  })));
  const observer = new MutationObserver(() => { clearTimeout(timer); if (visible()) void poll(); });
  observer.observe(el('playback'), { attributes: true, attributeFilter: ['hidden'] });
  document.addEventListener('visibilitychange', () => { clearTimeout(timer); if (visible()) void poll(); });
  window.addEventListener('pagehide', () => { clearTimeout(timer); player?.disconnect(); });
  connected();
  callback().then(returned => {
    connected();
    if (returned) {
      document.getElementById('command-station').hidden = true; document.getElementById('embedded-screen').hidden = false;
      document.getElementById('spotify-form').hidden = false; el('playback').hidden = false;
      document.getElementById('screen-title').textContent = 'SUBSPACE MEDIA';
      document.getElementById('screen-external').href = 'https://open.spotify.com/';
      try { el('link').value = JSON.parse(localStorage.getItem('voyager.spotify-player')) || ''; } catch { /* An empty link is fine. */ }
      void poll();
    }
  }).catch(error => { connected(); el('playback').hidden = false; document.getElementById('command-station').hidden = true; document.getElementById('embedded-screen').hidden = false; message(error.message); });
})();
