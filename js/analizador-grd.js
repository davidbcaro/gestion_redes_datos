// ─── UTILS ─────────────────────────────────────────────────────
const ip2i=ip=>ip.split('.').reduce((a,b)=>((a<<8)|+b)>>>0,0);
const i2ip=n=>[(n>>>24),(n>>>16)&255,(n>>>8)&255,n&255].join('.');
const p2mi=p=>p===0?0:(0xFFFFFFFF<<(32-p))>>>0;
const p2o=p=>{const m=p2mi(p);return[(m>>>24),(m>>>16)&255,(m>>>8)&255,m&255];};
function vOct(el){let v=+el.value;if(isNaN(v))return;if(v<0)el.value=0;if(v>255)el.value=255;}
// ─── TAB SWITCHING ─────────────────────────────────────────────
function swTab(id, btn) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('act'));
  document.querySelectorAll('.tab').forEach(b => b.classList.remove('act'));
  document.getElementById('panel-' + id).classList.add('act');
  btn.classList.add('act');
}

function cpText(txt,btn){
  const exec=()=>{const ta=document.createElement('textarea');ta.value=txt;document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);};
  try{navigator.clipboard.writeText(txt).catch(exec);}catch{exec();}
  if(btn){const o=btn.textContent;btn.textContent='✓ Copiado';btn.classList.add('ok');setTimeout(()=>{btn.textContent=o;btn.classList.remove('ok');},1500);}
}

// ─── IPv4 BUILDER ──────────────────────────────────────────────
const clsData={
  A:{r:'1–126',p:8,d:'Redes muy grandes (universidades, ISPs). Primer octeto identifica la red. Ej. privada: <strong>10.x.x.x</strong>',tip:'tipbox-b',pri:'10.0.0.0 – 10.255.255.255'},
  B:{r:'128–191',p:16,d:'Redes medianas (empresas grandes). Primeros 2 octetos son la red. Ej. privada: <strong>172.16.x.x – 172.31.x.x</strong>',tip:'tipbox-g',pri:'172.16.0.0 – 172.31.255.255'},
  C:{r:'192–223',p:24,d:'Redes pequeñas (hogares, PYMEs). Primeros 3 octetos son la red. Ej. privada: <strong>192.168.x.x</strong>',tip:'tipbox-y',pri:'192.168.0.0 – 192.168.255.255'},
  D:{r:'224–239',p:null,d:'<strong>Multicast</strong> — para enviar a grupos de dispositivos. No se usa para hosts normales.',tip:'tipbox-o',pri:'N/A'},
  E:{r:'240–255',p:null,d:'<strong>Experimental/Reservado</strong> — no se usa en redes de producción.',tip:'tipbox-o',pri:'N/A'}
};

function setCls(c,btn){
  document.querySelectorAll('#cls-tabs .cls-tab').forEach(b=>b.classList.remove('act'));
  btn.classList.add('act');
  const d=clsData[c];
  document.getElementById('cls-tip').innerHTML=`<span class="tip-ico">ℹ️</span><div><strong>Clase ${c}</strong> · Primer octeto: ${d.r}${d.p?' · Prefijo por defecto: /'+d.p:''}${d.pri!=='N/A'?' · Rango privado: '+d.pri:''}<br>${d.d}</div>`;
  document.getElementById('cls-tip').className='tipbox '+d.tip;
  const o1=document.getElementById('o1');
  // Map: [o1_min, o1_max, o1_def, o2_def, o3_def, o4_def]
  const map={
    A:[1,126,10,0,0,1],
    B:[128,191,172,16,0,1],
    C:[192,223,192,168,1,1],
    D:[224,239,224,0,0,5],
    E:[240,255,240,0,0,1]
  };
  if(map[c]){
    const[mn,mx,d1,d2,d3,d4]=map[c];
    o1.min=mn; o1.max=mx; o1.value=d1;
    document.getElementById('o2').value=d2;
    document.getElementById('o3').value=d3;
    document.getElementById('o4').value=d4;
  }
  if(d.p) document.getElementById('pfx-slider').value=d.p;
  const roles={A:[1,0,0,0],B:[1,1,0,0],C:[1,1,1,0],D:[0,0,0,0],E:[0,0,0,0]};
  const r=roles[c];
  ['ob1','ob2','ob3','ob4'].forEach((id,i)=>{
    const el=document.getElementById(id);
    el.className='oct-box '+(r[i]?'net':'host');
  });
  upd4();
}

let _lastPfx=-1;
function upd4(){
  const pfx=+document.getElementById('pfx-slider').value;
  const octs=[1,2,3,4].map(i=>{const v=+document.getElementById('o'+i).value;return isNaN(v)?0:Math.min(255,Math.max(0,v));});
  document.getElementById('pfx-num').textContent=pfx;
  const mo=p2o(pfx);
  document.getElementById('pfx-mask').textContent=mo.join('.');
  const ipStr=octs.join('.');
  document.getElementById('ip-full').textContent=ipStr+'/'+pfx;
  const ni=ip2i(ipStr)&p2mi(pfx);
  const bc=ni|(~p2mi(pfx)>>>0);
  document.getElementById('res-net').textContent=i2ip(ni)+(pfx<32?'/'+pfx:'');
  document.getElementById('res-bc').textContent=i2ip(bc);
  if(pfx<=30){const nh=Math.pow(2,32-pfx)-2;document.getElementById('res-fh').textContent=i2ip(ni+1);document.getElementById('res-lh').textContent=i2ip(bc-1);document.getElementById('res-hs').textContent=nh.toLocaleString()+' dispositivos';}
  else{document.getElementById('res-fh').textContent=pfx===32?ipStr:i2ip(ni+1);document.getElementById('res-lh').textContent=pfx===32?ipStr:i2ip(bc-1);document.getElementById('res-hs').textContent=pfx===32?'1 host':'2 hosts';}
  document.getElementById('res-wc').textContent=mo.map(o=>255-o).join('.');
  // Live explanation — cubre TODOS los casos por clase y tipo
  const f=octs[0];
  let tipo='',tipoDesc='';
  if(f===127){
    tipo='🔄 Loopback';
    tipoDesc='El propio dispositivo. Cuando un programa usa <code>127.x.x.x</code>, se comunica <em>consigo mismo</em>. Nunca sale a la red física. Útil para probar que TCP/IP funciona.';
  } else if(f>=1&&f<=126){
    // Clase A
    if(f===10){
      tipo='🔒 Privada · Clase A';
      tipoDesc='RFC 1918. El rango <code>10.0.0.0/8</code> completo es privado. Muy usada en redes corporativas grandes y data centers. <strong>No enrutable en internet.</strong>';
    } else {
      tipo='🌍 Pública · Clase A';
      tipoDesc='IP pública de <strong>Clase A</strong>. Primer octeto 1–126, bits iniciales <code>0xxxxxxx</code>. Las redes Clase A son enormes: cada una admite hasta <strong>16,777,214 hosts</strong>. Solo hay 128 posibles.';
    }
  } else if(f>=128&&f<=191){
    // Clase B
    if(f===169&&octs[1]===254){
      tipo='⚠️ APIPA · Clase B';
      tipoDesc='Asignada automáticamente cuando <strong>no hay servidor DHCP</strong>. Indica un problema de conectividad. Rango: <code>169.254.0.0/16</code>. RFC 3927.';
    } else if(f===172&&octs[1]>=16&&octs[1]<=31){
      tipo='🔒 Privada · Clase B';
      tipoDesc='RFC 1918. Rango privado <code>172.16.0.0 – 172.31.255.255</code>. <strong>No enrutable en internet.</strong> Típica en redes corporativas medianas y VPNs empresariales.';
    } else {
      tipo='🌍 Pública · Clase B';
      tipoDesc='IP pública de <strong>Clase B</strong>. Primer octeto 128–191, bits iniciales <code>10xxxxxx</code>. Hay 16,384 redes Clase B; cada una admite hasta <strong>65,534 hosts</strong>.';
    }
  } else if(f>=192&&f<=223){
    // Clase C
    if(f===192&&octs[1]===168){
      tipo='🏠 Privada · Clase C';
      tipoDesc='La IP privada más común. Tu router doméstico probablemente usa <code>192.168.1.1</code> o <code>192.168.0.1</code>. Rango: <code>192.168.0.0/16</code>. <strong>No sale a internet directamente.</strong>';
    } else if(f===192&&octs[1]===0&&octs[2]===2){
      tipo='📖 Documentación · Clase C';
      tipoDesc='Rango reservado para ejemplos en libros y RFC (<code>192.0.2.0/24</code>). <strong>Nunca se asigna</strong> en redes reales — solo para documentación técnica.';
    } else {
      tipo='🌍 Pública · Clase C';
      tipoDesc='IP pública de <strong>Clase C</strong>. Primer octeto 192–223, bits iniciales <code>110xxxxx</code>. Hay millones de redes Clase C; cada una admite hasta <strong>254 hosts</strong>.';
    }
  } else if(f>=224&&f<=239){
    // Clase D
    const mcDesc={224:'Multicast local (enlace directo)',239:'Multicast de alcance administrativo'};
    tipo='📡 Multicast · Clase D';
    tipoDesc='Dirección de <strong>grupo multicast</strong>. No se asigna a hosts. Ejemplos: <code>224.0.0.5</code>=OSPF AllRouters, <code>224.0.0.9</code>=RIP, <code>224.0.0.251</code>=mDNS, <code>239.255.255.250</code>=SSDP/UPnP.';
  } else {
    // Clase E
    tipo='🔬 Experimental · Clase E';
    tipoDesc='Reservada por IANA para investigación. <strong>Nunca se asigna</strong> en redes de producción. Primer octeto 240–255, bits iniciales <code>1111xxxx</code>. Incluye <code>255.255.255.255</code> (broadcast limitado).';
  }
  const nh=pfx<=30?Math.pow(2,32-pfx)-2:(pfx===31?2:1);
  document.getElementById('le-main').textContent=tipo;
  document.getElementById('le-sub').innerHTML=`${tipoDesc}<br><br>Con prefijo <strong>/${pfx}</strong>: la red <strong>${i2ip(ni)}</strong> puede tener hasta <strong>${nh.toLocaleString()} hosts</strong>. La máscara <strong>${mo.join('.')}</strong> separa la porción de red de la de host.`;
  _lastPfx=pfx;
  // Bits
  renderBits('addr-bits',octs,pfx,false);
  renderBits('mask-bits',mo,pfx,true);
}

function renderBits(id,octs,pfx,isMask){
  const c=document.getElementById(id);c.innerHTML='';let bi=0;
  octs.forEach((oct,oi)=>{
    if(oi>0){const s=document.createElement('div');s.className='bit-sep';c.appendChild(s);}
    for(let b=7;b>=0;b--){
      const d=document.createElement('div');
      const v=(oct>>b)&1;
      const isNet=bi<pfx;
      d.className='bit-cell '+(isNet?'bit-net':'bit-host')+(v?' one':'');
      d.textContent=v;
      d.title=(isNet?'Bit de RED':'Bit de HOST')+' (valor '+v+')';
      c.appendChild(d);bi++;
    }
  });
}

