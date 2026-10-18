'use strict';
const $ = id => document.getElementById(id);
const LINK_PALETTE = Object.freeze({
  peach:{label:'Peach',value:'var(--peach)'},
  blue:{label:'Blue',value:'var(--blue)'},
  silver:{label:'Silver',value:'var(--silver)'},
  earth:{label:'Earth',value:'var(--earth)'},
  gold:{label:'Gold',value:'var(--gold)'},
  frost:{label:'Frost',value:'var(--frost)'},
  pewter:{label:'Pewter',value:'var(--pewter)'},
  sky:{label:'Sky',value:'var(--sky)'},
  science:{label:'Science blue',value:'var(--science)'}
});
const DEFAULT_LINK_COLOURS = ['peach','blue','silver','earth'];
function linkColour(link,index){
  return Object.prototype.hasOwnProperty.call(LINK_PALETTE,link.color)?link.color:DEFAULT_LINK_COLOURS[index%DEFAULT_LINK_COLOURS.length];
}
const defaults = [
  {name:'COMMUNICATIONS',url:'https://mail.google.com/'},
  {name:'DATA ARCHIVES',url:'http://localhost:8502/',mode:'screen'},
  {name:'ASTROMETRICS',url:'https://www.google.com/maps'},
  {name:'SUBSPACE MEDIA',url:'https://spotify.com/'},
  {name:'FPLearning Interlink',url:'https://fplearning.ca/'}
];
function read(key,fallback){try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}}
function write(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{$('storage-status').textContent='STORAGE UNAVAILABLE';return false;}}
// This preference belongs only to the homepage, not the embedded DataHub.
function homepageTheme(){return read('lcars.homepage-theme','voyager')==='picard'?'picard':'voyager';}
function applyHomepageTheme(){
  const theme=homepageTheme();document.documentElement.dataset.lcarsTheme=theme;
  $('homepage-theme').value=theme;
  $('palette-reference').href=`https://www.thelcars.com/themes/${theme}.html`;
}
function safeURL(value){try{const u=new URL(value);return ['https:','http:'].includes(u.protocol)?u:null;}catch{return null;}}
function isLocalArchives(url){return !!url&&['http://localhost:8502','http://127.0.0.1:8502'].includes(url.origin);}
function isLocalDataHub(url){return !!url&&['http://localhost:8501','http://127.0.0.1:8501'].includes(url.origin);}
function isSpotify(url){return ['spotify.com','www.spotify.com','open.spotify.com'].includes(url.hostname);}
function spotifyContent(value){
  const url=safeURL(value);if(!url||url.hostname!=='open.spotify.com')return null;
  const match=url.pathname.match(/^\/(?:intl-[a-z-]+\/)?(?:embed\/)?(playlist|album|track|artist|show|episode)\/([A-Za-z0-9]{22})\/?$/i);
  if(!match)return null;
  const entity=`${match[1].toLowerCase()}/${match[2]}`;
  return {embed:`https://open.spotify.com/embed/${entity}`,original:`https://open.spotify.com/${entity}`};
}
function destinationMode(d){
  if(['screen','tab'].includes(d.mode))return d.mode;
  const url=safeURL(d.url);
  return url&&(isLocalDataHub(url)||isLocalArchives(url)||isSpotify(url)||url.origin===location.origin||['fplearning.ca','www.fplearning.ca'].includes(url.hostname))?'screen':'tab';
}
function validLinks(value){return Array.isArray(value)&&value.every(d=>d&&typeof d.name==='string'&&d.name.trim()&&safeURL(d.url));}
const savedShared=read('voyager.shared-links',null);
let destinations;
if(validLinks(savedShared))destinations=savedShared;
else{
  const stored=read('voyager.links',null),legacy=read('voyager.destinations',null);
  const tiles=validLinks(stored?.destinations)?stored.destinations:validLinks(legacy)?legacy:defaults;
  const sidebar=validLinks(stored?.sidebar)?stored.sidebar:[];
  const upgrade=d=>{
    const name=d.name.trim().toUpperCase(),url=new URL(d.url);
    if((name==='LCARS DATABASE'&&['thelcars.com','www.thelcars.com'].includes(url.hostname))||(name==='FPL RESOURCES'&&url.hostname==='fplearning.ca'&&url.pathname==='/files.htm'))return {name:'FPLearning Interlink',url:'https://fplearning.ca/',mode:'screen'};
    if(name==='SUBSPACE MEDIA'&&isSpotify(url)&&url.pathname==='/'&&read('voyager.spotify-version',0)<1)return {...d,mode:'screen'};
    return {...d,mode:destinationMode(d)};
  };
  destinations=tiles.map(upgrade);
  const seen=new Set(destinations.map(d=>new URL(d.url).href));
  for(const link of sidebar.map(upgrade)){const key=new URL(link.url).href;if(!seen.has(key)){destinations.push(link);seen.add(key);}}
  // Old records remain available for recovery. This shared list is now authoritative.
  write('voyager.shared-links',destinations);
}
destinations=destinations.map(d=>({...d,mode:destinationMode(d)}));
// Install the local link once. Later editor removals, labels and order are authoritative.
if (read('voyager.local-datahub-first',false)!==true) {
  let index=destinations.findIndex(d=>isLocalDataHub(safeURL(d.url)));
  if(index<0){destinations.push({name:'LOCAL DATAHUB',url:'http://localhost:8501/',mode:'screen'});index=destinations.length-1;}
  destinations.unshift(destinations.splice(index,1)[0]);
  if(write('voyager.shared-links',destinations))write('voyager.local-datahub-first',true);
}
// Remove only the old default once, allowing it to be recreated manually later.
if(read('voyager.chronometer-removed',false)!==true){
  destinations=destinations.filter(d=>!(d.name.trim().toUpperCase()==='CHRONOMETER'&&new URL(d.url).hostname==='calendar.google.com'));
  if(write('voyager.shared-links',destinations))write('voyager.chronometer-removed',true);
}

