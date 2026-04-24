const SLIDES = [
  '¿Qué es una red?',
  'Dirección IP',
  'Sistema binario',
  'Clases IPv4',
  'Máscara de subred',
  'VLSM',
  'VLANs',
  'IPv6',
  'Resumen'
];
const N = SLIDES.length;
let cur = 0;

// ── NAV PIPS ──
function buildNav() {
  const nav = document.getElementById('step-nav');
  nav.innerHTML = '';
  SLIDES.forEach((name, i) => {
    if (i > 0) {
      const line = document.createElement('div');
      line.className = 'pip-line' + (i <= cur ? ' done' : '');
      nav.appendChild(line);
    }
    const pip = document.createElement('div');
    pip.className = 'step-pip' + (i < cur ? ' done' : i === cur ? ' active' : '');
    pip.textContent = i + 1;
    pip.title = name;
    pip.onclick = () => goTo(i);
    nav.appendChild(pip);
  });
}

function goTo(i) {
  document.getElementById('s' + cur).classList.remove('active');
  cur = Math.max(0, Math.min(N - 1, i));
  document.getElementById('s' + cur).classList.add('active');
  buildNav();
  document.getElementById('prog-label').textContent = (cur + 1) + ' / ' + N;
  document.getElementById('slide-name-lbl').textContent = SLIDES[cur];
  document.getElementById('btn-prev').disabled = cur === 0;
  document.getElementById('btn-next').textContent = cur === N - 1 ? '🎉 Completado' : 'Siguiente →';
  document.getElementById('btn-next').disabled = cur === N - 1;
  document.getElementById('prog-bar').style.width = ((cur + 1) / N * 100) + '%';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function changeSlide(d) { goTo(cur + d); }
buildNav();

// ── SLIDE 1: OCTETS ──
const octData = [
  { v: '192', msg: '<strong>Primer octeto: 192</strong><br>Empieza con 192 → es una dirección de <strong>Clase C</strong>, usada para redes pequeñas como la de una empresa. El rango 192.168.x.x es privado (RFC 1918) — no sale a Internet.' },
  { v: '168', msg: '<strong>Segundo octeto: 168</strong><br>Junto con el primer octeto forma <strong>192.168</strong>, confirmando que es una IP privada Clase C. Podría ser 192.168.0.x, 192.168.1.x, 192.168.2.x... hasta 192.168.255.x (256 redes distintas).' },
  { v: '1',   msg: '<strong>Tercer octeto: 1</strong><br>Identifica la <strong>red específica</strong> dentro del bloque 192.168. Enter Ltda. usa la red .1 (192.168.1.0/24). Si hubiera otra sede, podría usar 192.168.2.0/24, 192.168.3.0/24, etc.' },
  { v: '10',  msg: '<strong>Cuarto octeto: 10</strong><br>Es el <strong>número del dispositivo</strong> dentro de esa red. El .1 está reservado para el gateway (router). Los dispositivos van del .2 al .254. El .0 es la dirección de red y el .255 es el broadcast.' }
];
function showOctet(i) {
  document.querySelectorAll('.octet-btn').forEach((b, j) => b.classList.toggle('active', j === i));
  document.getElementById('oct-info').innerHTML = octData[i].msg;
}

// ── SLIDE 2: BITS ──
const bitVals = [128, 64, 32, 16, 8, 4, 2, 1];
let bits = [1, 1, 0, 0, 0, 0, 0, 0];
(function initBits() {
  const lbl = document.getElementById('bit-labels');
  bitVals.forEach(v => {
    const d = document.createElement('div');
    d.className = 'bit-lbl';
    d.textContent = v;
    lbl.appendChild(d);
  });
  renderBits();
})();
function renderBits() {
  const row = document.getElementById('bits-row');
  row.innerHTML = '';
  bits.forEach((b, i) => {
    const d = document.createElement('div');
    d.className = 'bit ' + (b ? 'on' : 'off');
    d.textContent = b;
    d.onclick = () => { bits[i] = 1 - bits[i]; renderBits(); };
    row.appendChild(d);
  });
  const v = bits.reduce((s, b, i) => s + b * bitVals[i], 0);
  document.getElementById('bin-val').textContent = v;
  document.getElementById('bin-str').textContent = bits.join('');
}

// ── SLIDE 3: CLASSES ──
const classInfo = {
  A: '<strong>Clase A (1.0.0.0 – 126.255.255.255)</strong><br>Máscara por defecto: /8 (255.0.0.0)<br>Redes posibles: 126 · Hosts por red: 16.777.214<br>Primer bit siempre en 0 (0xxxxxxx)<br>Uso: Grandes corporaciones, gobiernos, ISPs — prácticamente todas ocupadas.',
  B: '<strong>Clase B (128.0.0.0 – 191.255.255.255)</strong><br>Máscara por defecto: /16 (255.255.0.0)<br>Redes posibles: 16.384 · Hosts por red: 65.534<br>Primeros 2 bits: 10xxxxxx<br>Uso: Medianas y grandes empresas, universidades.',
  C: '<strong>Clase C (192.0.0.0 – 223.255.255.255)</strong><br>Máscara por defecto: /24 (255.255.255.0)<br>Redes posibles: 2.097.152 · Hosts por red: 254<br>Primeros 3 bits: 110xxxxx<br>Uso: Redes pequeñas y medianas. <strong>← Enter Ltda. usa 192.168.1.0 de esta clase.</strong>',
  D: '<strong>Clase D (224.0.0.0 – 239.255.255.255)</strong><br>No tiene máscara de subred estándar.<br>Primeros 4 bits: 1110xxxx<br>Uso: Multicast — transmisiones simultáneas a múltiples destinos. Ejemplo: OSPF hello packets (224.0.0.5), streaming de video.',
  E: '<strong>Clase E (240.0.0.0 – 255.255.255.255)</strong><br>No tiene máscara de subred estándar.<br>Primeros 4 bits: 1111xxxx<br>Uso: Reservada para investigación y uso experimental. No se utiliza en redes comerciales ni en esta práctica.'
};
function selectClass(c, el) {
  document.querySelectorAll('.class-seg').forEach(s => s.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('class-detail').innerHTML = classInfo[c];
}

// ── SLIDE 4: MASK ──
function showMask(n, btn) {
  document.querySelectorAll('.prefix-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  const table = document.getElementById('mask-table');
  table.innerHTML = '';
  const makeRow = (label, bitsArr, classFn) => {
    const row = document.createElement('div'); row.className = 'mask-row';
    const lbl = document.createElement('div'); lbl.className = 'mask-lbl'; lbl.textContent = label;
    const bits = document.createElement('div'); bits.className = 'mask-bits';
    bitsArr.forEach((b, i) => {
      if (i > 0 && i % 8 === 0) { const gap = document.createElement('div'); gap.className = 'mask-oct-gap'; bits.appendChild(gap); }
      const d = document.createElement('div');
      d.className = 'mbit ' + classFn(i, b);
      d.textContent = b;
      bits.appendChild(d);
    });
    row.appendChild(lbl); row.appendChild(bits); table.appendChild(row);
  };
  const maskBits = Array(32).fill(0).map((_, i) => i < n ? 1 : 0);
  const ipBits   = [1,1,0,0,0,0,0,0, 1,0,1,0,1,0,0,0, 0,0,0,0,0,0,0,1, 0,0,0,0,1,0,1,0];
  makeRow('IP:', ipBits, () => 'net');
  makeRow('Máscara:', maskBits, (i) => i < n ? 'net' : 'host');
  const hb = 32 - n;
  const hosts = Math.pow(2, hb) - 2;
  document.getElementById('mask-info').innerHTML =
    `Prefijo <strong>/${n}</strong>: <span style="color:var(--blue)">■ ${n} bits de RED</span> + <span style="color:var(--green)">■ ${hb} bits de HOST</span><br>` +
    `Hosts útiles: 2<sup>${hb}</sup> − 2 = <strong>${hosts > 0 ? hosts.toLocaleString('es-CO') : '—'}</strong>`;
  ['tr25','tr26','tr27'].forEach(id => { const el = document.getElementById(id); if (el) el.classList.toggle('hl', (id==='tr25'&&n===25)||(id==='tr26'&&n===26)||(id==='tr27'&&n===27)); });
}
setTimeout(() => showMask(8, document.querySelector('.prefix-btn.active')), 10);

// ── SLIDE 5: VLSM ──
const vlsmData = [
  { vlan: 'VLAN 40 — Visitantes', pref: '/25', mask: '255.255.255.128', net: '192.168.1.0', gw: '192.168.1.1', bc: '192.168.1.127', hosts: '126', why: 'Necesita 100 hosts. Formula: 2⁷ = 128, menos 2 = 126 ✓ — Va primero porque es la más grande.' },
  { vlan: 'VLAN 20 — Financiera', pref: '/26', mask: '255.255.255.192', net: '192.168.1.128', gw: '192.168.1.129', bc: '192.168.1.191', hosts: '62', why: 'Necesita 50 hosts. Fórmula: 2⁶ = 64, menos 2 = 62 ✓ — Empieza justo donde terminó VLAN 40 (.128).' },
  { vlan: 'VLAN 10 — Administrativa', pref: '/27', mask: '255.255.255.224', net: '192.168.1.192', gw: '192.168.1.193', bc: '192.168.1.223', hosts: '30', why: 'Necesita 20 hosts. Fórmula: 2⁵ = 32, menos 2 = 30 ✓ — Empieza donde terminó VLAN 20 (.192).' },
  { vlan: 'VLAN 30 — Técnicos', pref: '/27', mask: '255.255.255.224', net: '192.168.1.224', gw: '192.168.1.225', bc: '192.168.1.255', hosts: '30', why: 'Necesita 20 hosts. Mismo prefijo que Admin. Empieza donde terminó VLAN 10 (.224). Llega hasta .255, cerrando el /24.' }
];
function showVlsm(i, el) {
  document.querySelectorAll('.vlsm-seg').forEach(s => s.classList.remove('active'));
  if (el) el.classList.add('active');
  const d = vlsmData[i];
  document.getElementById('vlsm-info').innerHTML =
    `<strong>${d.vlan}</strong> · Prefijo: <code>${d.pref}</code> · Máscara: <code>${d.mask}</code><br>` +
    `Red: <strong>${d.net}</strong> &nbsp;·&nbsp; Gateway: <strong>${d.gw}</strong> &nbsp;·&nbsp; Broadcast: <strong>${d.bc}</strong><br>` +
    `Hosts útiles: <strong>${d.hosts}</strong><br><br><em style="color:var(--text3)">${d.why}</em>`;
}
const stepData = [
  { t: '1. Ordenar de mayor a menor', c: 'Siempre empieza por la VLAN que tiene más hosts:<br><strong>Visitantes (100) → Financiera (50) → Administrativa (20) → Técnicos (20)</strong><br><br>Si empiezas por las más pequeñas, no tendrás espacio continuo para las grandes.' },
  { t: '2. Calcular el prefijo necesario', c: 'Para cada VLAN encuentra el menor <em>n</em> tal que <code>2ⁿ ≥ hosts + 2</code><br><br>Visitantes: 2ⁿ ≥ 102 → <code>2⁷ = 128 ✓</code> → <strong>/25</strong><br>Financiera: 2ⁿ ≥ 52 → <code>2⁶ = 64 ✓</code> → <strong>/26</strong><br>Adm/Técn: 2ⁿ ≥ 22 → <code>2⁵ = 32 ✓</code> → <strong>/27</strong>' },
  { t: '3. Asignar la dirección de red', c: 'La primera subred empieza en la dirección base. Cada siguiente subred empieza <strong>justo después del broadcast de la anterior</strong>:<br><br>VLAN 40: <code>192.168.1.<strong>0</strong>/25</code><br>VLAN 20: <code>192.168.1.<strong>128</strong>/26</code><br>VLAN 10: <code>192.168.1.<strong>192</strong>/27</code><br>VLAN 30: <code>192.168.1.<strong>224</strong>/27</code>' },
  { t: '4. Identificar el gateway', c: 'El gateway es la <strong>primera IP útil</strong> = dirección de red + 1. Este IP se configura en la subinterfaz del router:<br><br>VLAN 40: <code>192.168.1.<strong>1</strong></code> &nbsp; VLAN 20: <code>192.168.1.<strong>129</strong></code><br>VLAN 10: <code>192.168.1.<strong>193</strong></code> &nbsp; VLAN 30: <code>192.168.1.<strong>225</strong></code><br><br>Configura el gateway en R1: <code>ip address 192.168.1.1 255.255.255.128</code>' },
  { t: '5. Identificar el broadcast', c: 'El broadcast es la <strong>última IP del rango</strong>. No se asigna a ningún dispositivo:<br><br>VLAN 40: <code>192.168.1.<strong>127</strong></code> &nbsp; VLAN 20: <code>192.168.1.<strong>191</strong></code><br>VLAN 10: <code>192.168.1.<strong>223</strong></code> &nbsp; VLAN 30: <code>192.168.1.<strong>255</strong></code><br><br>Tip: broadcast = siguiente red − 1. Ej: VLAN 40 termina en .127 porque VLAN 20 empieza en .128.' }
];
function showStep(i, el) {
  document.querySelectorAll('.step-pill').forEach(p => p.classList.remove('active'));
  if (el) el.classList.add('active');
  document.getElementById('step-content').innerHTML = stepData[i].c;
}
setTimeout(() => showStep(0, document.querySelector('.step-pill')), 10);

// ── SLIDE 6: VLANs ──
const vlanInfo = {
  10: '<strong style="color:#22d3ee">VLAN 10 — Administrativa · 20 hosts</strong><br>IP de red: <code>192.168.1.192/27</code> · Máscara: <code>255.255.255.224</code><br>Gateway: <code>192.168.1.193</code> · Broadcast: <code>192.168.1.223</code><br>IPs de dispositivos: 192.168.1.194 – 192.168.1.222<br><br>Solo personal administrativo y gerencial. Aislada de visitantes y otras áreas.',
  20: '<strong style="color:#a78bfa">VLAN 20 — Financiera · 50 hosts</strong><br>IP de red: <code>192.168.1.128/26</code> · Máscara: <code>255.255.255.192</code><br>Gateway: <code>192.168.1.129</code> · Broadcast: <code>192.168.1.191</code><br>IPs de dispositivos: 192.168.1.130 – 192.168.1.190<br><br>Contabilidad, tesorería, presupuesto. Nadie externo puede interceptar sus transacciones.',
  30: '<strong style="color:#34d399">VLAN 30 — Técnicos · 20 hosts</strong><br>IP de red: <code>192.168.1.224/27</code> · Máscara: <code>255.255.255.224</code><br>Gateway: <code>192.168.1.225</code> · Broadcast: <code>192.168.1.255</code><br>IPs de dispositivos: 192.168.1.226 – 192.168.1.254<br><br>Equipo de TI, acceso a servidores y equipos de red. Aislados por seguridad.',
  40: '<strong style="color:#fb923c">VLAN 40 — Visitantes · 100 hosts</strong><br>IP de red: <code>192.168.1.0/25</code> · Máscara: <code>255.255.255.128</code><br>Gateway: <code>192.168.1.1</code> · Broadcast: <code>192.168.1.127</code><br>IPs de dispositivos: 192.168.1.2 – 192.168.1.126<br><br>Solo acceso a Internet. NUNCA pueden ver recursos internos de la empresa.'
};
function showVlan(n, el) {
  document.querySelectorAll('.vlan-floor').forEach(f => f.classList.remove('active'));
  if (el) el.classList.add('active');
  document.getElementById('vlan-info').innerHTML = vlanInfo[n];
}

// ── SLIDE 7: IPv6 ──
const ipv6Data = [
  '<strong style="color:var(--blue)">Prefijo global — parte 1 (grupo 1/3)</strong><br>El grupo <code>2001</code> indica que esta dirección pertenece al espacio de Internet global. Es como el "código de país" en una dirección postal.',
  '<strong style="color:var(--blue)">Prefijo global — parte 2 (grupo 2/3)</strong><br>El grupo <code>0DB8</code> (abreviado: <code>DB8</code>) es el prefijo de documentación y práctica (RFC 3849). En una red real, aquí iría el bloque asignado por el proveedor.',
  '<strong style="color:var(--blue)">Prefijo global — parte 3 (grupo 3/3)</strong><br>El grupo <code>ACAD</code> completa el prefijo /48 de la empresa. Juntos los 3 grupos forman: <code>2001:DB8:ACAD</code> — el bloque completo de Enter Ltda.',
  '<strong style="color:var(--green)">ID de subred / VLAN (grupo 4)</strong><br>Este grupo de 16 bits identifica la VLAN o subred. Usamos el número de VLAN:<br>VLAN 10 → <code>0010</code> · VLAN 20 → <code>0020</code> · VLAN 30 → <code>0030</code> · VLAN 40 → <code>0040</code><br>Con 16 bits podemos tener hasta 65.536 subredes.',
  '<strong style="color:var(--purple)">ID de interfaz — inicio (grupo 5/8)</strong><br>Los últimos 4 grupos (64 bits) identifican el dispositivo. Para el gateway usamos <code>::1</code> (el resto son ceros). Un PC puede generar su propio ID automáticamente con SLAAC.',
  '<strong style="color:var(--purple)">ID de interfaz (grupo 6/8)</strong><br>Continúa el identificador del dispositivo. Cuando hay grupos consecutivos de solo ceros, se comprimen con <code>::</code> en la notación corta. Por eso el gateway se escribe <code>2001:DB8:ACAD:10::1</code>.',
  '<strong style="color:var(--purple)">ID de interfaz (grupo 7/8)</strong><br>Sigue el ID. Los cuatro grupos de ceros (grupos 5-8, excepto el último) se comprimen. La dirección completa <code>2001:0DB8:ACAD:0010:0000:0000:0000:0001</code> se abrevia a <code>2001:DB8:ACAD:10::1</code>.',
  '<strong style="color:var(--purple)">ID de interfaz — final (grupo 8/8)</strong><br>El grupo <code>0001</code> indica que es el <strong>gateway</strong> de esa VLAN (primera dirección útil). La dirección completa y abreviada del gateway de VLAN 10: <code>2001:DB8:ACAD:10::1/64</code>'
];
function showIPv6(i) {
  document.getElementById('ipv6-info').innerHTML = ipv6Data[i];
}