// ─── IPv6 BUILDER ──────────────────────────────────────────────
const V6_TYPES = {
  global:      { vals:['2001','0db8','85a3','0000','0000','8a2e','0370','7334'], lock:[], pfx:48,
    tip:'<strong>Global Unicast (2000::/3)</strong> — Son las IPs públicas de IPv6. Tu ISP te asigna un prefijo (ej. /48) y tú creas subredes /64 para tus redes. Enrutables en todo internet.',
    main:'🌍 Global Unicast — IP Pública IPv6',
    sub:'Esta dirección es enrutable en internet. El rango 2000::/3 abarca todos los bloques que empiezan en 2000 hasta 3FFF. Hoy en día los ISPs asignan prefijos /48 o /56 a sus clientes.' },
  'link-local': { vals:['fe80','0000','0000','0000','0200','00ff','fe00','0001'], lock:[0,1,2,3], pfx:64,
    tip:'<strong>Link-Local (FE80::/10)</strong> — Se generan automáticamente en cada interfaz. Funcionan SOLO en el enlace local (tu red directa). No se enrutan nunca. Son obligatorias en IPv6.',
    main:'🔗 Link-Local — Solo en tu red directa',
    sub:'Cada interfaz genera automáticamente una dirección Link-Local cuando se activa IPv6. Usadas por los protocolos de descubrimiento de vecinos (NDP) y para la comunicación local sin configuración manual.' },
  'unique-local':{ vals:['fd00','0001','0002','0000','0000','0000','0000','0001'], lock:[0], pfx:48,
    tip:'<strong>Unique Local (FC00::/7)</strong> — El equivalente IPv6 de las IPs privadas. FC00 es estático pero FD00 es el rango recomendado. No se enrutan en internet.',
    main:'🏢 Unique Local — IP Privada IPv6',
    sub:'Equivalente a 192.168.x.x y 10.x.x.x de IPv4. Usadas dentro de organizaciones. El prefijo FD00::/8 requiere que los 40 bits siguientes sean un ID global aleatorio para evitar colisiones si dos organizaciones se fusionan.' },
  loopback:     { vals:['0000','0000','0000','0000','0000','0000','0000','0001'], lock:[0,1,2,3,4,5,6,7], pfx:128,
    tip:'<strong>Loopback (::1/128)</strong> — El mismo dispositivo. Equivale exactamente a 127.0.0.1 en IPv4. Nunca sale a la red física.',
    main:'🔄 Loopback — El propio dispositivo',
    sub:'Cuando un programa abre una conexión a ::1, se conecta a sí mismo. Usado para probar que la pila IPv6 funciona correctamente. Es la dirección más corta posible gracias a la compresión: todos los grupos son 0 excepto el último.' },
  multicast:    { vals:['ff02','0000','0000','0000','0000','0000','0000','0001'], lock:[0], pfx:8,
    tip:'<strong>Multicast (FF00::/8)</strong> — Para grupos de dispositivos. En IPv6 NO existe el broadcast — en su lugar se usa multicast. FF02::1 = todos los nodos, FF02::2 = todos los routers.',
    main:'📡 Multicast — Para grupos de dispositivos',
    sub:'IPv6 elimina el broadcast y usa multicast en su lugar. Esto es más eficiente porque solo los dispositivos que pertenecen al grupo procesan el paquete. El segundo byte indica el alcance: 0x1=interfaz, 0x2=enlace, 0xe=global.' },
  custom:       { vals:['2001','0db8','0000','0000','0000','0000','0000','0001'], lock:[], pfx:64,
    tip:'<strong>Modo personalizado</strong> — Ingresa cualquier valor. Usa esto para practicar con cualquier dirección IPv6.',
    main:'✏️ Modo Personalizado',
    sub:'Escribe cualquier valor en los 8 grupos. Recuerda: cada grupo acepta de 1 a 4 dígitos hexadecimales (0-9, A-F). El rango de cada grupo es 0000 a FFFF.' }
};

let curV6Type = 'global';

function setV6Type(type, el) {
  curV6Type = type;
  document.querySelectorAll('.v6tcard').forEach(c => c.classList.remove('act'));
  el.classList.add('act');
  const cfg = V6_TYPES[type];
  document.getElementById('v6-type-tip-txt').innerHTML = cfg.tip;
  document.getElementById('v6-pfx').value = cfg.pfx;
  const inputs = document.querySelectorAll('.hx-inp');
  cfg.vals.forEach((v, i) => {
    inputs[i].value = v.toUpperCase();
    inputs[i].disabled = cfg.lock.includes(i);
  });
  updV6();
}

function sanHex(el) {
  el.value = el.value.replace(/[^0-9a-fA-F]/g, '').toUpperCase();
}

function getV6Groups() {
  return Array.from(document.querySelectorAll('.hx-inp'))
    .map(i => { const v = i.value.trim(); return v ? parseInt(v, 16) : 0; });
}

function compressV6(groups) {
  const hex = groups.map(g => g.toString(16));
  // Find longest run of zeros
  let bestStart = -1, bestLen = 0, curStart = -1, curLen = 0;
  for (let i = 0; i < 8; i++) {
    if (hex[i] === '0') {
      if (curStart === -1) { curStart = i; curLen = 1; } else curLen++;
      if (curLen > bestLen) { bestLen = curLen; bestStart = curStart; }
    } else { curStart = -1; curLen = 0; }
  }
  if (bestLen < 2) return hex.join(':').toUpperCase();
  const left = hex.slice(0, bestStart).join(':').toUpperCase();
  const right = hex.slice(bestStart + bestLen).join(':').toUpperCase();
  return (left && right) ? left + '::' + right : left ? left + '::' : right ? '::' + right : '::';
}

function buildV6Net(groups, pfx) {
  const net = [...groups]; let rem = pfx;
  for (let i = 0; i < 8; i++) {
    if (rem <= 0) net[i] = 0;
    else if (rem >= 16) rem -= 16;
    else { net[i] = net[i] & ((0xFFFF << (16 - rem)) & 0xFFFF); rem = 0; }
  }
  return net;
}

function updV6() {
  const pfx = +document.getElementById('v6-pfx').value;
  document.getElementById('v6pfx-num').textContent = pfx;
  // Prefix hint
  let hint = pfx === 128 ? 'Host único' : pfx === 64 ? 'Red /64 · Interface ID /64' :
    pfx > 64 ? `Red /${pfx} · Interface ID /${128-pfx}` : `Prefijo de red /${pfx}`;
  document.getElementById('v6pfx-hint').textContent = hint;
  const groups = getV6Groups();
  const full = groups.map(g => g.toString(16).padStart(4, '0').toUpperCase()).join(':');
  document.getElementById('v6-full').textContent = full + '/' + pfx;
  const comp = compressV6(groups);
  document.getElementById('v6-comp').textContent = comp + '/' + pfx;
  const netGroups = buildV6Net(groups, pfx);
  document.getElementById('v6-net').textContent = compressV6(netGroups) + '/' + pfx;
  document.getElementById('v6-iid').textContent = groups.slice(4).map(g => g.toString(16).padStart(4, '0').toUpperCase()).join(':');
  document.getElementById('v6-pfxv').textContent = '/' + pfx;
  const hb = 128 - pfx;
  document.getElementById('v6-space').textContent = hb === 0 ? '1 dirección' : hb <= 20 ? Math.pow(2, hb).toLocaleString() + ' dirs.' : '2^' + hb + ' dirs.';
  // Live explanation
  const cfg = V6_TYPES[curV6Type];
  if (cfg) {
    document.getElementById('v6-le-main').textContent = cfg.main;
    document.getElementById('v6-le-sub').innerHTML = cfg.sub + `<br><br>Con prefijo <strong>/${pfx}</strong>: hay <strong>2^${128-pfx}</strong> ${hb<=53?'= '+Math.pow(2,hb<=53?hb:0).toLocaleString():''} direcciones posibles en esta red.`;
  }
  // Bits (first 64 bits = groups 0–3)
  renderV6Bits('v6-bits-row', groups, pfx);
}

function renderV6Bits(id, groups, pfx) {
  const c = document.getElementById(id); c.innerHTML = ''; let bi = 0;
  for (let g = 0; g < 4; g++) {
    if (g > 0) { const s = document.createElement('div'); s.className = 'bit-sep'; c.appendChild(s); }
    const val = groups[g];
    for (let b = 15; b >= 0; b--) {
      const d = document.createElement('div');
      const v = (val >> b) & 1;
      const isNet = bi < pfx;
      d.className = 'bit-cell ' + (isNet ? 'bit-net6' : 'bit-iid') + (v ? ' one' : '');
      d.textContent = v;
      d.title = (isNet ? 'Bit de RED' : 'Bit de Interface ID') + ' (valor ' + v + ')';
      c.appendChild(d); bi++;
    }
  }
  if (pfx > 64) {
    const lbl = document.createElement('div');
    lbl.style.cssText = 'font-size:.75rem;color:var(--purple);font-weight:700;align-self:center;margin-left:8px;white-space:nowrap';
    lbl.textContent = '+' + (pfx - 64) + ' bits red más →';
    c.appendChild(lbl);
  }
}

function cpV6() {
  const txt = document.getElementById('v6-comp').textContent;
  cpText(txt, event.currentTarget);
}