// Upgrade only the old Data Archives destination once; keep its position, label and colour.
if(read('lcars.local-archives-installed',false)!==true){
  destinations=destinations.map(d=>d.name.trim().toUpperCase()==='DATA ARCHIVES'&&new URL(d.url).hostname==='drive.google.com'?{...d,url:'http://localhost:8502/',mode:'screen'}:d);
  if(write('voyager.shared-links',destinations))write('lcars.local-archives-installed',true);
}

// Assign legacy links a palette entry once, so their colour follows manual moves.
if(destinations.some(d=>!Object.prototype.hasOwnProperty.call(LINK_PALETTE,d.color))){
  destinations=destinations.map((d,i)=>({...d,color:linkColour(d,i)}));
  write('voyager.shared-links',destinations);
}

// DataHub keeps one app session while the host sidebar changes its active page.
const DATAHUB_ORIGINS = ['http://localhost:8501','http://127.0.0.1:8501'];
let dataHubOrigin = null;
const DATAHUB_PAGES = ['Schedule','Workspace','Add Session','Students','Invoicing','Reports','Journal','Admin'];
let dataHubActive = false;
function resetDataHub() {
  dataHubActive = false;
  dataHubOrigin = null;
  $('embedded-screen').classList.remove('is-datahub');
  $('screen-frame').style.removeProperty('height');
  $('datahub-navigation').hidden = true;
  document.querySelectorAll('[data-local-datahub-link]').forEach(link=>{link.hidden=false;});
  document.querySelectorAll('[datahub-page]').forEach(button => {
    button.disabled = true;
    button.removeAttribute('aria-current');
  });
}
function dataHubSource(source) {
  resetDataHub();
  const url = new URL(source);
  const isHub = DATAHUB_ORIGINS.includes(url.origin);
  if (!isHub) return source;
  const embedded = new URL(url.href);
  dataHubOrigin = url.origin;
  embedded.search = url.search;
  embedded.searchParams.set('embed', 'true');
  embedded.searchParams.set('lcars', '1');
  dataHubActive = true;
  $('embedded-screen').classList.add('is-datahub');
  $('datahub-navigation').hidden = false;
  document.querySelectorAll('[data-local-datahub-link]').forEach(link=>{link.hidden=true;});
  $('datahub-navigation').open = true;
  $('datahub-status').textContent = 'START LOCAL DATAHUB';
  return embedded.href;
}
function dataHubMessage(message) {
  if (dataHubActive) $('screen-frame').contentWindow?.postMessage(message, dataHubOrigin);
}
$('screen-frame').addEventListener('load', () => dataHubMessage({type:'fpl-datahub-ping'}));
document.querySelectorAll('[datahub-page]').forEach(button => button.addEventListener('click', () => {
  dataHubMessage({type:'fpl-datahub-navigate',page:button.getAttribute('datahub-page')});
}));
window.addEventListener('message', event => {
  if (!dataHubActive || event.origin !== dataHubOrigin ||
      event.source !== $('screen-frame').contentWindow) return;
  if (event.data?.type === 'fpl-datahub-size') {
    const height = event.data.height;
    if (Number.isFinite(height) && height > 0 && height <= 50000)
      $('screen-frame').style.height = `${Math.max(320,Math.ceil(height))}px`;
    return;
  }
  if (event.data?.type !== 'fpl-datahub-state' || !DATAHUB_PAGES.includes(event.data.selected)) return;
  $('datahub-status').textContent = event.data.selected.toUpperCase();
  document.querySelectorAll('[datahub-page]').forEach(button => {
    button.disabled = false;
    if (button.getAttribute('datahub-page') === event.data.selected) button.setAttribute('aria-current','page');
    else button.removeAttribute('aria-current');
  });
});

