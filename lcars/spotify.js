/* Personal Spotify playback. OAuth PKCE uses no client secret. */
(() => {
  'use strict';
  const el = id => document.getElementById(`spotify-${id}`);
  const redirect = `${location.origin}${location.pathname}`;
  const key = 'fpl.spotify.session', pendingKey = 'fpl.spotify.pending';
  const scopes = 'streaming user-read-email user-read-private user-read-playback-state user-modify-playback-state playlist-read-private playlist-read-collaborative';
  let session = null, state = null, updated = 0, timer, tick, busy = false, polling = false, revision = 0, refreshTask, player, deviceId, sdkTask, cooldown = 0;
  let devices=[], selectedDevice='', lastDeviceRefresh=0;
  let playlistKey='',playlistName='',playlistRows=[],playlistTotal=0,playlistLoading=false,playlistError='',playlistDenied=false,playlistVersion=0;
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
    if (!yes) state = null;
    el('refresh-devices').disabled=!yes;
    el('devices').disabled=!yes;
    draw();renderDevices();
    message(yes?'LCARS controls are connected. Open Spotify and select the app you want to control.':'Connect LCARS controls to control your app. Signing into the embedded player alone does not authorize these controls.');
    syncTick();
  }
  function draw() {
    const item = state?.item, allowed = state?.actions?.disallows || {};
    el('transport').disabled = !session || !state?.device || state.device.is_restricted;
    el('toggle').textContent = state?.is_playing ? 'PAUSE' : 'PLAY';
    el('now').textContent = item ? `${item.name} / ${(item.artists || []).map(a => a.name).join(', ') || item.show?.name || 'Spotify'}` : 'NOT PLAYING';
    el('now').href = item?.external_urls?.spotify || 'https://open.spotify.com/';
    el('device').textContent = state?.device ? `CONTROLLING: ${state.device.name}` : 'Open the Spotify app, refresh devices, then choose Control app.';
    drawMini();
    drawVolume();
    syncPlaylistView();
  }
  async function playlistRead(path){
    const access=await accessToken();
    const response=await fetch(`https://api.spotify.com/v1${path}`,{headers:{Authorization:`Bearer ${access}`}});
    if(response.status===401){disconnect();throw new Error('Reconnect LCARS controls to read your playlist.');}
    if(response.status===403){const error=new Error('Spotify has not shared this playlist with LCARS. The current track and app controls still work.');error.denied=true;throw error;}
    if(response.status===429){cooldown=Date.now()+Math.max(5,Number(response.headers.get('Retry-After'))||30)*1000;throw new Error('Spotify requested a short wait before loading this playlist.');}
    if(!response.ok)throw new Error('Spotify could not provide this playlist. You can still open it in Spotify.');
    return response.json();
  }
  function renderPlaylist(){
    el('playlist-title').textContent=playlistName||'APP PLAYBACK';
    const current=state?.item?.uri||`spotify:track:${state?.item?.id||''}`;
    const scroll=el('playlist-items').scrollTop;
    el('playlist-items').replaceChildren();
    playlistRows.forEach((row,index)=>{
      const track=row?.item||row?.track,li=document.createElement('li');
      li.value=index+1;
      const name=document.createElement('span');name.textContent=track?.name||'Unavailable track';
      const artist=document.createElement('small');artist.textContent=(track?.artists||[]).map(a=>a.name).join(', ')||track?.show?.name||'';
      li.append(name,artist);
      if(track&&(track.uri===current||track.id&&track.id===state?.item?.id))li.setAttribute('aria-current','true');
      el('playlist-items').append(li);
    });
    el('playlist-items').scrollTop=scroll;
    el('playlist-status').textContent=playlistLoading?'Loading playlist...':playlistError||(!playlistKey?'Spotify is not reporting a playlist for this track.':`${playlistRows.length} of ${playlistTotal} tracks`);
    el('playlist-more').hidden=playlistLoading||!!playlistError||playlistRows.length>=playlistTotal;
    el('playlist-access').hidden=!playlistDenied||(session?.scope||'').split(' ').includes('playlist-read-private');
  }
  function syncPlaylistView(){
    el('app-view').hidden=!session||!state?.item;
    if(!state?.item){if(playlistKey){playlistVersion++;playlistKey='';playlistRows=[];playlistName='';playlistTotal=0;playlistLoading=false;playlistError='';playlistDenied=false;}return;}
    el('app-track').textContent=`${state.is_playing?'PLAYING':'PAUSED'} IN ${state.device?.name||'SPOTIFY'}: ${state.item.name} / ${(state.item.artists||[]).map(a=>a.name).join(', ')||state.item.show?.name||''}`;
    const match=state.context?.uri?.match(/^spotify:playlist:([A-Za-z0-9]{22})$/),key=match?.[1]||'';
    el('playlist-open').href=key?`https://open.spotify.com/playlist/${key}`:state.item.external_urls?.spotify||`https://open.spotify.com/track/${state.item.id||''}`;
    if(el('panel').classList.contains('is-background'))return;
    if(key!==playlistKey){playlistVersion++;playlistKey=key;playlistRows=[];playlistName='';playlistTotal=0;playlistError='';playlistDenied=false;playlistLoading=false;if(key)void loadPlaylist(true);}
    renderPlaylist();
  }
  async function loadPlaylist(first=false){
    if(!playlistKey||playlistLoading)return;
    const key=playlistKey,version=playlistVersion;
    playlistLoading=true;renderPlaylist();
    try{
      const paths=[playlistRead(`/playlists/${key}/items?limit=50&offset=${first?0:playlistRows.length}`)];
      if(first)paths.push(playlistRead(`/playlists/${key}`));
      const results=await Promise.allSettled(paths);
      if(version!==playlistVersion||!session)return;
      if(results[1]?.status==='fulfilled')playlistName=results[1].value.name||'PLAYLIST';
      const rows=results[0];if(rows.status==='rejected')throw rows.reason;
      playlistRows=first?(rows.value.items||[]):playlistRows.concat(rows.value.items||[]);playlistTotal=rows.value.total??playlistRows.length;
      playlistError='';playlistDenied=false;
    }catch(error){if(version===playlistVersion){playlistError=error.message;playlistDenied=!!error.denied;}}
    finally{if(version===playlistVersion){playlistLoading=false;renderPlaylist();}}
  }
  function drawMini() {
    const item=state?.item, allowed=state?.actions?.disallows||{};
    const title=item ? `${item.name} / ${(item.artists||[]).map(a=>a.name).join(', ')||item.show?.name||'Spotify'}` : 'SUBSPACE MEDIA';
    const remaining=item ? `${time(Math.max(0,item.duration_ms-position()))} LEFT${state.is_playing?'':' / PAUSED'}` : session?'Select your Spotify app':'Connect LCARS controls';
    document.querySelectorAll('[data-spotify-track]').forEach(node=>{node.textContent=title;node.title=title;});
    document.querySelectorAll('[data-spotify-remaining]').forEach(node=>{node.textContent=remaining;});
    document.querySelectorAll('[data-spotify-connection]').forEach(node=>{node.textContent=session?'LCARS controls: connected':'LCARS controls: not connected';});
    const restrictions={previous:'skipping_prev',next:'skipping_next',back:'seeking',forward:'seeking',toggle:state?.is_playing?'pausing':'resuming',stop:'pausing',shuffle:'toggling_shuffle'};
    document.querySelectorAll('[data-spotify]').forEach(button=>{
      const action=button.dataset.spotify;
      button.disabled=!session||!state?.device||!!state.device.is_restricted||(!item&&action!=='toggle')||!!allowed[restrictions[action]];
      if(action==='toggle'){button.textContent=state?.is_playing?'PAUSE':'PLAY';button.setAttribute('aria-label',state?.is_playing?'Pause playback':'Play playback');}
      if(action==='shuffle'){button.textContent=`SHUFFLE: ${state?.shuffle_state?'ON':'OFF'}`;button.setAttribute('aria-pressed',String(!!state?.shuffle_state));}
      if(action==='repeat'){
        const mode=state?.repeat_state||'off';
        button.textContent=`REPEAT: ${{off:'OFF',context:'ALL',track:'ONE'}[mode]||'OFF'}`;
        button.setAttribute('aria-pressed',String(mode!=='off'));button.title='Cycle repeat: Off, All, One';
        button.disabled=button.disabled||repeatModes().length<2;
      }
    });
  }
  function repeatModes(){
    const blocked=state?.actions?.disallows||{};
    return ['off',...(!blocked.toggling_repeat_context?['context']:[]),...(!blocked.toggling_repeat_track?['track']:[])];
  }
  function syncTick() {
    clearInterval(tick);
    if(session&&visible())tick=setInterval(drawMini,1000);
  }
  function drawVolume() {
    const device = state?.device;
    el('volume').disabled = !session || !device || device.is_restricted || device.supports_volume !== true;
    if (document.activeElement !== el('volume') && Number.isFinite(device?.volume_percent)) el('volume').value = device.volume_percent;
    el('volume-value').textContent = `${el('volume').value}%`;
    el('volume-hint').textContent = device?.supports_volume === false ? 'This device uses its own volume controls.' : device ? `Volume for ${device.name}.` : 'Connect Spotify and start playback to adjust volume.';
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
    const url=new URL(`https://api.spotify.com/v1/me/player${path}`);
    if(method!=='GET'&&url.pathname!=='/v1/me/player'&&!url.searchParams.has('device_id')){
      const target=selectedDevice||state?.device?.id;if(target)url.searchParams.set('device_id',target);
    }
    const response = await fetch(url.href, { method, headers: { Authorization: `Bearer ${access}`, ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
    if (response.status === 401) { disconnect(); throw new Error('Spotify sign-in expired. Connect again.'); }
    if (response.status === 403) { cooldown = Date.now() + 30000; throw new Error('Spotify denied playback. Check Premium, app access in Users Management, and playback permissions.'); }
    if (response.status === 404) {lastDeviceRefresh=0;throw new Error('Spotify app is unavailable. Open it, refresh devices and select Control app.');}
    if (response.status === 429) { cooldown = Date.now() + Math.max(5, Number(response.headers.get('Retry-After')) || 30) * 1000; throw new Error('Spotify requested a short wait. Try again shortly.'); }
    if (!response.ok) throw new Error(`Spotify could not complete the request (${response.status}). Try again.`);
    return response.status === 204 ? null : response.json();
  }
  function renderDevices(){
    const previous=el('devices').value||selectedDevice;
    el('devices').replaceChildren(new Option(devices.length?'Choose Spotify app / device':'No devices found. Open Spotify and refresh.',''));
    for(const device of devices){const option=new Option(`${device.name}${device.is_active?' / ACTIVE':''}${device.is_restricted?' / UNAVAILABLE':''}`,device.id);option.disabled=!!device.is_restricted;el('devices').append(option);}
    if(devices.some(d=>d.id===previous))el('devices').value=previous;
    else el('devices').value=devices.find(d=>d.is_active&&!d.is_restricted)?.id||devices.find(d=>d.type==='Computer'&&!d.is_restricted)?.id||'';
    el('use-device').disabled=!session||!devices.some(d=>d.id===el('devices').value&&!d.is_restricted);
  }
  async function refreshDevices(){
    const before=session,result=await api('/devices');if(session!==before)return;
    devices=(result?.devices||[]).filter(d=>d?.id);lastDeviceRefresh=Date.now();renderDevices();
    el('device-help').textContent=devices.length?'Select your Spotify app and click Control app.':'No Spotify apps found. Open the app with the same account, start a song once, then refresh devices.';
  }
  async function useDevice(){
    const device=devices.find(d=>d.id===el('devices').value&&!d.is_restricted);
    if(!device)throw new Error('Open Spotify and choose an available app first.');
    await api('','PUT',{device_ids:[device.id],play:false});
    selectedDevice=device.id;
    try{localStorage.setItem('fpl.spotify.device',JSON.stringify({id:device.id,name:device.name}));}catch{/* The selection still works for this page. */}
    if(player&&deviceId!==selectedDevice){player.disconnect();player=null;deviceId=null;}
    el('frame').removeAttribute('src');el('frame').hidden=true;el('panel').dataset.fullPlayer='true';
    state={device,item:null,progress_ms:0,is_playing:false};updated=Date.now();draw();
    message(`Controlling ${device.name}. Press Play to resume its music, or Play loaded link to send your selection to the app.`);
    el('device-help').textContent=`Playback is in ${device.name}. Use the sidebar to control it.`;
  }
  function visible() { return !document.hidden && !el('panel').hidden; }
  function schedule(delay=5000) {
    clearTimeout(timer);
    if (session && visible()) timer = setTimeout(poll, Math.max(delay, cooldown - Date.now()));
    syncTick();
  }
  async function poll() {
    if (!session || !visible() || busy || polling) return;
    polling = true;const before=session, version=revision;
    try {
      if(Date.now()-lastDeviceRefresh>30000)await refreshDevices();
      const next=await api('');if(session!==before||version!==revision)return;
      state = selectedDevice&&next?.device?.id!==selectedDevice ? (devices.some(d=>d.id===selectedDevice&&!d.is_restricted)?{device:devices.find(d=>d.id===selectedDevice),item:null,is_playing:false,progress_ms:0}:null) : next;
      updated = Date.now(); draw();
      message(state?.item ? `LCARS is controlling ${state.device?.name||'Spotify'}. Playback continues while you navigate.` : 'LCARS controls are connected. Open Spotify, refresh devices and choose Control app. The embedded player has its own playback.');
    } catch (error) { message(error.message); }
    finally { polling = false; schedule(); }
  }
  async function run(task) {
    if (busy) { message('Spotify is handling another request. Try again in a moment.'); return; }
    busy = true; revision++; clearTimeout(timer);
    try { await task(); }
    catch (error) { message(error.message); }
    finally { busy = false; schedule(400); }
  }
  function disconnect() {
    clearTimeout(timer);clearInterval(tick);revision++; player?.disconnect(); player = null; deviceId = null;
    delete el('panel').dataset.fullPlayer;
    devices=[];lastDeviceRefresh=0;saveSession(null); sessionStorage.removeItem(pendingKey); connected(); message('Disconnected from LCARS. You can also revoke access in your Spotify account.');
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
    saveSession({ client: pending.client, access: data.access_token, refresh: data.refresh_token, scope:data.scope||'', expires: Date.now() + data.expires_in * 1000 });
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
      player.addListener('player_state_changed', data => {
        const track=data?.track_window?.current_track;if(!session||!track||(selectedDevice&&selectedDevice!==deviceId))return;
        revision++;updated=Date.now();
        state={context:data.context,item:{...track,duration_ms:data.duration||track.duration_ms,external_urls:{spotify:`https://open.spotify.com/track/${track.id}`}},progress_ms:data.position,is_playing:!data.paused,shuffle_state:typeof data.shuffle==='boolean'?data.shuffle:state?.shuffle_state||false,repeat_state:['off','context','track'][data.repeat_mode]||state?.repeat_state||'off',device:{id:deviceId,name:'FP-LCARS',supports_volume:true,volume_percent:state?.device?.id===deviceId?state.device.volume_percent:50},actions:{disallows:data.disallows||{}}};
        draw();
      });
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
    el('frame').removeAttribute('src');el('frame').hidden = true;
    await api('', 'PUT', { device_ids: [deviceId], play: false });
    selectedDevice=deviceId;
    try{localStorage.removeItem('fpl.spotify.device');}catch{/* Optional preference. */}
    el('panel').dataset.fullPlayer='true';
    state = null; draw(); message('FP-LCARS is ready. Click Play loaded link to start your selection.');
  }
  async function loadLink() {
    const url = new URL(el('link').value);
    const match = url.hostname === 'open.spotify.com' && url.pathname.match(/^\/(?:intl-[a-z-]+\/)?(?:embed\/)?(track|album|playlist|artist|episode|show)\/([A-Za-z0-9]{22})\/?$/);
    if (!match) throw new Error('Paste a Spotify content link above first.');
    const uri = `spotify:${match[1]}:${match[2]}`;
    const body = ['track', 'episode'].includes(match[1]) ? { uris: [uri] } : { context_uri: uri };
    if (match[1] === 'show') throw new Error('Choose a podcast episode link to start playback.');
    await api('/play', 'PUT', body);
    message('Playback requested.');
  }
  async function seek(ms) {
    if (!state?.item || state.actions?.disallows?.seeking) throw new Error('Seeking is not available for this item.');
    const value = Math.round(Math.max(0, Math.min(ms, state.item.duration_ms - 1)));
    await api(`/seek?position_ms=${value}`, 'PUT');
    state.progress_ms = value; updated = Date.now(); draw(); message(`Position: ${time(value)}`);
  }
  el('redirect').textContent = redirect;
  try { el('client').value = localStorage.getItem('fpl.spotify.client') || 'cbfcdfdb43c94507937d71d50ef1360e'; session = stored(sessionStorage, key);selectedDevice=stored(localStorage,'fpl.spotify.device')?.id||'';if(selectedDevice)el('panel').dataset.fullPlayer='true'; } catch { message('Browser storage is unavailable. Allow site storage to connect Spotify.'); }
  el('connect').addEventListener('click', () => run(authorize));
  el('disconnect').addEventListener('click', disconnect);
  el('here').addEventListener('click', () => run(playHere));
  el('load').addEventListener('click', () => run(loadLink));
  el('playlist-more').addEventListener('click',()=>{void loadPlaylist();});
  el('playlist-access').addEventListener('click',()=>run(authorize));
  el('refresh-devices').addEventListener('click',()=>run(refreshDevices));
  el('devices').addEventListener('change',()=>{el('use-device').disabled=!session||!devices.some(d=>d.id===el('devices').value&&!d.is_restricted);});
  el('use-device').addEventListener('click',()=>run(useDevice));
  el('volume').addEventListener('input', () => { el('volume-value').textContent = `${el('volume').value}%`; });
  el('volume').addEventListener('change', () => run(async () => {
    const device = state?.device;
    if (!device || device.is_restricted || device.supports_volume !== true) throw new Error('Volume is unavailable on this device. Use its own volume controls.');
    const value = Math.round(Math.max(0, Math.min(100, Number(el('volume').value))));
    if (player && deviceId && device.id === deviceId) await player.setVolume(value / 100);
    else await api(`/volume?volume_percent=${value}${device.id ? `&device_id=${encodeURIComponent(device.id)}` : ''}`, 'PUT');
    device.volume_percent = value; drawVolume(); message(`Volume: ${value}%`);
  }));
  document.addEventListener('click', event => {
    const button=event.target.closest('button[data-spotify]');if(!button||button.disabled)return;
    void run(async () => {
    const action = button.dataset.spotify;
    if(action==='shuffle'){
      const enabled=!state.shuffle_state;await api(`/shuffle?state=${enabled}`,'PUT');state.shuffle_state=enabled;drawMini();message(`Shuffle ${enabled?'on':'off'}.`);return;
    }
    if(action==='repeat'){
      const modes=repeatModes(),next=modes[(modes.indexOf(state.repeat_state||'off')+1)%modes.length];
      await api(`/repeat?state=${next}`,'PUT');state.repeat_state=next;drawMini();message(`Repeat: ${{off:'off',context:'all',track:'one'}[next]}.`);return;
    }
    if (['back', 'forward'].includes(action)) return seek(position() + (action === 'back' ? -15000 : 15000));
    if(action==='stop'){
      await api('/pause','PUT');
      if(state){state.progress_ms=position();state.is_playing=false;updated=Date.now();draw();if(!state.actions?.disallows?.seeking)await seek(0);}
      message('Playback stopped.');return;
    }
    if (action === 'toggle') { await api(state?.is_playing ? '/pause' : '/play', 'PUT'); if (state) { state.progress_ms = position(); state.is_playing = !state.is_playing; updated = Date.now(); draw(); } }
    else await api(`/${action}`, 'POST');
    message('Playback updated.');
    });
  });
  const viewChanged=()=>{clearTimeout(timer);syncTick();draw();if(visible())void poll();};
  const observer = new MutationObserver(viewChanged);
  observer.observe(el('panel'), { attributes: true, attributeFilter: ['hidden'] });
  document.addEventListener('spotify-view-change',viewChanged);
  document.addEventListener('spotify-links-rendered',drawMini);
  document.addEventListener('visibilitychange',viewChanged);
  window.addEventListener('pagehide', () => { clearTimeout(timer);clearInterval(tick); player?.disconnect(); });
  connected();
  callback().then(returned => {
    connected();
    if (returned) {
      try { el('link').value = JSON.parse(localStorage.getItem('voyager.spotify-player')) || ''; } catch { /* An empty link is fine. */ }
      openSpotify();
      void poll();
    }
  }).catch(error => { connected();openSpotify();message(error.message); });
})();