function setAna(v){document.getElementById('ana-inp').value=v;doAna();}
function doAna(){
  const raw=document.getElementById('ana-inp').value.trim();
  const err=document.getElementById('ana-err');err.classList.remove('show');
  const pp=raw.split('/');const addr=pp[0].trim();const uPfx=pp[1]?parseInt(pp[1]):null;
  const octs=addr.split('.').map(Number);
  if(octs.length!==4||octs.some(o=>isNaN(o)||o<0||o>255)){err.classList.add('show');return;}
  const f=octs[0];
  // Class
  let cls,clsBg,clsTxt,clsPfx,clsDesc,clsRange;
  if(f>=1&&f<=126){cls='A';clsBg='var(--blue-l)';clsTxt='var(--blue2)';clsPfx=8;clsRange='1.0.0.0 – 126.255.255.255';clsDesc='Redes muy grandes. Los primeros 8 bits (primer octeto) identifican la red. Hasta 16,777,214 hosts por red.';}
  else if(f===127){cls='Lb';clsBg='#f0fdf4';clsTxt='#166534';clsPfx=8;clsRange='127.0.0.0 – 127.255.255.255';clsDesc='Loopback — dirección de bucle local. El dispositivo se comunica consigo mismo. Nunca se transmite por la red.';}
  else if(f>=128&&f<=191){cls='B';clsBg='var(--green-l)';clsTxt='#166534';clsPfx=16;clsRange='128.0.0.0 – 191.255.255.255';clsDesc='Redes medianas. Los primeros 16 bits (dos octetos) identifican la red. Hasta 65,534 hosts por red.';}
  else if(f>=192&&f<=223){cls='C';clsBg='var(--orange-l)';clsTxt='#b35f00';clsPfx=24;clsRange='192.0.0.0 – 223.255.255.255';clsDesc='Redes pequeñas. Los primeros 24 bits (tres octetos) son la red. Máximo 254 hosts. La más común en hogares y PYMEs.';}
  else if(f>=224&&f<=239){cls='D';clsBg='var(--purple-l)';clsTxt='var(--purple)';clsPfx=null;clsRange='224.0.0.0 – 239.255.255.255';clsDesc='Multicast. No tiene máscara de subred convencional. Se usa para enviar paquetes a grupos de dispositivos.';}
  else{cls='E';clsBg='var(--red-l)';clsTxt='var(--red)';clsPfx=null;clsRange='240.0.0.0 – 255.255.255.255';clsDesc='Experimental/Reservado. No se usa en redes de producción. Reservado por IANA para uso futuro.';}
  // Type
  let tipo,tipoBadge,tipoDesc;
  if(f===127){tipo='Loopback';tipoBadge='rb-green';tipoDesc='127.0.0.1 es la dirección del propio dispositivo. Si haces ping a 127.0.0.1 desde tu PC, te estás enviando el ping a ti mismo — útil para probar que TCP/IP funciona correctamente.';}
  else if(f===10){tipo='Privada · Clase A';tipoBadge='rb-blue';tipoDesc='RFC 1918. Rango: 10.0.0.0 – 10.255.255.255. Típica en redes corporativas grandes. No es enrutable en internet.';}
  else if(f===172&&octs[1]>=16&&octs[1]<=31){tipo='Privada · Clase B';tipoBadge='rb-blue';tipoDesc='RFC 1918. Rango: 172.16.0.0 – 172.31.255.255. Usada en empresas medianas. No es enrutable en internet.';}
  else if(f===192&&octs[1]===168){tipo='Privada · Clase C 🏠';tipoBadge='rb-blue';tipoDesc='La IP privada más común. Tu router doméstico probablemente tiene 192.168.1.1 o 192.168.0.1. Todos los dispositivos de tu casa están en este rango.';}
  else if(f===169&&octs[1]===254){tipo='APIPA ⚠️';tipoBadge='rb-yellow';tipoDesc='Assigned Private IP Address. El sistema operativo asigna esta IP automáticamente cuando no encuentra un servidor DHCP. Generalmente indica un problema de red.';}
  else if(f>=224&&f<=239){tipo='Multicast 📡';tipoBadge='rb-purple';tipoDesc='Para comunicación de grupos. Un solo paquete llega a múltiples destinos. Usado en streaming de video, protocolos de enrutamiento (OSPF usa 224.0.0.5), etc.';}
  else if(f>=240){tipo='Experimental 🔬';tipoBadge='rb-red';tipoDesc='Clase E, reservada para investigación. No se asigna en redes normales.';}
  else{tipo='Pública 🌍';tipoBadge='rb-orange';tipoDesc='Dirección enrutable en internet. Es única a nivel mundial. Tu ISP te asigna una IP pública para conectarte a internet. Ejemplo: los servidores de Google (8.8.8.8) tienen IPs públicas.';}

  const pfx=uPfx!==null?uPfx:(clsPfx||24);
  const mo=p2o(pfx);
  const ni=ip2i(addr)&p2mi(pfx);
  const bc=i2ip(ni|(~p2mi(pfx)>>>0));
  const nh=pfx<=30?Math.pow(2,32-pfx)-2:(pfx===31?2:1);
  const roles=clsPfx?
    (clsPfx===8?['RED','HOST','HOST','HOST']:clsPfx===16?['RED','RED','HOST','HOST']:['RED','RED','RED','HOST']):
    ['—','—','—','—'];
  const octBg=['var(--blue-l)','var(--blue-l)','var(--blue-l)','var(--green-l)'];
  const octBdr=['var(--blue-m)','var(--blue-m)','var(--blue-m)','var(--green-m)'];
  const octClr=['var(--blue2)','var(--blue2)','var(--blue2)','#166534'];
  if(clsPfx===8){octBg[1]=octBg[2]=octBg[3]='var(--green-l)';octBdr[1]=octBdr[2]=octBdr[3]='var(--green-m)';octClr[1]=octClr[2]=octClr[3]='#166534';}
  if(clsPfx===16){octBg[2]=octBg[3]='var(--green-l)';octBdr[2]=octBdr[3]='var(--green-m)';octClr[2]=octClr[3]='#166534';}

  const COLORS=['blk1','blk2','blk3','blk4','blk5','blk6'];

  document.getElementById('ana-result').style.display='block';
  document.getElementById('ana-result').innerHTML=`
  <div class="cls-card" style="background:${clsBg};border:2px solid ${clsTxt}25">
    <div class="cls-letter" style="color:${clsTxt}">CL${cls}</div>
    <div class="cls-info" style="flex:1">
      <h3 style="color:${clsTxt}">Clase ${cls} — ${addr}${uPfx?'/'+uPfx:''}</h3>
      <p>${clsRange}</p>
      <p style="margin-top:4px">${clsDesc}</p>
    </div>
    <div style="display:flex;gap:6px;flex-wrap:wrap">
      <span class="rbadge ${tipoBadge}">${tipo}</span>
    </div>
  </div>

  <div class="g2">
    <div class="card">
      <div class="card-title"><div class="dot" style="background:var(--teal)"></div>Desglose Visual de Octetos</div>
      <div class="oct-vis-row">
        ${octs.map((o,i)=>`
          <div class="oct-vis" style="background:${octBg[i]};border-color:${octBdr[i]}">
            <div class="ov-num" style="color:${octClr[i]}">${o}</div>
            <div class="ov-bin">${o.toString(2).padStart(8,'0')}</div>
            <div class="ov-role" style="color:${octClr[i]}">${roles[i]}</div>
          </div>
          ${i<3?`<div class="oct-dot">.</div>`:''}
        `).join('')}
      </div>
      <div style="margin-top:12px">
        <div style="font-size:.78rem;font-weight:700;color:var(--g600);margin-bottom:6px">Representación binaria completa:</div>
        <div class="bits-row" id="ana-bits"></div>
      </div>
    </div>

    <div class="card">
      <div class="card-title"><div class="dot" style="background:var(--orange)"></div>Datos Calculados</div>
      <div class="iv-grid">
        <div class="iv"><div class="iv-label">Dirección</div><div class="iv-val blue">${addr}</div></div>
        <div class="iv"><div class="iv-label">Prefijo</div><div class="iv-val" style="color:var(--purple)">/${pfx}</div></div>
        <div class="iv"><div class="iv-label">Máscara /${pfx}</div><div class="iv-val">${mo.join('.')}</div></div>
        <div class="iv"><div class="iv-label">Wildcard mask</div><div class="iv-val orange">${mo.map(o=>255-o).join('.')}</div></div>
        <div class="iv"><div class="iv-label">🔵 Red</div><div class="iv-val blue">${i2ip(ni)}/${pfx}</div></div>
        <div class="iv"><div class="iv-label">📢 Broadcast</div><div class="iv-val red">${bc}</div></div>
        <div class="iv"><div class="iv-label">🟢 Primer host</div><div class="iv-val green">${pfx<=30?i2ip(ni+1):'—'}</div></div>
        <div class="iv"><div class="iv-label">🟢 Último host</div><div class="iv-val green">${pfx<=30?i2ip((ni|(~p2mi(pfx)>>>0))-1):'—'}</div></div>
        <div class="iv"><div class="iv-label">👥 Hosts útiles</div><div class="iv-val">${nh.toLocaleString()}</div></div>
        <div class="iv"><div class="iv-label">Hex</div><div class="iv-val">0x${octs.map(o=>o.toString(16).padStart(2,'0').toUpperCase()).join('')}</div></div>
        <div class="iv"><div class="iv-label">Decimal (32-bit)</div><div class="iv-val">${ip2i(addr).toLocaleString()}</div></div>
        <div class="iv"><div class="iv-label">Clase</div><div class="iv-val" style="color:${clsTxt}">${cls==='Lb'?'Loopback':'Clase '+cls}</div></div>
      </div>
    </div>
  </div>

  <div class="card">
    <div class="card-title"><div class="dot" style="background:var(--blue)"></div>Explicación Detallada — ¿Qué significa cada cosa?</div>
    <div class="step-list">
      <div class="step-item">
        <div class="step-num sn-blue">1</div>
        <div class="step-text"><strong>Clase ${cls}:</strong> El primer octeto es <code>${f}</code>. Como ${f} está en el rango <strong>${clsRange.split('–')[0].trim().split('.')[0]}–${f>=224?'255':clsRange.split('–')[1]?.trim().split('.')[0]}</strong>, esta IP es de Clase ${cls}. ${clsDesc}</div>
      </div>
      <div class="step-item">
        <div class="step-num sn-blue">2</div>
        <div class="step-text"><strong>Tipo:</strong> ${tipo}. ${tipoDesc}</div>
      </div>
      ${clsPfx?`<div class="step-item">
        <div class="step-num sn-blue">3</div>
        <div class="step-text"><strong>Porción de red vs host:</strong> Con máscara por defecto de Clase ${cls} (/${clsPfx}), los primeros ${clsPfx} bits = red (<code>${octs.slice(0,clsPfx/8).join('.')}</code>), los ${32-clsPfx} bits restantes = host (<code>${octs.slice(clsPfx/8).join('.')}</code>).</div>
      </div>
      <div class="step-item">
        <div class="step-num sn-blue">4</div>
        <div class="step-text"><strong>Con prefijo /${pfx}:</strong> La red es <code>${i2ip(ni)}</code>, el broadcast es <code>${bc}</code>, hay <strong>${nh.toLocaleString()} hosts útiles</strong> disponibles.</div>
      </div>`:''}
      <div class="step-item">
        <div class="step-num" style="background:var(--orange);color:#fff">${clsPfx?5:3}</div>
        <div class="step-text"><strong>¿Qué es el broadcast?</strong> <code>${bc}</code> es la dirección que llega a <em>todos</em> los dispositivos de la red ${i2ip(ni)}. Es como hacer una transmisión por altavoces: todos escuchan. No se puede asignar a ningún dispositivo.</div>
      </div>
    </div>
  </div>`;
  renderBits('ana-bits',octs,pfx,false);
}

// ─── SUBNET CALCULATOR ─────────────────────────────────────────
let subMode='subnets';
function setSM(m){
  subMode=m;
  document.getElementById('smb-subnets').classList.toggle('act',m==='subnets');
  document.getElementById('smb-hosts').classList.toggle('act',m==='hosts');
  document.getElementById('sub-cnt-lbl').textContent=m==='subnets'?'Número de subredes que necesitas':'Hosts mínimos que necesitas por subred';
  document.getElementById('sub-hint').innerHTML=m==='subnets'?
    'Ingresa cuántas subredes separadas necesitas. Ejemplo: Ventas + IT + Gerencia = <strong>3 subredes</strong>.':
    'Ingresa cuántos dispositivos necesitas en la subred más grande. Ejemplo: Laboratorio de 30 PCs = <strong>30 hosts</strong>.';
}