// Folder contents remain inside the local frame. Only root labels, its Drive link and height cross to the host.
let archivesActive=false,archivesOrigin=null;
function resetArchives(){
  archivesActive=false;archivesOrigin=null;
  $('archives-root-control').hidden=true;
  $('embedded-screen').classList.remove('is-archives');
  $('embedded-screen').classList.remove('archives-ready');
  $('screen-hint').textContent='If a page cannot display here, use Open in new tab.';
  $('screen-external').textContent='OPEN IN NEW TAB \u2197';
  $('screen-external').removeAttribute('aria-disabled');
}
function archivesSource(source){
  resetArchives();const url=new URL(source);if(!isLocalArchives(url))return source;
  archivesActive=true;archivesOrigin=url.origin;
  url.searchParams.set('embed','1');url.searchParams.set('theme',homepageTheme());
  url.searchParams.set('root',read('lcars.archives-root','fpl'));
  $('embedded-screen').classList.add('is-archives');
  $('screen-hint').textContent='Start Local LCARS on this computer to browse your folders.';
  $('archives-root-control').hidden=false;$('archives-root').disabled=true;
  $('screen-external').textContent='GOOGLE DRIVE \u2197';
  $('screen-external').removeAttribute('href');$('screen-external').setAttribute('aria-disabled','true');
  return url.href;
}
function validArchiveDriveLink(value){
  const url=safeURL(value);return url&&url.origin==='https://drive.google.com'&&!url.hash&&/^\/drive\/(?:u\/\d+\/)?(?:my-drive|folders\/[A-Za-z0-9_-]+)\/?$/.test(url.pathname)?url.href:null;
}
$('archives-root').addEventListener('change',()=>{
  if(!archivesActive)return;
  write('lcars.archives-root',$('archives-root').value);
  $('screen-external').removeAttribute('href');$('screen-external').setAttribute('aria-disabled','true');
  $('screen-frame').contentWindow?.postMessage({type:'fpl-archives-root',root:$('archives-root').value},archivesOrigin);
});
$('screen-frame').addEventListener('load',()=>{
  if(archivesActive)$('screen-frame').contentWindow?.postMessage({type:'fpl-archives-ping'},archivesOrigin);
});
window.addEventListener('message',event=>{
  if(!archivesActive||event.source!==$('screen-frame').contentWindow||event.origin!==archivesOrigin||event.data?.type!=='fpl-archives-state')return;
  const data=event.data;
  if(!Array.isArray(data.roots)||data.roots.length>10||!data.roots.every(r=>r&&typeof r.id==='string'&&/^[a-z0-9_-]+$/.test(r.id)&&typeof r.label==='string'&&r.label.length<100)||!data.roots.some(r=>r.id===data.root))return;
  $('embedded-screen').classList.add('archives-ready');
  const selector=$('archives-root');
  const signature=JSON.stringify(data.roots);
  if(selector.dataset.roots!==signature){selector.replaceChildren();for(const r of data.roots){const option=document.createElement('option');option.value=r.id;option.textContent=r.label;selector.append(option);}selector.dataset.roots=signature;}
  selector.disabled=false;selector.value=data.root;
  const url=validArchiveDriveLink(data.drive_url);
  if(url){$('screen-external').href=url;$('screen-external').removeAttribute('aria-disabled');}
  else{$('screen-external').removeAttribute('href');$('screen-external').setAttribute('aria-disabled','true');}
  if(Number.isFinite(data.height)&&data.height>0&&data.height<=50000)$('screen-frame').style.height=Math.max(220,Math.ceil(data.height))+'px';
});