const BLOCK_CLASSES=['blk1','blk2','blk3','blk4','blk5','blk6','blk7','blk8','blk9','blkc0','blkc1','blkc2'];
function calcSub(){
  const octs=[1,2,3,4].map(i=>parseInt(document.getElementById('sb'+i).value)||0);
  const bPfx=parseInt(document.getElementById('sb-pfx').value)||24;
  const cnt=parseInt(document.getElementById('sub-cnt').value)||4;
  if(bPfx<1||bPfx>30)return;
  let nPfx;
  if(subMode==='subnets') nPfx=bPfx+Math.ceil(Math.log2(Math.max(cnt,2)));
  else nPfx=32-Math.ceil(Math.log2(cnt+2));
  if(nPfx>30)nPfx=30;if(nPfx<=bPfx)nPfx=bPfx+1;
  const totSub=Math.pow(2,nPfx-bPfx),subSz=Math.pow(2,32-nPfx),hps=subSz-2;
  const mi=p2mi(bPfx),bInt=ip2i(octs.join('.'))&mi,bNet=i2ip(bInt);
  const totA=Math.pow(2,32-bPfx);
  const eB=nPfx-bPfx;
  const maxD=Math.min(totSub,32);
  const subs=[];
  for(let i=0;i<maxD;i++){const ni=bInt+(i*subSz);const bi=ni+subSz-1;subs.push({idx:i+1,net:i2ip(ni),fh:i2ip(ni+1),lh:i2ip(bi-1),bc:i2ip(bi),hs:hps,pfx:nPfx});}

  const res=document.getElementById('sub-result');res.style.display='block';

  // Stats
  let statsHTML=`<div class="stats-row">
    <div class="stat-box"><div class="sv" style="color:var(--blue2)">${bNet}/${bPfx}</div><div class="sl">Red Base</div></div>
    <div class="stat-box"><div class="sv">${totSub.toLocaleString()}</div><div class="sl">Subredes totales</div></div>
    <div class="stat-box"><div class="sv" style="color:var(--green)">${hps.toLocaleString()}</div><div class="sl">Hosts/subred</div></div>
    <div class="stat-box"><div class="sv" style="color:var(--purple)">/${nPfx}</div><div class="sl">Nuevo prefijo</div></div>
    <div class="stat-box"><div class="sv" style="font-size:1rem">${p2o(nPfx).join('.')}</div><div class="sl">Nueva máscara</div></div>
    <div class="stat-box"><div class="sv" style="color:var(--red)">${(totSub*hps).toLocaleString()}</div><div class="sl">Hosts totales</div></div>
  </div>`;

  // Diagram
  let diag=`<div class="sdiag"><div class="sdiag-header">🗺️ Mapa Visual de la Red — ${bNet}/${bPfx} dividida en ${totSub} subredes</div><div class="sdiag-body">
    <div class="sdiag-net">📦 Red original: <strong>${bNet}/${bPfx}</strong> &nbsp;·&nbsp; ${totA.toLocaleString()} direcciones en total &nbsp;·&nbsp; ${totA-2} hosts utilizables</div>
    <div class="sdiag-blocks">`;
  subs.forEach((s,i)=>{
    const bc=BLOCK_CLASSES[i%BLOCK_CLASSES.length];
    diag+=`<div class="sdiag-block ${bc}">
      <div class="sb-idx">🏘️ Subred #${s.idx}</div>
      <div class="sb-net">${s.net}/${nPfx}</div>
      <div class="sb-info">👥 ${s.hs} hosts &nbsp;·&nbsp; 📢 BC: ${s.bc}</div>
    </div>`;
  });
  if(totSub>maxD)diag+=`<div style="padding:10px;font-size:.82rem;color:var(--g600)">... y ${totSub-maxD} subredes más</div>`;
  diag+=`</div></div></div>`;

  // Table
  let table=`<div class="tbl-wrap"><table class="tbl">
    <thead><tr><th>#</th><th>🔵 Red</th><th>🟢 1er Host</th><th>🟢 Último Host</th><th>📢 Broadcast</th><th>👥 Hosts útiles</th></tr></thead>
    <tbody>`;
  subs.forEach((s,i)=>{
    const bc=BLOCK_CLASSES[i%BLOCK_CLASSES.length];
    table+=`<tr><td style="font-weight:800;color:var(--purple)">#${s.idx}</td>
      <td style="color:var(--blue2);font-weight:600">${s.net}/${s.pfx}</td>
      <td style="color:var(--green)">${s.fh}</td>
      <td style="color:var(--green)">${s.lh}</td>
      <td style="color:var(--red)">${s.bc}</td>
      <td style="font-weight:700">${s.hs.toLocaleString()}</td></tr>`;
  });
  if(totSub>maxD)table+=`<tr><td colspan="6" style="text-align:center;color:var(--g600)">... y ${totSub-maxD} subredes más (mismo patrón, prefijo /${nPfx})</td></tr>`;
  table+=`</tbody></table></div>`;

  // Step explanation
  let steps=`<div class="card">
    <div class="card-title"><div class="dot" style="background:var(--green)"></div>Cómo se calculó — Paso a Paso</div>
    <div class="step-list">
      <div class="step-item"><div class="step-num sn-blue">1</div>
        <div class="step-text"><strong>Red base:</strong> <code>${bNet}/${bPfx}</code> tiene <strong>${totA.toLocaleString()} direcciones</strong> (2^(32-${bPfx}) = 2^${32-bPfx} = ${totA}). La máscara actual es <code>${p2o(bPfx).join('.')}</code>.</div>
      </div>
      <div class="step-item"><div class="step-num sn-blue">2</div>
        <div class="step-text"><strong>Bits necesarios:</strong> ${subMode==='subnets'?
          `Para crear <strong>${cnt} subredes</strong>, necesitamos 2^n ≥ ${cnt}. El mínimo es <strong>n = ${eB}</strong> porque 2^${eB} = ${Math.pow(2,eB)} ≥ ${cnt}.`:
          `Para tener mínimo <strong>${cnt} hosts por subred</strong>, necesitamos 2^n - 2 ≥ ${cnt}. El mínimo es <strong>n = ${32-nPfx}</strong> bits de host (2^${32-nPfx} - 2 = ${hps} ≥ ${cnt}).`}
        Se toman <strong>${eB} bit(s)</strong> de la parte de host y se agregan a la parte de red.</div>
      </div>
      <div class="step-item"><div class="step-num sn-blue">3</div>
        <div class="step-text"><strong>Nuevo prefijo:</strong> /${bPfx} + ${eB} bits = <strong>/${nPfx}</strong><br>
        Nueva máscara: <code>${p2o(nPfx).join('.')}</code><br>
        En binario: <code>${p2o(nPfx).map(o=>o.toString(2).padStart(8,'0')).join('.')}</code></div>
      </div>
      <div class="step-item"><div class="step-num sn-blue">4</div>
        <div class="step-text"><strong>Tamaño de cada subred:</strong> 2^(32-${nPfx}) = <strong>${subSz} direcciones</strong> por subred.<br>
        Hosts útiles = ${subSz} - 2 = <strong>${hps}</strong> (se restan 1 dirección de red + 1 broadcast).<br>
        <strong>Salto entre subredes:</strong> cada red empieza <code>${subSz}</code> posiciones después de la anterior.</div>
      </div>
      ${subs.length>=2?`<div class="step-item"><div class="step-num" style="background:var(--green);color:#fff">5</div>
        <div class="step-text"><strong>Ejemplo práctico — Subred #1 y #2:</strong><br>
        Subred 1: Red=<code>${subs[0].net}/${nPfx}</code> · Primer host=<code>${subs[0].fh}</code> · Último host=<code>${subs[0].lh}</code> · Broadcast=<code>${subs[0].bc}</code><br>
        Subred 2: Red=<code>${subs[1].net}/${nPfx}</code> · Primer host=<code>${subs[1].fh}</code> · Último host=<code>${subs[1].lh}</code> · Broadcast=<code>${subs[1].bc}</code></div>
      </div>`:''}
    </div>
    <div class="tipbox tipbox-y" style="margin-top:4px">
      <span class="tip-ico">💡</span>
      <div><strong>Regla de oro:</strong> Para encontrar la siguiente subred, suma <code>${subSz}</code> a la dirección de red de la subred anterior. ¡El broadcast de una subred siempre es 1 antes de la red de la siguiente!</div>
    </div>
  </div>`;

  res.innerHTML=statsHTML+diag+table+steps;
  res.scrollIntoView({behavior:'smooth',block:'start'});
}

// ─── CISCO COMMANDS ────────────────────────────────────────────
let curTopic='vlans';
function setTopic(t,el){
  curTopic=t;
  document.querySelectorAll('.topic-card').forEach(c=>c.classList.remove('act'));
  el.classList.add('act');
  document.getElementById('cisco-out').style.display='none';
  renderForm(t);
}

function renderForm(t){
  const a=document.getElementById('cisco-form-area');
  const forms={
    vlans:`<div class="cisco-form">
      <div class="concept" style="background:var(--blue-l);border-left:4px solid var(--blue);margin-bottom:18px;padding:14px 18px">
        <div class="concept-icon" style="font-size:2rem">🔀</div>
        <div><div class="concept-title" style="font-size:1rem;color:var(--blue2)">¿Qué son las VLANs?</div>
        <div class="concept-desc" style="font-size:.85rem">Una VLAN (Virtual LAN) divide un switch físico en <strong>múltiples redes lógicas independientes</strong>. Como si tuvieras varios switches separados en uno solo. Los dispositivos en VLANs diferentes <strong>no se pueden comunicar</strong> sin un router.</div></div>
      </div>
      <div class="g2">
        <div><label class="fl">Hostname del Switch</label><input type="text" id="sw-h" value="SW1" placeholder="SW1"></div>
        <div><label class="fl">Puerto Trunk (hacia router o switch central)</label><input type="text" id="sw-tr" placeholder="GigabitEthernet0/1"><div style="font-size:.75rem;color:var(--g600);margin-top:3px">Ej: GigabitEthernet0/1 · Fa0/24 · Gi0/1</div></div>
      </div>
      <label class="fl">VLANs a crear y sus puertos</label>
      <table class="vlan-table"><thead><tr><th>ID VLAN</th><th>Nombre</th><th>Puertos de acceso (separados por coma)</th><th></th></tr></thead>
      <tbody id="v-rows">
        <tr><td><input type="number" placeholder="10" min="1" max="4094" style="width:80px"></td><td><input type="text" placeholder="VENTAS"></td><td><input type="text" placeholder="Fa0/1,Fa0/2,Fa0/3"></td><td><button class="del-btn" onclick="delR(this)">✕</button></td></tr>
        <tr><td><input type="number" placeholder="20" min="1" max="4094" style="width:80px"></td><td><input type="text" placeholder="SISTEMAS"></td><td><input type="text" placeholder="Fa0/5,Fa0/6"></td><td><button class="del-btn" onclick="delR(this)">✕</button></td></tr>
      </tbody></table>
      <button class="add-btn" onclick="addR('v-rows','vlan')">+ Agregar VLAN</button>
      <button class="gen-btn" onclick="genVlans()">⚡ Generar Comandos</button>
    </div>`,
    intervlan:`<div class="cisco-form">
      <div class="concept" style="background:var(--green-l);border-left:4px solid var(--green);margin-bottom:18px;padding:14px 18px">
        <div class="concept-icon" style="font-size:2rem">🌐</div>
        <div><div class="concept-title" style="font-size:1rem;color:var(--green)">Router on a Stick</div>
        <div class="concept-desc" style="font-size:.85rem">Para que las VLANs se comuniquen entre sí, necesitas un <strong>router</strong>. La técnica "Router on a Stick" usa <strong>una sola interfaz física</strong> del router dividida en subinterfaces virtuales, una por VLAN. Un cable = comunicación entre todas las VLANs.</div></div>
      </div>
      <div class="g2">
        <div><label class="fl">Hostname del Router</label><input type="text" id="rt-h" value="R1" placeholder="R1"></div>
        <div><label class="fl">Interfaz física hacia el switch (trunk)</label><input type="text" id="rt-if" value="GigabitEthernet0/0" placeholder="GigabitEthernet0/0"></div>
      </div>
      <label class="fl">Una fila por VLAN (gateway = IP que usarán los PCs de esa VLAN)</label>
      <table class="vlan-table"><thead><tr><th>VLAN ID</th><th>Nombre</th><th>IP Gateway</th><th>Máscara</th><th></th></tr></thead>
      <tbody id="iv-rows">
        <tr><td><input type="number" placeholder="10" style="width:70px"></td><td><input type="text" placeholder="VENTAS"></td><td><input type="text" placeholder="192.168.10.1"></td><td><input type="text" placeholder="255.255.255.0" style="width:140px"></td><td><button class="del-btn" onclick="delR(this)">✕</button></td></tr>
        <tr><td><input type="number" placeholder="20" style="width:70px"></td><td><input type="text" placeholder="SISTEMAS"></td><td><input type="text" placeholder="192.168.20.1"></td><td><input type="text" placeholder="255.255.255.0" style="width:140px"></td><td><button class="del-btn" onclick="delR(this)">✕</button></td></tr>
      </tbody></table>
      <button class="add-btn" onclick="addR('iv-rows','iv')">+ Agregar VLAN</button>
      <button class="gen-btn" onclick="genIV()">⚡ Generar Comandos</button>
    </div>`,
    'acl-std':`<div class="cisco-form">
      <div class="concept" style="background:var(--orange-l);border-left:4px solid var(--orange);margin-bottom:18px;padding:14px 18px">
        <div class="concept-icon" style="font-size:2rem">🛡️</div>
        <div><div class="concept-title" style="font-size:1rem;color:#fbbf24">ACL Estándar — ¿Qué es?</div>
        <div class="concept-desc" style="font-size:.85rem">Una ACL (Lista de Control de Acceso) es como un <strong>guardia de seguridad</strong> que revisa cada paquete. La ACL <em>estándar</em> solo revisa <strong>la IP de origen</strong> — de dónde viene el paquete. Número: <strong>1–99</strong>.</div></div>
      </div>
      <div class="g2">
        <div><label class="fl">Número o nombre de la ACL</label><input type="text" id="as-num" value="10" placeholder="10 (número) o BLOQUEAR_VENTAS (nombre)"></div>
        <div>
          <label class="fl">Aplicar en interfaz</label>
          <input type="text" id="as-if" placeholder="GigabitEthernet0/1">
          <div style="display:flex;gap:12px;margin-top:8px">
            <label style="display:flex;align-items:center;gap:5px;font-size:.85rem;cursor:pointer"><input type="radio" name="as-dir" value="in" checked> <strong>in</strong> (tráfico que entra)</label>
            <label style="display:flex;align-items:center;gap:5px;font-size:.85rem;cursor:pointer"><input type="radio" name="as-dir" value="out"> <strong>out</strong> (tráfico que sale)</label>
          </div>
        </div>
      </div>
      <label class="fl">Reglas (se evalúan en orden, de arriba hacia abajo)</label>
      <table class="vlan-table"><thead><tr><th>Acción</th><th>IP/Red origen</th><th>Wildcard mask</th><th></th></tr></thead>
      <tbody id="as-rows">
        <tr><td><select style="padding:7px;font-size:.85rem"><option>permit</option><option>deny</option></select></td><td><input type="text" placeholder="192.168.10.0"></td><td><input type="text" placeholder="0.0.0.255"></td><td><button class="del-btn" onclick="delR(this)">✕</button></td></tr>
        <tr><td><select style="padding:7px;font-size:.85rem"><option selected>deny</option><option>permit</option></select></td><td><input type="text" placeholder="any" value="any"></td><td><input type="text" placeholder="—" disabled style="opacity:.4"></td><td><button class="del-btn" onclick="delR(this)">✕</button></td></tr>
      </tbody></table>
      <button class="add-btn" onclick="addR('as-rows','acl')">+ Agregar Regla</button>
      <div class="tipbox tipbox-o" style="margin-top:10px"><span class="tip-ico">⚠️</span><div><strong>Recuerda:</strong> Al final de toda ACL hay un <code>deny any</code> implícito invisible. Si no agregas un <code>permit any</code> al final, todo lo que no esté explícitamente permitido será bloqueado.</div></div>
      <button class="gen-btn" onclick="genACLstd()">⚡ Generar Comandos</button>
    </div>`,
    'acl-ext':`<div class="cisco-form">
      <div class="concept" style="background:var(--red-l);border-left:4px solid var(--red);margin-bottom:18px;padding:14px 18px">
        <div class="concept-icon" style="font-size:2rem">🔒</div>
        <div><div class="concept-title" style="font-size:1rem;color:#f87171">ACL Extendida — ¿Qué la diferencia?</div>
        <div class="concept-desc" style="font-size:.85rem">La ACL extendida es más poderosa: revisa <strong>IP origen, IP destino, protocolo (TCP/UDP/ICMP) y puerto</strong>. Ejemplo: "bloquea HTTP desde 192.168.1.0 hacia el servidor 10.0.0.1". Número: <strong>100–199</strong>.</div></div>
      </div>
      <div class="g2">
        <div><label class="fl">Número o nombre</label><input type="text" id="ax-num" value="100"></div>
        <div>
          <label class="fl">Aplicar en interfaz</label>
          <input type="text" id="ax-if" placeholder="GigabitEthernet0/0">
          <div style="display:flex;gap:12px;margin-top:8px">
            <label style="display:flex;align-items:center;gap:5px;font-size:.85rem;cursor:pointer"><input type="radio" name="ax-dir" value="in" checked> <strong>in</strong></label>
            <label style="display:flex;align-items:center;gap:5px;font-size:.85rem;cursor:pointer"><input type="radio" name="ax-dir" value="out"> <strong>out</strong></label>
          </div>
        </div>
      </div>
      <label class="fl">Reglas extendidas</label>
      <div style="overflow-x:auto"><table class="vlan-table" style="min-width:650px"><thead><tr><th>Acción</th><th>Proto</th><th>IP Origen</th><th>Wildcard</th><th>IP Destino</th><th>Puerto</th><th></th></tr></thead>
      <tbody id="ax-rows">
        <tr>
          <td><select style="padding:6px;font-size:.82rem;width:80px"><option>permit</option><option>deny</option></select></td>
          <td><select style="padding:6px;font-size:.82rem;width:75px"><option>tcp</option><option>udp</option><option>ip</option><option>icmp</option></select></td>
          <td><input type="text" placeholder="192.168.1.0" style="width:115px"></td>
          <td><input type="text" placeholder="0.0.0.255" style="width:100px"></td>
          <td><input type="text" placeholder="any" style="width:100px"></td>
          <td><input type="text" placeholder="eq 80" style="width:80px"></td>
          <td><button class="del-btn" onclick="delR(this)">✕</button></td>
        </tr>
      </tbody></table></div>
      <button class="add-btn" onclick="addAxRow()">+ Agregar Regla</button>
      <div class="tipbox tipbox-b" style="margin-top:10px"><span class="tip-ico">💡</span><div>Puertos comunes: <strong>eq 80</strong>=HTTP · <strong>eq 443</strong>=HTTPS · <strong>eq 22</strong>=SSH · <strong>eq 53</strong>=DNS · <strong>eq 3389</strong>=RDP · <strong>eq 21</strong>=FTP</div></div>
      <button class="gen-btn" onclick="genACLext()">⚡ Generar Comandos</button>
    </div>`,
    ospf:`<div class="cisco-form">
      <div class="concept" style="background:var(--teal-l);border-left:4px solid var(--teal);margin-bottom:18px;padding:14px 18px">
        <div class="concept-icon" style="font-size:2rem">📡</div>
        <div><div class="concept-title" style="font-size:1rem;color:#22d3ee">OSPF — ¿Qué es?</div>
        <div class="concept-desc" style="font-size:.85rem">OSPF es un <strong>protocolo de enrutamiento dinámico</strong>. En vez de configurar manualmente cada ruta, los routers OSPF se "hablan" entre sí y <strong>aprenden automáticamente</strong> los caminos a todas las redes. Si un enlace falla, recalculan solos.</div></div>
      </div>
      <div class="g2">
        <div><label class="fl">Hostname del Router</label><input type="text" id="os-h" value="R1"></div>
        <div><label class="fl">Process ID de OSPF (número local, 1–65535)</label><input type="number" id="os-pid" value="1" min="1"></div>
        <div><label class="fl">Router-ID (recomendado: IP del loopback)</label><input type="text" id="os-rid" placeholder="1.1.1.1"><div style="font-size:.75rem;color:var(--g600);margin-top:3px">El Router-ID identifica este router en OSPF. Debe ser único.</div></div>
        <div><label class="fl">Interfaz Loopback (para estabilidad)</label><input type="text" id="os-lo" placeholder="Loopback0"></div>
      </div>
      <label class="fl">Redes a anunciar en OSPF</label>
      <table class="vlan-table"><thead><tr><th>Red</th><th>Wildcard mask</th><th>Área OSPF</th><th></th></tr></thead>
      <tbody id="os-rows">
        <tr><td><input type="text" placeholder="192.168.1.0"></td><td><input type="text" placeholder="0.0.0.255"></td><td><input type="number" placeholder="0" value="0" style="width:60px"></td><td><button class="del-btn" onclick="delR(this)">✕</button></td></tr>
        <tr><td><input type="text" placeholder="10.0.0.0"></td><td><input type="text" placeholder="0.0.0.3"></td><td><input type="number" placeholder="0" value="0" style="width:60px"></td><td><button class="del-btn" onclick="delR(this)">✕</button></td></tr>
      </tbody></table>
      <button class="add-btn" onclick="addR('os-rows','ospf')">+ Agregar Red</button>
      <button class="gen-btn" onclick="genOSPF()">⚡ Generar Comandos</button>
    </div>`,
    ssh:`<div class="cisco-form">
      <div class="concept" style="background:var(--purple-l);border-left:4px solid var(--purple);margin-bottom:18px;padding:14px 18px">
        <div class="concept-icon" style="font-size:2rem">🔑</div>
        <div><div class="concept-title" style="font-size:1rem;color:var(--purple)">SSH — Acceso Remoto Seguro</div>
        <div class="concept-desc" style="font-size:.85rem">SSH (Secure Shell) te permite <strong>administrar el switch/router remotamente</strong> de forma cifrada. El viejo protocolo Telnet enviaba todo en texto plano (cualquiera podía ver tu contraseña). SSH <strong>cifra toda la sesión</strong>.</div></div>
      </div>
      <div class="g2">
        <div><label class="fl">Hostname</label><input type="text" id="ss-h" value="SW1"></div>
        <div><label class="fl">Nombre de dominio</label><input type="text" id="ss-dom" value="empresa.local"></div>
        <div><label class="fl">Usuario administrador</label><input type="text" id="ss-u" value="admin"></div>
        <div><label class="fl">Contraseña del usuario</label><input type="text" id="ss-p" placeholder="Cisco123!"></div>
        <div><label class="fl">Enable secret (contraseña privilegiada)</label><input type="text" id="ss-s" placeholder="Enable123!"></div>
        <div><label class="fl">Interfaz de gestión</label><input type="text" id="ss-mg" value="Vlan1"></div>
        <div><label class="fl">IP de gestión</label><input type="text" id="ss-ip" placeholder="192.168.1.254"></div>
        <div><label class="fl">Máscara de gestión</label><input type="text" id="ss-mk" value="255.255.255.0"></div>
      </div>
      <button class="gen-btn" onclick="genSSH()">⚡ Generar Comandos</button>
    </div>`
  };
  a.innerHTML=forms[t]||'';
}