let screenTrigger;
function setScreenSource(source){
  source = archivesSource(dataHubSource(source));
  const frame=$('screen-frame'),url=new URL(source);
  // Spotify's documented embed uses its own origin security without a sandbox.
  if(url.hostname==='open.spotify.com'&&url.pathname.startsWith('/embed/'))frame.removeAttribute('sandbox');
  else frame.setAttribute('sandbox','allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads');
  frame.src=source;
}
function syncMediaSidebar(){
  const expanded=document.body.classList.contains('media-view')||document.body.classList.contains('music-playing');
  document.querySelectorAll('[data-spotify-navigation]').forEach(link=>link.setAttribute('aria-expanded',String(expanded)));
}
new MutationObserver(syncMediaSidebar).observe(document.body,{attributes:true,attributeFilter:['class']});
function backgroundSpotify(){
  document.body.classList.remove('media-view');
  const panel=$('spotify-panel');if(panel.hidden)return;
  panel.classList.add('is-background');$('spotify-panel-body').inert=true;
}
function openSpotify(){
  resetArchives();
  resetDataHub();
  document.body.classList.add('media-view');
  const panel=$('spotify-panel');panel.hidden=false;panel.classList.remove('is-background');
  $('spotify-panel-body').inert=false;
  $('command-station').hidden=true;$('embedded-screen').hidden=false;
  $('screen-title').textContent='SUBSPACE MEDIA';$('screen-frame').hidden=true;
  $('screen-external').href=spotifyContent($('spotify-link').value)?.original||'https://open.spotify.com/';
  document.dispatchEvent(new Event('spotify-view-change'));
}
function showStation(){
  resetArchives();
  resetDataHub();
  $('screen-frame').removeAttribute('src');
  backgroundSpotify();
  $('embedded-screen').hidden=true;$('command-station').hidden=false;
  (screenTrigger?.isConnected?screenTrigger:$('command')).focus();screenTrigger=null;
}
function openScreen(url,label,trigger){
  const destination=safeURL(url);if(!destination)return;
  if(destination.origin===location.origin&&destination.pathname===location.pathname){showStation();return;}
  screenTrigger=trigger;
  $('screen-title').textContent=label;
  $('screen-frame').title=`${label} in the LCARS screen`;
  $('spotify-error').textContent='';
  if(isSpotify(destination)){
    const content=spotifyContent(destination.href)||spotifyContent(read('voyager.spotify-player',''));
    if(!$('spotify-frame').hasAttribute('src')&&!$('spotify-panel').dataset.fullPlayer&&content){$('spotify-link').value=content.original;$('spotify-frame').src=content.embed;$('spotify-frame').hidden=false;}
    openSpotify();
  }else{backgroundSpotify();$('screen-frame').hidden=false;setScreenSource(destination.href);if(!archivesActive)$('screen-external').href=destination.href;}
  $('command-station').hidden=true;$('embedded-screen').hidden=false;
  $('screen-title').focus({preventScroll:true});
}
$('spotify-form').addEventListener('submit',e=>{
  e.preventDefault();const content=spotifyContent($('spotify-link').value.trim());
  if(!content){$('spotify-error').textContent='Use a Spotify playlist, album, song, artist, show or episode link from open.spotify.com.';return;}
  $('spotify-error').textContent='';$('spotify-frame').src=content.embed;$('spotify-frame').hidden=false;
  $('screen-external').href=content.original;
  if(!write('voyager.spotify-player',content.original))$('spotify-error').textContent='Player loaded. This browser could not remember your selection.';
});
$('screen-home').addEventListener('click',showStation);
$('navigation-home').addEventListener('click',e=>{e.preventDefault();showStation();$('command').focus();});
function prepareLink(link,d){
  link.href=d.url;
  if(destinationMode(d)==='screen'){
    link.addEventListener('click',e=>{
      if(e.button!==0||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;
      e.preventDefault();openScreen(d.url,d.name,link);
    });
    link.setAttribute('aria-label',`${d.name}, opens in LCARS screen`);
  }else{link.target='_blank';link.rel='noopener';link.setAttribute('aria-label',`${d.name}, opens in a new tab`);}
}
let sound=read('voyager.sound',!/OPR\//.test(navigator.userAgent))===true;
const samples=Object.fromEntries(Object.entries({letter:'beep2',space:'beep1',enter:'beep4',backspace:'beep3'}).map(([kind,file])=>{
  const sample=new Audio(`lcars/assets/audio/${file}.mp3`);sample.preload='auto';sample.volume=.35;return [kind,sample];
}));
let activeSample;
function chirp(kind='letter'){
  if(!sound)return;
  try{
    activeSample?.pause();activeSample=samples[kind]||samples.letter;activeSample.currentTime=0;
    void activeSample.play().catch(()=>{});
  }catch{/* Sound is optional if this browser restricts audio. */}
}
function render(){
  const dataHubNavigation=$('datahub-navigation');
  dataHubNavigation.remove();
  $('destinations').replaceChildren();
  $('sidebar-links').replaceChildren();
  destinations.forEach((d,i)=>{
    const link=document.createElement('a');link.className=linkColour(d,i);link.style.backgroundColor=LINK_PALETTE[linkColour(d,i)].value;
    prepareLink(link,d);link.textContent=`${String(i+1).padStart(2,'0')} / ${d.name}`;$('sidebar-links').append(link);
    if(DATAHUB_ORIGINS.includes(new URL(d.url).origin)){
      link.dataset.localDatahubLink='';link.hidden=dataHubActive;
      dataHubNavigation.querySelector('summary').textContent=link.textContent;
      dataHubNavigation.querySelector('summary').style.backgroundColor=LINK_PALETTE[linkColour(d,i)].value;
      $('sidebar-links').append(dataHubNavigation);
    }
    if(isSpotify(new URL(d.url))){
      const mini=document.createElement('section');mini.className='spotify-sidebar';mini.id=`spotify-sidebar-${i}`;
      link.dataset.spotifyNavigation='';link.setAttribute('aria-controls',mini.id);mini.setAttribute('aria-label',`${d.name} playback`);
      const track=document.createElement('span');track.dataset.spotifyTrack='';track.textContent='NOT PLAYING';
      const remaining=document.createElement('span');remaining.dataset.spotifyRemaining='';remaining.textContent='Connect Spotify for controls';
      const controls=document.createElement('div');controls.className='spotify-sidebar-buttons';
      for(const [action,label] of [['previous','BACK'],['next','NEXT'],['toggle','PLAY'],['stop','STOP'],['shuffle','SHUFFLE: OFF'],['repeat','REPEAT: OFF']]){
        const button=document.createElement('button');button.type='button';button.dataset.spotify=action;button.textContent=label;button.disabled=true;
        button.setAttribute('aria-label',`${label==='BACK'?'Back: click once to restart, twice for previous track':label==='NEXT'?'Next track':label==='STOP'?'Stop playback':'Play or pause'}`);controls.append(button);
        if(action==='previous')button.title='One click restarts. Two clicks within half a second play the previous track.';
      }
      const connection=document.createElement('span');connection.dataset.spotifyConnection='';
      mini.append(track,remaining,$('spotify-signal-template').content.cloneNode(true),connection,controls);$('sidebar-links').append(mini);
    }
  });
  if(!dataHubNavigation.isConnected){dataHubNavigation.hidden=true;$('sidebar-links').append(dataHubNavigation);}
  destinations.forEach((d,i)=>{
    const a=document.createElement('a');a.className='destination';prepareLink(a,d);
    a.style.setProperty('--tile',LINK_PALETTE[linkColour(d,i)].value);
    const number=document.createElement('span');number.className='index';number.textContent=String(i+1).padStart(2,'0');
    const target=document.createElement('span');target.className='target';
    const name=document.createElement('span');name.className='name';name.textContent=d.name;
    const host=document.createElement('span');host.className='host';host.textContent=new URL(d.url).hostname.replace(/^www\./,'').toUpperCase();
    target.append(name,host);a.append(number,target);$('destinations').append(a);
  });
  syncMediaSidebar();
  document.dispatchEvent(new Event('spotify-links-rendered'));
}
function soundLabel(){$('sound').textContent=`PAGE CHIRPS: ${sound?'ON':'OFF'}`;$('sound').setAttribute('aria-pressed',String(sound));}
$('sound').addEventListener('click',()=>{sound=!sound;write('voyager.sound',sound);soundLabel();if(!sound)activeSample?.pause();chirp('enter');});
document.addEventListener('keydown',e=>{
  if(e.ctrlKey||e.metaKey||e.altKey||e.isComposing||e.repeat)return;
  if(e.key.length===1||['Backspace','Enter'].includes(e.key))chirp(e.key==='Enter'?'enter':e.key==='Backspace'?'backspace':e.key===' '?'space':'letter');
});
const engines={google:'https://www.google.ca/search?q=',duckduckgo:'https://duckduckgo.com/?q=',bing:'https://www.bing.com/search?q='};
// Apply the requested Google.ca default once, while preserving later manual choices.
if(read('voyager.search-version',0)<2){if(write('voyager.engine','google'))write('voyager.search-version',2);}
const selected=read('voyager.engine','google');$('engine').value=Object.hasOwn(engines,selected)?selected:'google';
$('engine').addEventListener('change',()=>write('voyager.engine',$('engine').value));
function directAddress(q){
  if(/^https?:\/\//i.test(q)){const u=safeURL(q);if(u)return u.href;}
  if(!/\s/.test(q)&&/^(localhost(?::\d+)?|(?:[\w-]+\.)+[a-z]{2,})(?::\d+)?(?:[/?#].*)?$/i.test(q))return new URL((q.startsWith('localhost')?'http://':'https://')+q).href;
  return null;
}
function resolveCommand(q,engine){
  const address=directAddress(q);if(address)return address;
  return (engines[engine]||engines.google)+encodeURIComponent(q);
}
$('command-form').addEventListener('submit',e=>{
  e.preventDefault();const q=$('command').value.trim();if(!q)return;
  const address=directAddress(q);
  if(address){openScreen(address,new URL(address).hostname,$('command'));return;}
  const link=document.createElement('a');link.href=resolveCommand(q,$('engine').value);link.target='_blank';link.rel='noopener';link.click();
});
let editDrafts;
function captureDraft(){
  const data=new FormData($('edit-form'));
  editDrafts=editDrafts.map((d,i)=>({name:String(data.get(`name-${i}`)??''),url:String(data.get(`url-${i}`)??''),mode:data.get(`mode-${i}`)==='screen'?'screen':'tab',color:linkColour({color:data.get(`color-${i}`)},i)}));
}
function renderEditor(){
  $('edit-rows').replaceChildren();$('edit-error').textContent='';
  editDrafts.forEach((d,i)=>{
    const row=document.createElement('div');row.className='edit-row';
    let addressInput;
    for(const [key,label]of [['name',`${i+1} / LABEL`],['url','WEBSITE ADDRESS']]){
      const l=document.createElement('label');l.textContent=label;
      const input=document.createElement('input');input.name=`${key}-${i}`;input.value=d[key];input.required=true;input.maxLength=key==='name'?35:2048;input.type=key==='url'?'url':'text';l.append(input);row.append(l);if(key==='url')addressInput=input;
    }
    const colourLabel=document.createElement('label');colourLabel.textContent='LCARS COLOUR';
    const colour=document.createElement('select');colour.name=`color-${i}`;
    Object.entries(LINK_PALETTE).forEach(([value,entry])=>{
      const option=document.createElement('option');option.value=value;option.textContent=entry.label;
      option.style.backgroundColor=entry.value;option.style.color='#000';colour.append(option);
    });
    colour.value=linkColour(d,i);
    const previewColour=()=>{colour.style.backgroundColor=LINK_PALETTE[colour.value].value;colour.style.color='#000';};
    colour.addEventListener('change',previewColour);previewColour();
    colourLabel.append(colour);row.append(colourLabel);
    const displayLabel=document.createElement('label');displayLabel.className='embed-choice';
    const display=document.createElement('input');display.type='checkbox';display.name=`mode-${i}`;display.value='screen';display.checked=destinationMode(d)==='screen';
    displayLabel.append(display,document.createTextNode('EMBED IN LCARS SCREEN'));row.append(displayLabel);
    const tools=document.createElement('small');tools.className='link-tools-hint';
    function describeTools(){
      const url=safeURL(addressInput.value);
      const name=isLocalDataHub(url)?'DATAHUB TABS':isLocalArchives(url)?'LOCAL FOLDER BROWSER':url&&isSpotify(url)?'SPOTIFY CONTROLS':'';
      tools.textContent=name?(display.checked?`${name} ATTACHED TO THIS LINK`:`ENABLE EMBEDDING TO OPEN ${name} HERE`):'';
      tools.hidden=!name;
    }
    addressInput.addEventListener('input',describeTools);display.addEventListener('change',describeTools);
    row.append(tools);describeTools();
    const actions=document.createElement('div');actions.className='edit-actions';
    for(const [action,label]of [['up','Up'],['down','Down'],['remove','Remove']]){
      const button=document.createElement('button');button.type='button';button.textContent=label;
      button.setAttribute('aria-label',`${label} link ${i+1}`);button.dataset.action=action;button.dataset.index=String(i);
      button.disabled=(action==='up'&&i===0)||(action==='down'&&i===editDrafts.length-1);
      actions.append(button);
    }
    row.append(actions);
    $('edit-rows').append(row);
  });
}
$('edit').addEventListener('click',()=>{
  $('homepage-theme').value=homepageTheme();
  editDrafts=destinations.map(d=>({...d}));renderEditor();$('editor').showModal();
});
$('add-link').addEventListener('click',()=>{
  captureDraft();editDrafts.push({name:'',url:'https://',mode:'tab',color:linkColour({},editDrafts.length)});renderEditor();
  $('edit-rows').lastElementChild.querySelector('input').focus();
});
$('edit-rows').addEventListener('click',e=>{
  const button=e.target.closest('button[data-action]');if(!button)return;
  captureDraft();const i=Number(button.dataset.index),list=editDrafts;
  if(button.dataset.action==='remove')list.splice(i,1);
  else{const target=i+(button.dataset.action==='up'?-1:1);if(target<0||target>=list.length)return;[list[i],list[target]]=[list[target],list[i]];}
  renderEditor();
});
$('close').addEventListener('click',()=>$('editor').close());
$('edit-form').addEventListener('submit',e=>{
  e.preventDefault();captureDraft();
  const next=editDrafts.map(d=>({...d,name:d.name.trim(),url:d.url.trim()}));
  if(!validLinks(next)){$('edit-error').textContent='ENTER A LABEL AND A VALID HTTP OR HTTPS ADDRESS FOR EVERY LINK.';return;}
  if(!write('voyager.shared-links',next)){$('edit-error').textContent='THIS BROWSER COULD NOT SAVE YOUR LINKS. CHECK LOCAL STORAGE SETTINGS.';return;}
  if(!write('lcars.homepage-theme',$('homepage-theme').value)){$('edit-error').textContent='THIS BROWSER COULD NOT SAVE YOUR THEME.';return;}
  applyHomepageTheme();destinations=next;render();$('editor').close();
});
function clock(){const d=new Date();$('clock').textContent=d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',hour12:false});$('clock').dateTime=d.toISOString();$('date').textContent=d.toLocaleDateString([],{year:'numeric',month:'short',day:'2-digit'}).toUpperCase();}
clock();let timer=setInterval(clock,30000);
document.addEventListener('visibilitychange',()=>{clearInterval(timer);if(!document.hidden){clock();timer=setInterval(clock,30000);}});
applyHomepageTheme();render();soundLabel();

// Request search focus once after the new-tab redirect finishes loading.
(() => {
  let interacted=false;
  const markInteraction=()=>{interacted=true;};
  document.addEventListener('pointerdown',markInteraction,{once:true,capture:true});
  document.addEventListener('keydown',markInteraction,{once:true,capture:true});
  function focusSearch(){
    document.removeEventListener('pointerdown',markInteraction,true);
    document.removeEventListener('keydown',markInteraction,true);
    const command=$('command');
    if(interacted||document.hidden||!command.getClientRects().length)return;
    if(document.activeElement!==document.body&&document.activeElement!==command)return;
    window.focus();
    command.focus({preventScroll:true});
  }
  if(document.readyState==='complete')requestAnimationFrame(focusSearch);
  else window.addEventListener('load',()=>requestAnimationFrame(focusSearch),{once:true});
})();