// ─── ROW HELPERS ──────────────────────────────────────────────
function delR(btn){const tr=btn.closest('tr');if(tr.closest('tbody').rows.length>1)tr.remove();}
function addR(id,type){
  const tb=document.getElementById(id);const tr=document.createElement('tr');const n=tb.rows.length+1;
  if(type==='vlan')tr.innerHTML=`<td><input type="number" placeholder="${n*10}" style="width:80px"></td><td><input type="text" placeholder="VLAN_${n}"></td><td><input type="text" placeholder="Fa0/${n*2-1},Fa0/${n*2}"></td><td><button class="del-btn" onclick="delR(this)">✕</button></td>`;
  else if(type==='iv')tr.innerHTML=`<td><input type="number" placeholder="${n*10}" style="width:70px"></td><td><input type="text" placeholder="NOMBRE"></td><td><input type="text" placeholder="192.168.${n}.1"></td><td><input type="text" placeholder="255.255.255.0" style="width:140px"></td><td><button class="del-btn" onclick="delR(this)">✕</button></td>`;
  else if(type==='acl')tr.innerHTML=`<td><select style="padding:7px;font-size:.85rem"><option>permit</option><option>deny</option></select></td><td><input type="text" placeholder="10.0.0.0"></td><td><input type="text" placeholder="0.0.255.255"></td><td><button class="del-btn" onclick="delR(this)">✕</button></td>`;
  else if(type==='ospf')tr.innerHTML=`<td><input type="text" placeholder="172.16.0.0"></td><td><input type="text" placeholder="0.0.255.255"></td><td><input type="number" value="0" style="width:60px"></td><td><button class="del-btn" onclick="delR(this)">✕</button></td>`;
  tb.appendChild(tr);
}
function addAxRow(){
  const tb=document.getElementById('ax-rows');const tr=document.createElement('tr');
  tr.innerHTML=`<td><select style="padding:6px;font-size:.82rem;width:80px"><option>permit</option><option>deny</option></select></td><td><select style="padding:6px;font-size:.82rem;width:75px"><option>tcp</option><option>udp</option><option>ip</option><option>icmp</option></select></td><td><input type="text" placeholder="any" style="width:115px"></td><td><input type="text" placeholder="—" style="width:100px"></td><td><input type="text" placeholder="any" style="width:100px"></td><td><input type="text" placeholder="eq 443" style="width:80px"></td><td><button class="del-btn" onclick="delR(this)">✕</button></td>`;
  tb.appendChild(tr);
}

// ─── CLI HELPERS ──────────────────────────────────────────────
let _cliTxt='';
function C(t){return`<span class="cc">${t}</span>`}
function K(t){return`<span class="ck">${t}</span>`}
function V(t){return`<span class="cv2">${t}</span>`}
function M(t){return`<span class="cm">${t}</span>`}
function P(h,m=''){return`<span class="cp2">${h}${m}#</span> `}
function showCLI(html,plainTxt,explains){
  _cliTxt=plainTxt;
  document.getElementById('cisco-out').style.display='block';
  document.getElementById('cli-pre').innerHTML=html;
  document.getElementById('cmd-exp-area').innerHTML=buildExpPanel(explains);
  document.getElementById('cisco-out').scrollIntoView({behavior:'smooth',block:'start'});
}
function copyCLI(){cpText(_cliTxt,event.currentTarget);}
function buildExpPanel(explains){
  if(!explains||!explains.length)return'';
  let h=`<div class="exp-panel"><div class="exp-title">📖 ¿Qué hace cada comando?</div>`;
  explains.forEach(e=>{h+=`<div class="cmd-explain"><div class="ce-cmd">${e.cmd}</div><div class="ce-txt">${e.txt}</div></div>`;});
  return h+'</div>';
}

// ─── GENERATORS ──────────────────────────────────────────────
function genVlans(){
  const host=document.getElementById('sw-h').value||'SW1';
  const trunk=(document.getElementById('sw-tr').value||'').trim();
  const rows=document.querySelectorAll('#v-rows tr');
  const vlans=[];
  rows.forEach(r=>{const ins=r.querySelectorAll('input');const id=ins[0].value.trim();if(id)vlans.push({id,name:ins[1].value.trim()||'VLAN_'+id,ports:ins[2].value.trim()});});
  if(!vlans.length)return;
  const vIds=vlans.map(v=>v.id).join(',');
  let h=`${C('! ══════════════════════════════════════════')}\n${C('! VLANs — '+host+' — Generado por RedesAprende')}\n${C('! ══════════════════════════════════════════')}\n\n`;
  let t=`! VLANs — ${host}\n\n`;
  h+=`${P(host,'>')}${K('enable')}\n`;t+=`${host}> enable\n`;
  h+=`${P(host)}${K('configure terminal')}\n\n`;t+=`${host}# configure terminal\n\n`;
  h+=`${C('! PASO 1: Crear las VLANs')}\n`;t+=`! PASO 1: Crear las VLANs\n`;
  vlans.forEach(v=>{
    h+=`${M(host+'(config)#')} ${K('vlan')} ${V(v.id)}\n${M(host+'(config-vlan)#')} ${K('name')} ${V(v.name)}\n${M(host+'(config-vlan)#')} ${K('exit')}\n`;
    t+=`${host}(config)# vlan ${v.id}\n${host}(config-vlan)# name ${v.name}\n${host}(config-vlan)# exit\n`;
  });
  h+=`\n${C('! PASO 2: Asignar puertos de acceso')}\n`;t+=`\n! PASO 2: Asignar puertos de acceso\n`;
  vlans.forEach(v=>{if(!v.ports)return;v.ports.split(',').map(p=>p.trim()).filter(Boolean).forEach(p=>{
    h+=`${M(host+'(config)#')} ${K('interface')} ${V(p)}\n${M(host+'(config-if)#')} ${K('switchport mode access')}\n${M(host+'(config-if)#')} ${K('switchport access vlan')} ${V(v.id)}\n${M(host+'(config-if)#')} ${K('no shutdown')}\n${M(host+'(config-if)#')} ${K('exit')}\n`;
    t+=`${host}(config)# interface ${p}\n${host}(config-if)# switchport mode access\n${host}(config-if)# switchport access vlan ${v.id}\n${host}(config-if)# no shutdown\n${host}(config-if)# exit\n`;
  });});
  if(trunk){
    h+=`\n${C('! PASO 3: Puerto trunk (transporta múltiples VLANs)')}\n`;t+=`\n! PASO 3: Puerto trunk\n`;
    h+=`${M(host+'(config)#')} ${K('interface')} ${V(trunk)}\n${M(host+'(config-if)#')} ${K('switchport mode trunk')}\n${M(host+'(config-if)#')} ${K('switchport trunk encapsulation dot1q')}\n${M(host+'(config-if)#')} ${K('switchport trunk allowed vlan')} ${V(vIds)}\n${M(host+'(config-if)#')} ${K('no shutdown')}\n${M(host+'(config-if)#')} ${K('exit')}\n`;
    t+=`${host}(config)# interface ${trunk}\n${host}(config-if)# switchport mode trunk\n${host}(config-if)# switchport trunk encapsulation dot1q\n${host}(config-if)# switchport trunk allowed vlan ${vIds}\n${host}(config-if)# no shutdown\n${host}(config-if)# exit\n`;
  }
  h+=`\n${M(host+'(config)#')} ${K('end')}\n${P(host)}${K('write memory')}\n\n${C('! ─── VERIFICAR ───')}\n${P(host)}${K('show vlan brief')}\n${P(host)}${K('show interfaces trunk')}`;
  t+=`\n${host}(config)# end\n${host}# write memory\n\n! VERIFICAR:\n${host}# show vlan brief\n${host}# show interfaces trunk`;
  showCLI(h,t,[
    {cmd:'vlan [id]',txt:'Crea la VLAN en la base de datos del switch. Sin este paso, la VLAN no existe. Rango válido: 2–1001 (las VLANs 1002–1005 están reservadas).'},
    {cmd:'name [nombre]',txt:'Le pone nombre descriptivo a la VLAN. Opcional, pero muy recomendado para no confundirse en redes grandes.'},
    {cmd:'switchport mode access',txt:'Configura el puerto para conectar un <strong>dispositivo final</strong> (PC, impresora, teléfono IP). El puerto solo pertenecerá a una VLAN.'},
    {cmd:'switchport access vlan [id]',txt:'Asigna el puerto a esa VLAN específica. Sin este comando, el puerto queda en la VLAN 1 por defecto.'},
    {cmd:'switchport mode trunk',txt:'Configura el puerto para transportar tráfico de <strong>múltiples VLANs</strong> simultáneamente. Usado entre switches o hacia el router.'},
    {cmd:'switchport trunk encapsulation dot1q',txt:'Especifica el protocolo de encapsulación 802.1Q que <strong>etiqueta</strong> cada trama con el ID de VLAN. En Packet Tracer algunos switches no necesitan este comando.'},
    {cmd:'switchport trunk allowed vlan [lista]',txt:'Restringe qué VLANs pueden pasar por el trunk. Buena práctica de seguridad: solo permitir las VLANs necesarias.'},
    {cmd:'show vlan brief',txt:'Muestra un resumen de todas las VLANs y sus puertos asignados. <strong>¡Úsalo para verificar que todo quedó bien!</strong>'},
    {cmd:'write memory',txt:'Guarda la configuración en la memoria no volátil (NVRAM). Sin este comando, si el switch se apaga, pierdes todo lo configurado.'}
  ]);
}

function genIV(){
  const host=document.getElementById('rt-h').value||'R1';
  const iface=document.getElementById('rt-if').value.trim()||'GigabitEthernet0/0';
  const rows=document.querySelectorAll('#iv-rows tr');
  const vlans=[];
  rows.forEach(r=>{const ins=r.querySelectorAll('input');const id=ins[0].value.trim();if(id&&ins[2].value.trim())vlans.push({id,name:ins[1].value.trim()||'VLAN'+id,ip:ins[2].value.trim(),mask:ins[3].value.trim()||'255.255.255.0'});});
  if(!vlans.length)return;
  const ifS=iface.replace('GigabitEthernet','Gi').replace('FastEthernet','Fa');
  let h=`${C('! ══════════════════════════════════════')}\n${C('! Router on a Stick — '+host)}\n${C('! ══════════════════════════════════════')}\n\n`;
  let t='';
  h+=`${P(host,'>')}${K('enable')}\n${P(host)}${K('configure terminal')}\n\n`;t+=`${host}> enable\n${host}# configure terminal\n\n`;
  h+=`${C('! PASO 1: Activar interfaz física (sin IP — ella misma no tiene)')}\n`;
  h+=`${M(host+'(config)#')} ${K('interface')} ${V(iface)}\n${M(host+'(config-if)#')} ${K('no ip address')}\n${M(host+'(config-if)#')} ${K('no shutdown')}\n${M(host+'(config-if)#')} ${K('exit')}\n\n`;
  t+=`! PASO 1: Activar interfaz física\n${host}(config)# interface ${iface}\n${host}(config-if)# no ip address\n${host}(config-if)# no shutdown\n${host}(config-if)# exit\n\n`;
  h+=`${C('! PASO 2: Crear subinterfaces (una por VLAN)')}\n`;t+=`! PASO 2: Subinterfaces\n`;
  vlans.forEach(v=>{
    h+=`${C('! — VLAN '+v.id+': '+v.name)}\n${M(host+'(config)#')} ${K('interface')} ${V(ifS+'.'+v.id)}\n${M(host+'(config-subif)#')} ${K('encapsulation dot1q')} ${V(v.id)}\n${M(host+'(config-subif)#')} ${K('ip address')} ${V(v.ip)} ${V(v.mask)}\n${M(host+'(config-subif)#')} ${K('no shutdown')}\n${M(host+'(config-subif)#')} ${K('exit')}\n`;
    t+=`! VLAN ${v.id}\n${host}(config)# interface ${ifS}.${v.id}\n${host}(config-subif)# encapsulation dot1q ${v.id}\n${host}(config-subif)# ip address ${v.ip} ${v.mask}\n${host}(config-subif)# no shutdown\n${host}(config-subif)# exit\n`;
  });
  h+=`\n${M(host+'(config)#')} ${K('end')}\n${P(host)}${K('write memory')}\n\n${C('! VERIFICAR')}\n${P(host)}${K('show ip interface brief')}\n${P(host)}${K('show ip route')}`;
  t+=`\n${host}(config)# end\n${host}# write memory\n\n! VERIFICAR:\n${host}# show ip interface brief\n${host}# show ip route`;
  const gws=vlans.map(v=>`VLAN ${v.id} → Gateway: ${v.ip}`).join(' · ');
  showCLI(h,t,[
    {cmd:'no ip address',txt:'La interfaz física (Gi0/0) actúa solo como <strong>canal de transporte</strong> para las subinterfaces. No tiene IP propia.'},
    {cmd:'interface Gi0/0.[vlan]',txt:'Crea una subinterface virtual. El número después del punto puede ser cualquier número, pero por convención se usa el mismo ID de VLAN.'},
    {cmd:'encapsulation dot1q [vlan-id]',txt:'<strong>Comando crítico.</strong> Le dice a la subinterface que procese tramas etiquetadas con ese VLAN ID. Sin esto, no funcionará.'},
    {cmd:'ip address [ip] [mask]',txt:`Asigna la IP del gateway de esa VLAN. <strong>Los PCs de esa VLAN deben configurar esta IP como su default gateway.</strong><br>${gws}`},
    {cmd:'show ip interface brief',txt:'Muestra el estado de todas las interfaces e IPs configuradas. Verifica que las subinterfaces estén "up/up".'},
    {cmd:'show ip route',txt:'Muestra la tabla de enrutamiento. Deberías ver una línea "C" (directly connected) por cada subinterface configurada.'}
  ]);
}

function genACLstd(){
  const num=document.getElementById('as-num').value.trim()||'10';
  const iface=document.getElementById('as-if').value.trim();
  const dir=document.querySelector('input[name="as-dir"]:checked')?.value||'in';
  const rows=document.querySelectorAll('#as-rows tr');
  const rules=[];
  rows.forEach(r=>{const sel=r.querySelector('select');const ins=r.querySelectorAll('input');if(sel)rules.push({a:sel.value,src:ins[0]?.value.trim()||'any',wc:ins[1]?.value.trim()});});
  const named=isNaN(num);let h='',t='';
  h+=`${C('! ACL Estándar — '+num)}\n\n${P('Router','>')}${K('enable')}\n${P('Router')}${K('configure terminal')}\n\n`;
  t+=`! ACL Estándar ${num}\nRouter> enable\nRouter# configure terminal\n\n`;
  if(named){
    h+=`${M('Router(config)#')} ${K('ip access-list standard')} ${V(num)}\n`;t+=`Router(config)# ip access-list standard ${num}\n`;
    rules.forEach(r=>{const s=r.src==='any'?`${K('any')}`:`${V(r.src)}${r.wc?' '+V(r.wc):''}`;h+=`${M('Router(config-std-nacl)#')} ${K(r.a)} ${s}\n`;t+=`Router(config-std-nacl)# ${r.a} ${r.src}${r.wc?' '+r.wc:''}\n`;});
    h+=`${M('Router(config-std-nacl)#')} ${K('exit')}\n`;t+=`Router(config-std-nacl)# exit\n`;
  } else {
    rules.forEach(r=>{const s=r.src==='any'?K('any'):`${V(r.src)}${r.wc?' '+V(r.wc):''}`;h+=`${M('Router(config)#')} ${K('access-list')} ${V(num)} ${K(r.a)} ${s}\n`;t+=`Router(config)# access-list ${num} ${r.a} ${r.src}${r.wc?' '+r.wc:''}\n`;});
  }
  if(iface){h+=`\n${M('Router(config)#')} ${K('interface')} ${V(iface)}\n${M('Router(config-if)#')} ${K('ip access-group')} ${V(num)} ${V(dir)}\n${M('Router(config-if)#')} ${K('exit')}\n`;t+=`\nRouter(config)# interface ${iface}\nRouter(config-if)# ip access-group ${num} ${dir}\nRouter(config-if)# exit\n`;}
  h+=`\n${M('Router(config)#')} ${K('end')}\n${P('Router')}${K('write memory')}\n\n${C('! VERIFICAR')}\n${P('Router')}${K('show access-lists')}`;
  t+=`\nRouter(config)# end\nRouter# write memory\n\nRouter# show access-lists`;
  showCLI(h,t,[
    {cmd:'access-list [num] [permit/deny] [origen]',txt:'Define una regla de la ACL. Las reglas se evalúan <strong>en orden de arriba hacia abajo</strong>. En cuanto una regla coincide, se aplica y se dejan de evaluar las demás.'},
    {cmd:'ip access-list standard [nombre]',txt:'Crea una ACL con nombre (named ACL). Más fácil de gestionar que las numeradas porque puedes eliminar reglas individuales.'},
    {cmd:'ip access-group [acl] [in/out]',txt:`<strong>Aplica</strong> la ACL a la interfaz. <br><strong>in:</strong> filtra el tráfico que <em>entra</em> al router por esa interfaz.<br><strong>out:</strong> filtra el que <em>sale</em>. Para ACLs estándar, aplica cerca del <strong>destino</strong> (out).`},
    {cmd:'show access-lists',txt:'Muestra todas las ACLs con un contador de cuántas veces se aplicó cada regla. Muy útil para verificar si están funcionando.'}
  ]);
}

function genACLext(){
  const num=document.getElementById('ax-num').value.trim()||'100';
  const iface=document.getElementById('ax-if').value.trim();
  const dir=document.querySelector('input[name="ax-dir"]:checked')?.value||'in';
  const rows=document.querySelectorAll('#ax-rows tr');
  const rules=[];
  rows.forEach(r=>{const sels=r.querySelectorAll('select');const ins=r.querySelectorAll('input');if(sels.length>=2)rules.push({a:sels[0].value,p:sels[1].value,src:ins[0]?.value.trim()||'any',wsrc:ins[1]?.value.trim(),dst:ins[2]?.value.trim()||'any',port:ins[3]?.value.trim()});});
  const named=isNaN(num);let h='',t='';
  h+=`${C('! ACL Extendida — '+num)}\n\n${P('Router','>')}${K('enable')}\n${P('Router')}${K('configure terminal')}\n\n`;t+=`Router> enable\nRouter# configure terminal\n\n`;
  if(named){h+=`${M('Router(config)#')} ${K('ip access-list extended')} ${V(num)}\n`;t+=`Router(config)# ip access-list extended ${num}\n`;
    rules.forEach(r=>{const s=r.src==='any'?K('any'):`${V(r.src)}${r.wsrc?' '+V(r.wsrc):''}`;const d=r.dst==='any'?K('any'):V(r.dst);const pt=r.port?` ${V(r.port)}`:'';h+=`${M('Router(config-ext-nacl)#')} ${K(r.a)} ${K(r.p)} ${s} ${d}${pt}\n`;t+=`Router(config-ext-nacl)# ${r.a} ${r.p} ${r.src}${r.wsrc?' '+r.wsrc:''} ${r.dst}${r.port?' '+r.port:''}\n`;});
    h+=`${M('Router(config-ext-nacl)#')} ${K('exit')}\n`;t+=`Router(config-ext-nacl)# exit\n`;
  } else {
    rules.forEach(r=>{const s=r.src==='any'?K('any'):`${V(r.src)}${r.wsrc?' '+V(r.wsrc):''}`;const d=r.dst==='any'?K('any'):V(r.dst);const pt=r.port?` ${V(r.port)}`:'';h+=`${M('Router(config)#')} ${K('access-list')} ${V(num)} ${K(r.a)} ${K(r.p)} ${s} ${d}${pt}\n`;t+=`Router(config)# access-list ${num} ${r.a} ${r.p} ${r.src}${r.wsrc?' '+r.wsrc:''} ${r.dst}${r.port?' '+r.port:''}\n`;});
  }
  if(iface){h+=`\n${M('Router(config)#')} ${K('interface')} ${V(iface)}\n${M('Router(config-if)#')} ${K('ip access-group')} ${V(num)} ${V(dir)}\n${M('Router(config-if)#')} ${K('exit')}\n`;t+=`\nRouter(config)# interface ${iface}\nRouter(config-if)# ip access-group ${num} ${dir}\nRouter(config-if)# exit\n`;}
  h+=`\n${M('Router(config)#')} ${K('end')}\n${P('Router')}${K('write memory')}\n\n${C('! VERIFICAR')}\n${P('Router')}${K('show access-lists '+num)}`;
  t+=`\nRouter# write memory\nRouter# show access-lists ${num}`;
  showCLI(h,t,[
    {cmd:'ip access-list extended [nombre]',txt:'Crea la ACL extendida. Las ACLs extendidas deben aplicarse <strong>cerca del origen</strong> del tráfico (in) para no desperdiciar ancho de banda procesando paquetes que serán descartados.'},
    {cmd:'[permit/deny] [proto] [src] [dst] [puerto]',txt:'La regla completa. El protocolo puede ser <strong>tcp, udp, ip</strong> (cualquier protocolo), <strong>icmp</strong> (pings). El puerto usa <strong>eq</strong> (igual), <strong>gt</strong> (mayor que), <strong>lt</strong> (menor que), <strong>range</strong> (rango).'},
    {cmd:'any',txt:'Significa <strong>cualquier IP</strong> — equivale a escribir 0.0.0.0 con wildcard 255.255.255.255. Mucho más corto y legible.'},
    {cmd:'host [ip]',txt:'Significa <strong>esa IP exacta</strong> — equivale a poner wildcard 0.0.0.0. Ejemplo: <code>host 192.168.1.50</code> = solo esa PC.'}
  ]);
}

function genOSPF(){
  const host=document.getElementById('os-h').value||'R1';
  const pid=document.getElementById('os-pid').value||'1';
  const rid=document.getElementById('os-rid').value.trim();
  const lo=document.getElementById('os-lo').value.trim();
  const rows=document.querySelectorAll('#os-rows tr');
  const nets=[];rows.forEach(r=>{const ins=r.querySelectorAll('input');if(ins[0].value.trim())nets.push({n:ins[0].value.trim(),w:ins[1].value.trim()||'0.0.0.0',a:ins[2].value.trim()||'0'});});
  let h='',t='';
  h+=`${C('! OSPF — '+host)}\n\n${P(host,'>')}${K('enable')}\n${P(host)}${K('configure terminal')}\n\n`;t+=`${host}> enable\n${host}# configure terminal\n\n`;
  if(lo&&rid){h+=`${C('! PASO 1: Loopback para Router-ID estable')}\n${M(host+'(config)#')} ${K('interface')} ${V(lo)}\n${M(host+'(config-if)#')} ${K('ip address')} ${V(rid)} ${V('255.255.255.255')}\n${M(host+'(config-if)#')} ${K('no shutdown')}\n${M(host+'(config-if)#')} ${K('exit')}\n\n`;t+=`! Loopback\n${host}(config)# interface ${lo}\n${host}(config-if)# ip address ${rid} 255.255.255.255\n${host}(config-if)# no shutdown\n${host}(config-if)# exit\n\n`;}
  h+=`${C('! PASO '+(lo?2:1)+': Proceso OSPF')}\n${M(host+'(config)#')} ${K('router ospf')} ${V(pid)}\n`;t+=`${host}(config)# router ospf ${pid}\n`;
  if(rid){h+=`${M(host+'(config-router)#')} ${K('router-id')} ${V(rid)}\n`;t+=`${host}(config-router)# router-id ${rid}\n`;}
  h+=`${M(host+'(config-router)#')} ${K('auto-cost reference-bandwidth')} ${V('1000')}\n`;t+=`${host}(config-router)# auto-cost reference-bandwidth 1000\n`;
  nets.forEach(n=>{h+=`${M(host+'(config-router)#')} ${K('network')} ${V(n.n)} ${V(n.w)} ${K('area')} ${V(n.a)}\n`;t+=`${host}(config-router)# network ${n.n} ${n.w} area ${n.a}\n`;});
  h+=`${M(host+'(config-router)#')} ${K('exit')}\n\n${M(host+'(config)#')} ${K('end')}\n${P(host)}${K('write memory')}\n\n${C('! VERIFICAR')}\n${P(host)}${K('show ip ospf neighbor')}\n${P(host)}${K('show ip route ospf')}`;
  t+=`${host}(config-router)# exit\n${host}(config)# end\n${host}# write memory\n\n${host}# show ip ospf neighbor\n${host}# show ip route ospf`;
  showCLI(h,t,[
    {cmd:'router ospf [process-id]',txt:'Inicia el proceso OSPF. El Process ID es local al router — no tiene que coincidir entre routers vecinos. Puedes tener múltiples procesos OSPF.'},
    {cmd:'router-id [ip]',txt:'Identificador único de este router en el dominio OSPF. Si no lo configuras, OSPF elige automáticamente la IP de loopback más alta, o la IP de interfaz activa más alta. <strong>Configúralo manualmente para tener control.</strong>'},
    {cmd:'auto-cost reference-bandwidth 1000',txt:'Actualiza el ancho de banda de referencia para calcular costos OSPF. Por defecto es 100 Mbps, lo que da el mismo costo a FastEthernet, GigabitEthernet y 10G. Con 1000 se diferencia mejor. <strong>Configura lo mismo en TODOS los routers.</strong>'},
    {cmd:'network [red] [wildcard] area [N]',txt:'Anuncia en OSPF las interfaces cuyas IPs coincidan con ese patrón. El área 0 es el área backbone — obligatoria en toda red OSPF.'},
    {cmd:'show ip ospf neighbor',txt:'<strong>Comando clave.</strong> Muestra los vecinos OSPF formados. Si no aparece ningún vecino, hay un problema de configuración (hello/dead timers, area, o autenticación).'},
    {cmd:'show ip route ospf',txt:'Muestra solo las rutas aprendidas via OSPF (marcadas con "O"). Si están aquí, OSPF está funcionando correctamente.'}
  ]);
}

function genSSH(){
  const h2=document.getElementById('ss-h').value||'SW1';
  const dom=document.getElementById('ss-dom').value||'empresa.local';
  const usr=document.getElementById('ss-u').value||'admin';
  const pas=document.getElementById('ss-p').value||'Cisco123';
  const sec=document.getElementById('ss-s').value||'Enable123';
  const mg=document.getElementById('ss-mg').value||'Vlan1';
  const ip=document.getElementById('ss-ip').value;
  const mk=document.getElementById('ss-mk').value||'255.255.255.0';
  let h='',t='';
  h+=`${C('! SSH + Seguridad — '+h2)}\n\n${P(h2,'>')}${K('enable')}\n${P(h2)}${K('configure terminal')}\n\n`;t+=`${h2}> enable\n${h2}# configure terminal\n\n`;
  h+=`${C('! PASO 1: Identidad del dispositivo (requerida para SSH)')}\n${M(h2+'(config)#')} ${K('hostname')} ${V(h2)}\n${M(h2+'(config)#')} ${K('ip domain-name')} ${V(dom)}\n\n`;t+=`${h2}(config)# hostname ${h2}\n${h2}(config)# ip domain-name ${dom}\n\n`;
  h+=`${C('! PASO 2: Contraseñas')}\n${M(h2+'(config)#')} ${K('enable secret')} ${V(sec)}\n${M(h2+'(config)#')} ${K('username')} ${V(usr)} ${K('privilege 15 secret')} ${V(pas)}\n\n`;t+=`${h2}(config)# enable secret ${sec}\n${h2}(config)# username ${usr} privilege 15 secret ${pas}\n\n`;
  h+=`${C('! PASO 3: Generar claves RSA (mínimo 2048 bits para SSHv2)')}\n${M(h2+'(config)#')} ${K('crypto key generate rsa modulus')} ${V('2048')}\n\n`;t+=`${h2}(config)# crypto key generate rsa modulus 2048\n\n`;
  h+=`${C('! PASO 4: Configurar SSH versión 2')}\n${M(h2+'(config)#')} ${K('ip ssh version')} ${V('2')}\n${M(h2+'(config)#')} ${K('ip ssh time-out')} ${V('60')}\n${M(h2+'(config)#')} ${K('ip ssh authentication-retries')} ${V('3')}\n\n`;t+=`${h2}(config)# ip ssh version 2\n${h2}(config)# ip ssh time-out 60\n${h2}(config)# ip ssh authentication-retries 3\n\n`;
  h+=`${C('! PASO 5: Líneas VTY — solo SSH')}\n${M(h2+'(config)#')} ${K('line vty 0 15')}\n${M(h2+'(config-line)#')} ${K('transport input ssh')}\n${M(h2+'(config-line)#')} ${K('login local')}\n${M(h2+'(config-line)#')} ${K('exec-timeout 5 0')}\n${M(h2+'(config-line)#')} ${K('exit')}\n\n`;t+=`${h2}(config)# line vty 0 15\n${h2}(config-line)# transport input ssh\n${h2}(config-line)# login local\n${h2}(config-line)# exec-timeout 5 0\n${h2}(config-line)# exit\n\n`;
  h+=`${C('! PASO 6: Consola')}\n${M(h2+'(config)#')} ${K('line console 0')}\n${M(h2+'(config-line)#')} ${K('login local')}\n${M(h2+'(config-line)#')} ${K('exec-timeout 5 0')}\n${M(h2+'(config-line)#')} ${K('exit')}\n\n`;
  if(ip){h+=`${C('! PASO 7: IP de gestión')}\n${M(h2+'(config)#')} ${K('interface')} ${V(mg)}\n${M(h2+'(config-if)#')} ${K('ip address')} ${V(ip)} ${V(mk)}\n${M(h2+'(config-if)#')} ${K('no shutdown')}\n${M(h2+'(config-if)#')} ${K('exit')}\n\n`;t+=`${h2}(config)# interface ${mg}\n${h2}(config-if)# ip address ${ip} ${mk}\n${h2}(config-if)# no shutdown\n${h2}(config-if)# exit\n\n`;}
  h+=`${M(h2+'(config)#')} ${K('service password-encryption')}\n${M(h2+'(config)#')} ${K('end')}\n${P(h2)}${K('write memory')}\n\n${C('! VERIFICAR')}\n${P(h2)}${K('show ip ssh')}\n${P(h2)}${K('show users')}`;
  t+=`${h2}(config)# service password-encryption\n${h2}(config)# end\n${h2}# write memory\n\n${h2}# show ip ssh\n${h2}# show users`;
  showCLI(h,t,[
    {cmd:'hostname',txt:'Define el nombre del dispositivo. <strong>Requerido para SSH</strong> — el hostname más el domain-name forman el nombre FQDN usado para generar las claves.'},
    {cmd:'ip domain-name',txt:'El dominio. Junto con el hostname forma el FQDN (ej. SW1.empresa.local). <strong>SSH no funcionará sin este comando.</strong>'},
    {cmd:'enable secret',txt:'Contraseña cifrada (MD5/SHA) para el modo privilegiado. Siempre usa <strong>secret</strong> en lugar de <strong>password</strong> — password guarda en texto plano.'},
    {cmd:'username [user] privilege 15 secret [pass]',txt:'Crea un usuario local con nivel de privilegio máximo (15 = acceso total). Con <strong>login local</strong> en las VTY, este usuario podrá hacer SSH.'},
    {cmd:'crypto key generate rsa modulus 2048',txt:'<strong>Genera el par de claves RSA</strong> para cifrar las sesiones SSH. Con 2048 bits se habilita automáticamente SSH versión 2. En Packet Tracer puede tardar unos segundos.'},
    {cmd:'ip ssh version 2',txt:'Fuerza SSHv2 únicamente. SSHv1 tiene vulnerabilidades conocidas y no debe usarse.'},
    {cmd:'transport input ssh',txt:'<strong>El comando más importante de seguridad.</strong> Deshabilita Telnet en las VTY y solo permite SSH. Sin esto, cualquiera podría conectarse con Telnet y ver la contraseña en texto plano.'},
    {cmd:'exec-timeout 5 0',txt:'Cierra la sesión después de <strong>5 minutos</strong> de inactividad. Formato: minutos segundos. Evita que sesiones olvidadas queden abiertas.'},
    {cmd:'service password-encryption',txt:'Cifra todas las contraseñas que aparecen en el <code>show running-config</code>. Protección básica pero mejor que nada.'}
  ]);
}

// ─── INIT ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded',()=>{
  // Set initial octets
  document.getElementById('o1').value=192;
  document.getElementById('o2').value=168;
  document.getElementById('o3').value=1;
  document.getElementById('o4').value=1;
  setCls('C',document.querySelector('#cls-tabs .cls-tab:nth-child(3)'));
  setV6Type('global', document.querySelector('.v6tcard'));
  renderForm('vlans');
});

// Override cpText to show toast on copy
const _cpOrig = cpText;
function cpText(txt, btn){
  const exec=()=>{const ta=document.createElement('textarea');ta.value=txt;document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);};
  try{navigator.clipboard.writeText(txt).catch(exec);}catch{exec();}
  if(btn){const o=btn.textContent;btn.textContent='✓ Copiado';btn.classList.add('ok');setTimeout(()=>{btn.textContent=o;btn.classList.remove('ok');},1500);}
}
