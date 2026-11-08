// ================================================================
//  TCP MULTIMODEL SIMULATOR — main.js
//  AFD + Red de Petri + Autómata a Pila (AFP) + Máquina de Turing (MT)
// ================================================================

// ─── CARGA DE COMPONENTES ────────────────────────────────────────
async function iniciarApp() {
  const app = document.getElementById('app');
  const componentes = [
    'components/header.html',
    'components/definitions.html',
    'components/simulator-ui.html',
    'components/properties.html'
  ];
  try {
    const htmls = await Promise.all(componentes.map(u => fetch(u).then(r => r.text())));
    document.getElementById('loading-screen').style.opacity = '0';
    setTimeout(() => { 
      app.innerHTML = htmls.join('\n'); 
      iniciarCanvas(); 
      iniciarSimulador(); 
    }, 420);
  } catch(e) {
    app.innerHTML = `<div style="padding:4rem;text-align:center;font-family:monospace;color:#f85149">
      Error cargando componentes.<br><small style="color:#8b949e">Usa un servidor local: python -m http.server 8080</small></div>`;
  }
}

// ─── CANVAS PARTÍCULAS ───────────────────────────────────────────
function iniciarCanvas() {
  const canvas = document.getElementById('canvas-fondo');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
  resize(); window.addEventListener('resize', resize);
  const pts = Array.from({length:55}, () => ({
    x: Math.random()*canvas.width, y: Math.random()*canvas.height,
    r: Math.random()*1.4+0.3,
    vx: (Math.random()-.5)*.22, vy: (Math.random()-.5)*.22,
    color: ['#388bfd','#3fb950','#d29922','#bc8cff','#ffab70'][Math.floor(Math.random()*5)]
  }));
  (function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    pts.forEach(p => {
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle = p.color; ctx.fill();
      p.x+=p.vx; p.y+=p.vy;
      if(p.x<0) p.x=canvas.width; if(p.x>canvas.width) p.x=0;
      if(p.y<0) p.y=canvas.height; if(p.y>canvas.height) p.y=0;
    });
    requestAnimationFrame(draw);
  })();
}

// ─── POSICIONES SVG DE NODOS ─────────────────────────────────────
const POS = {
  // FSM Cliente
  'ec-cerrado':  { x:94,  y:88  },
  'ec-synenv':   { x:94,  y:208 },
  'ec-estab':    { x:94,  y:338 },
  'ec-fin':      { x:94,  y:450 },
  // FSM Servidor
  'es-escucha':  { x:906, y:88  },
  'es-synrec':   { x:906, y:248 },
  'es-estab':    { x:906, y:368 },
  'es-cerrando': { x:906, y:458 },
  // Plazas PN
  'pn-bufc':     { x:260, y:88  },
  'tr-env-syn':  { x:376, y:88  },
  'pn-syn':      { x:470, y:88  },
  'tr-ent-syn':  { x:576, y:88  },
  'pn-bufs':     { x:670, y:88  },
  'tr-env-sack': { x:660, y:248 },
  'pn-synack':   { x:530, y:248 },
  'tr-ent-sack': { x:380, y:248 },
  'pn-bufc2':    { x:260, y:248 },
  'tr-env-ack':  { x:316, y:368 },
  'pn-ack':      { x:440, y:368 },
  'tr-ent-ack':  { x:566, y:368 },
  'pn-perdido':  { x:470, y:458 },
  // Waypoints visuales para animaciones por aristas curvas
  'pto-inhibidor': { x:470, y:300 },
  'pto-to-c1':   { x:40,  y:195 },
  'pto-to-c2':   { x:32,  y:148 },
  'pto-to-c3':   { x:40,  y:100 },
  'pto-to-s1':   { x:960, y:235 },
  'pto-to-s2':   { x:968, y:168 },
  'pto-to-s3':   { x:960, y:100 },
};

// ─── ANIMACIÓN FLUIDA DE TOKEN ────────────────────────────────────
function animarToken(viajesData, color = '#f78166', baseDur = 420) {
  const svg = document.getElementById('diagrama-principal');
  if (!svg || !viajesData) return Promise.resolve();

  const speedMult = window.sim ? (window.sim.velocidad || 1) : 1;
  const durPorSegmento = baseDur / speedMult;

  const viajes = (viajesData.length > 0 && Array.isArray(viajesData[0])) ? viajesData : [viajesData];

  const animaciones = viajes.map(waypoints => {
    return new Promise(resolve => {
      if (waypoints.length < 2) { resolve(); return; }

      const NS = 'http://www.w3.org/2000/svg';
      const circ = document.createElementNS(NS, 'circle');
      circ.setAttribute('r', '8');
      circ.setAttribute('fill', color);
      circ.style.filter = `drop-shadow(0 0 8px ${color})`;
      circ.style.pointerEvents = 'none';
      circ.classList.add('token-viajero');
      
      const p0 = POS[waypoints[0]];
      if (!p0) { resolve(); return; }
      circ.setAttribute('cx', p0.x); circ.setAttribute('cy', p0.y);
      svg.appendChild(circ);

      let segmento = 0;

      function animarSegmento() {
        if (segmento >= waypoints.length - 1) { 
           if(svg.contains(circ)) svg.removeChild(circ); 
           resolve(); 
           return; 
        }
        const origen  = POS[waypoints[segmento]];
        const destino = POS[waypoints[segmento + 1]];
        if (!origen || !destino) { segmento++; animarSegmento(); return; }
        const inicio = performance.now();

        const midId = waypoints[segmento + 1];
        if (midId && midId.startsWith('tr-')) {
          const el = document.getElementById(midId);
          if (el) {
            el.style.filter = 'drop-shadow(0 0 10px #d29922) brightness(2)';
            setTimeout(() => { if(el) el.style.filter = 'none'; }, durPorSegmento * 0.8);
          }
        }

        (function frame(now) {
          const t = Math.min((now - inicio) / durPorSegmento, 1);
          const e = t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2;
          circ.setAttribute('cx', origen.x + (destino.x - origen.x) * e);
          circ.setAttribute('cy', origen.y + (destino.y - origen.y) * e);
          const s = 8 + Math.sin(t * Math.PI) * 3;
          circ.setAttribute('r', s.toFixed(1));
          if (t < 1) { requestAnimationFrame(frame); }
          else { segmento++; animarSegmento(); }
        })(inicio);
      }
      animarSegmento();
    });
  });

  return Promise.all(animaciones);
}

// ─── ESCENARIOS MULTIMODELO (AFD + PETRI + AFP + TURING) ───────────
const ESCENARIOS = {
  normal: [
    {
      titulo: 'Estado Inicial',
      desc: 'Sistema en reposo. M₀(p)=0 ∀p ∈ P. Cliente en CERRADO, Servidor en ESCUCHA.',
      cliente:'CERRADO', servidor:'ESCUCHA', tokens:{}, trans:null,
      formula:'M₀(p)=0 ∀p', color:'#f78166', viaje: null,
      log:{tipo:'info', msg:'SIM INIT — 4 Modelos Formales en Estado Base'},
      afp: {
        estado: 'q₀', op: 'NOOP', tope: 'Z₀', pila: ['Z₀'],
        formula: 'M_AFP = (Q_P, Σ, Γ, δ_P, q₀, Z₀, {q_acc})',
        desc: 'Pila de memoria LIFO vacía con símbolo de fondo Z₀. Esperando trama de aplicación.'
      },
      turing: {
        estado: 'q₀', pos: 0, action: 'READY',
        cinta: ['B', 'S', 'Y', 'N', 'B', 'B', 'B', 'B'],
        formula: 'M_MT = (Q_MT, Σ, Γ, δ_MT, q₀, B, {q_halt})',
        desc: 'Cabezal sobre celda 0 (B). Cadena de control "SYN" cargada en cinta lista para procesar.'
      }
    },
    {
      titulo:'Paso 1 — Cliente inicia conexión',
      desc:'δ_C(CERRADO, iniciar_conexion) → SYN-ENVIADO. Token depositado en p_buf_C.',
      cliente:'SYN-ENVIADO', servidor:'ESCUCHA', tokens:{'tk-bufc':true}, trans:null,
      formula:'M(p_buf_C)=1', viaje: ['ec-cerrado','pn-bufc'],
      log:{tipo:'ok', msg:'[SYN] generado → AFP apila delimitador estructural "{"'},
      afp: {
        estado: 'q₁', op: 'PUSH "{"', tope: '{"', pila: ['Z₀', '{'],
        formula: 'δ(q₀, "{", Z₀) = (q₁, "{Z₀}")',
        desc: 'Capa de aplicación (L7) abre bloque estructural: apila "{" en la memoria LIFO.'
      },
      turing: {
        estado: 'q_cifrar', pos: 1, action: 'MOVE R',
        cinta: ['B', 'S', 'Y', 'N', 'B', 'B', 'B', 'B'],
        formula: 'δ(q₀, "B") = (q_cifrar, "B", R)',
        desc: 'Cabezal de Turing avanza a celda 1 para leer y cifrar el primer símbolo "S".'
      }
    },
    {
      titulo:'Paso 2 — enviar_SYN dispara',
      desc:'Habilitada: M(p_buf_C)≥1. Disparo: M(p_buf_C)=0, M(p_SYN)=1. SYN en tránsito.',
      cliente:'SYN-ENVIADO', servidor:'ESCUCHA', tokens:{'tk-syn':true}, trans:'tr-env-syn',
      formula:"M'=M−W(p,t)+W(t,p)", viaje: ['pn-bufc','tr-env-syn','pn-syn'],
      log:{tipo:'token', msg:'env_SYN disparada → MT cifra byte "S" → "S*"'},
      afp: {
        estado: 'q₁', op: 'PUSH "SYN"', tope: 'SYN', pila: ['Z₀', '{', 'SYN'],
        formula: 'δ(q₁, "SYN", "{") = (q₁, "SYN{Z₀}")',
        desc: 'El AFP apila el identificador del segmento SYN a la espera del acuse de recibo.'
      },
      turing: {
        estado: 'q_cifrar', pos: 2, action: 'WRITE S*',
        cinta: ['B', 'S*', 'Y', 'N', 'B', 'B', 'B', 'B'],
        formula: 'δ(q_cifrar, "S") = (q_cifrar, "S*", R)',
        desc: 'La MT aplica transformación criptográfica: escribe "S*" en cinta y avanza a celda 2.'
      }
    },
    {
      titulo:'Paso 3 — entregar_SYN dispara',
      desc:'Habilitada: M(p_SYN)≥1 ∧ ¬M(p_perdido). Disparo: M(p_SYN)=0, M(p_buf_S)=1.',
      cliente:'SYN-ENVIADO', servidor:'ESCUCHA', tokens:{'tk-bufs':true}, trans:'tr-ent-syn',
      formula:'ent_SYN: M(p_SYN)≥1 ∧ ¬M(p_perd)', viaje: ['pn-syn','tr-ent-syn','pn-bufs'],
      log:{tipo:'token', msg:'ent_SYN disparada → MT cifra byte "Y" → "Y*"'},
      afp: {
        estado: 'q₁', op: 'NOOP', tope: 'SYN', pila: ['Z₀', '{', 'SYN'],
        formula: 'δ(q₁, ε, "SYN") = (q₁, "SYN")',
        desc: 'El segmento llega al buffer del servidor; la pila conserva el contexto de sesión.'
      },
      turing: {
        estado: 'q_cifrar', pos: 3, action: 'WRITE Y*',
        cinta: ['B', 'S*', 'Y*', 'N', 'B', 'B', 'B', 'B'],
        formula: 'δ(q_cifrar, "Y") = (q_cifrar, "Y*", R)',
        desc: 'La MT cifra el segundo símbolo: escribe "Y*" y traslada el cabezal a la celda 3.'
      }
    },
    {
      titulo:'Paso 4 — Servidor recibe SYN',
      desc:'δ_S(ESCUCHA, rcv_SYN) → SYN-RECIBIDO. Servidor coloca SYNACK en p_SYNACK.',
      cliente:'SYN-ENVIADO', servidor:'SYN-RECIBIDO', tokens:{'tk-synack':true}, trans:null,
      formula:'δ_S(ESCUCHA,rcvSYN)=SYN-REC', viaje: ['pn-bufs','es-escucha','es-synrec','tr-env-sack','pn-synack'],
      log:{tipo:'ok', msg:'[SYN] procesado → AFP intercambia contexto a espera de SACK'},
      afp: {
        estado: 'q_ack', op: 'POP SYN / PUSH SACK', tope: 'SACK', pila: ['Z₀', '{', 'SACK'],
        formula: 'δ(q₁, "rcv_SYN", "SYN") = (q_ack, "SACK")',
        desc: 'El servidor valida SYN: desapila "SYN" y apila el testigo del paquete de respuesta "SACK".'
      },
      turing: {
        estado: 'q_write', pos: 4, action: 'WRITE N*',
        cinta: ['B', 'S*', 'Y*', 'N*', 'B', 'B', 'B', 'B'],
        formula: 'δ(q_cifrar, "N") = (q_write, "N*", R)',
        desc: 'MT completa firma de cabecera ("S*Y*N*"). Ahora escribe delimitador de respuesta.'
      }
    },
    {
      titulo:'Paso 5 — entregar_SYNACK dispara',
      desc:'SYNACK viaja por el canal. Disparo ent_SYNACK: token llega a p_buf_C₂. Cliente recibirá SYNACK.',
      cliente:'SYN-ENVIADO', servidor:'SYN-RECIBIDO', tokens:{'tk-bufc2':true}, trans:'tr-ent-sack',
      formula:'Concurrencia: P(SYN)∩P(SYNACK)=∅', viaje: ['pn-synack','tr-ent-sack','pn-bufc2'],
      log:{tipo:'token', msg:'ent_SYNACK disparada → MT verifica firma en retroceso'},
      afp: {
        estado: 'q_ack', op: 'NOOP', tope: 'SACK', pila: ['Z₀', '{', 'SACK'],
        formula: 'δ(q_ack, ε, "SACK") = (q_ack, "SACK")',
        desc: 'Segmento SYN-ACK entregado a buffer de recepción del Cliente; pila en espera activa.'
      },
      turing: {
        estado: 'q_verif', pos: 2, action: 'MOVE L',
        cinta: ['B', 'S*', 'A*', 'C*', 'K*', 'B', 'B', 'B'],
        formula: 'δ(q_write, "B") = (q_verif, "B", L)',
        desc: 'MT conmuta a modo verificación: cabezal se desplaza a la izquierda auditando la cinta.'
      }
    },
    {
      titulo:'Paso 6 — Cliente recibe SYNACK → ESTABLECIDO',
      desc:'δ_C(SYN-ENVIADO, rcv_SYNACK) → ESTABLECIDO. Cliente envía ACK. Token a p_ACK.',
      cliente:'ESTABLECIDO', servidor:'SYN-RECIBIDO', tokens:{'tk-ack':true}, trans:null,
      formula:'δ_C(SYN-ENV,rcvSYNACK)=ESTAB', viaje: ['pn-bufc2','ec-synenv','ec-estab','tr-env-ack','pn-ack'],
      log:{tipo:'ok', msg:'[SYNACK] recibido → AFP desapila SACK y prepara cierre "}"'},
      afp: {
        estado: 'q₂', op: 'POP SACK / PUSH "}"', tope: '}"', pila: ['Z₀', '{', '}'],
        formula: 'δ(q_ack, "rcv_SACK", "SACK") = (q₂, "}{")',
        desc: 'Cliente procesa acuse válido: desapila "SACK" y apila delimitador complementario "}".'
      },
      turing: {
        estado: 'q_verif', pos: 0, action: 'VERIF OK',
        cinta: ['#', 'S*', 'A*', 'C*', 'K*', '#', 'B', 'B'],
        formula: 'δ(q_verif, "S*") = (q_halt, "#", L)',
        desc: 'Firma mutua validada en cinta. MT sella delimitadores criptográficos "#" en los extremos.'
      }
    },
    {
      titulo:'Paso 7 — Handshake completo ✓',
      desc:'δ_S(SYN-RECIBIDO, rcv_ACK) → ESTABLECIDO. Ambos FSMs en ESTABLECIDO. Conexión TCP activa.',
      cliente:'ESTABLECIDO', servidor:'ESTABLECIDO', tokens:{}, trans:'tr-ent-ack',
      formula:'∃σ: A_C=ESTAB ∧ A_S=ESTAB', viaje: ['pn-ack','tr-ent-ack','es-estab'],
      log:{tipo:'ok', msg:'✓ HANDSHAKE COMPLETO — AFP y MT en Estados de Aceptación/Parada'},
      afp: {
        estado: 'q_acc', op: 'POP "}" → ACEPTACIÓN ✓', tope: 'Z₀', pila: ['Z₀'],
        formula: 'δ(q₂, "}", "{") = (q_acc, "Z₀")',
        desc: '¡Gramática L7 aceptada! Paréntesis balanceados { } consumidos. Pila limpia en Z₀ y estado q_acc.'
      },
      turing: {
        estado: 'q_halt', pos: 5, action: 'HALT ✓',
        cinta: ['#', 'O', 'K', '!', '!', '#', 'B', 'B'],
        formula: 'δ(q_halt, "#") = HALT (Éxito)',
        desc: '¡Máquina de Turing alcanza estado de parada final q_halt! Cómputo universal completado.'
      }
    }
  ],

  perdida: [
    {
      titulo:'Estado Inicial — Pérdida de Paquete',
      desc:'Escenario con canal con pérdida. La plaza inhibidora p_perdido bloqueará la entrega del SYN.',
      cliente:'CERRADO', servidor:'ESCUCHA', tokens:{}, trans:null,
      formula:'M₀(p)=0 ∀p', viaje:null,
      log:{tipo:'warn', msg:'ESCENARIO: pérdida de paquete'},
      afp: {
        estado: 'q₀', op: 'NOOP', tope: 'Z₀', pila: ['Z₀'],
        formula: 'M_AFP listo', desc: 'Pila en estado base esperando transmisión.'
      },
      turing: {
        estado: 'q₀', pos: 0, action: 'READY',
        cinta: ['B', 'S', 'Y', 'N', 'B', 'B', 'B', 'B'],
        formula: 'M_MT lista', desc: 'Cinta cargada para transmisión bajo canal no confiable.'
      }
    },
    {
      titulo:'Paso 1 — SYN enviado al canal',
      desc:'Cliente transiciona. Token SYN viaja por el canal: p_buf_C → env_SYN → p_SYN.',
      cliente:'SYN-ENVIADO', servidor:'ESCUCHA', tokens:{'tk-syn':true}, trans:'tr-env-syn',
      formula:'M(p_SYN)=1', viaje:['ec-cerrado','pn-bufc','tr-env-syn','pn-syn'],
      log:{tipo:'token', msg:'[SYN] en tránsito → AFP apila delimitador "{"'},
      afp: {
        estado: 'q₁', op: 'PUSH "{" / "SYN"', tope: 'SYN', pila: ['Z₀', '{', 'SYN'],
        formula: 'δ(q₀, "{", Z₀) = (q₁, "SYN{Z₀}")',
        desc: 'AFP almacena segmento SYN pendiente de validación.'
      },
      turing: {
        estado: 'q_cifrar', pos: 2, action: 'WRITE S*',
        cinta: ['B', 'S*', 'Y', 'N', 'B', 'B', 'B', 'B'],
        formula: 'δ(q₀, "S") = (q_cifrar, "S*", R)',
        desc: 'MT cifra datos en cinta antes de la inyección a la red.'
      }
    },
    {
      titulo:'Paso 2 — Paquete perdido',
      desc:'p_perdido se activa (M=1). ent_SYN queda inhabilitada (arco inhibidor). SYN nunca llega.',
      cliente:'SYN-ENVIADO', servidor:'ESCUCHA', tokens:{'tk-perdido':true}, trans:null,
      formula:'¬hab(ent_SYN): M(p_perd)=1', viaje:['pn-syn', 'tr-ent-syn', 'pto-inhibidor', 'pn-perdido'],
      log:{tipo:'error', msg:'✗ PAQUETE PERDIDO — MT entra en espera y AFP detecta retención'},
      afp: {
        estado: 'q_wait', op: 'HOLD', tope: 'SYN', pila: ['Z₀', '{', 'SYN'],
        formula: 'Timer activo en AFP',
        desc: 'El AFP detecta que el segmento no ha sido consumido; se activa temporizador sintáctico.'
      },
      turing: {
        estado: 'q_wait', pos: 2, action: 'WAIT ACK',
        cinta: ['B', 'S*', '?', '?', 'B', 'B', 'B', 'B'],
        formula: 'MT en pausa de reloj',
        desc: 'La MT detiene el avance del cabezal a la espera de confirmación de canal.'
      }
    },
    {
      titulo:'Paso 3 — Timeout → CERRADO',
      desc:'Temporizador expira. δ_C(SYN-ENVIADO, timeout) → CERRADO. Canal se vacía.',
      cliente:'CERRADO', servidor:'ESCUCHA', tokens:{}, trans:null,
      formula:'δ_C(SYN-ENV,timeout)=CERRADO', viaje:['ec-synenv', 'pto-to-c1', 'pto-to-c2', 'pto-to-c3', 'ec-cerrado'],
      log:{tipo:'warn', msg:'TIMEOUT — AFP vacía pila de error y MT rebobina cinta'},
      afp: {
        estado: 'q_err', op: 'POP ALL (RESET)', tope: 'Z₀', pila: ['Z₀'],
        formula: 'δ(q_wait, "timeout", "SYN") = (q_err, "Z₀")',
        desc: 'Timeout de sesión: el AFP desapila elementos no reconocidos y recupera la base Z₀.'
      },
      turing: {
        estado: 'q_rewind', pos: 0, action: 'REWIND L',
        cinta: ['B', 'S', 'Y', 'N', 'B', 'B', 'B', 'B'],
        formula: 'δ(q_wait, "timeout") = (q₀, "B", L)',
        desc: 'La MT rebobina el cabezal a la posición inicial 0 para reintento de transmisión.'
      }
    },
    {
      titulo:'Paso 4 — Retransmisión',
      desc:'Cliente retransmite SYN. p_perdido inactivo. Flujo normal se restablece.',
      cliente:'SYN-ENVIADO', servidor:'ESCUCHA', tokens:{'tk-bufc':true}, trans:null,
      formula:'M(p_buf_C)=1 (retx)', viaje:['ec-cerrado','pn-bufc'],
      log:{tipo:'info', msg:'RETX — AFP y MT reanudan procesamiento conjunto'},
      afp: {
        estado: 'q₁', op: 'PUSH "{" / "SYN"', tope: 'SYN', pila: ['Z₀', '{', 'SYN'],
        formula: 'Reinicio de trama L7',
        desc: 'Nuevo bloque de aplicación abierto en pila: reintento de conexión.'
      },
      turing: {
        estado: 'q_cifrar', pos: 1, action: 'MOVE R',
        cinta: ['B', 'S*', 'Y', 'N', 'B', 'B', 'B', 'B'],
        formula: 'Reinicio de ciclo de cifrado',
        desc: 'Cabezal de Turing avanza nuevamente procesando la cadena retransmitida.'
      }
    }
  ],

  rst: [
    {
      titulo:'Estado Inicial — Servidor OFF',
      desc:'Servidor inactivo (modo OFF). Cualquier SYN recibido genera RST. No acepta conexiones.',
      cliente:'CERRADO', servidor:'ESCUCHA', tokens:{}, trans:null,
      formula:'A_S modo=OFF', viaje:null,
      log:{tipo:'warn', msg:'ESCENARIO: Servidor OFF (RST)'},
      afp: {
        estado: 'q₀', op: 'NOOP', tope: 'Z₀', pila: ['Z₀'],
        formula: 'M_AFP en reposo', desc: 'Pila en estado inicial.'
      },
      turing: {
        estado: 'q₀', pos: 0, action: 'READY',
        cinta: ['B', 'S', 'Y', 'N', 'B', 'B', 'B', 'B'],
        formula: 'M_MT en reposo', desc: 'Cinta en estado base.'
      }
    },
    {
      titulo:'Paso 1 — Cliente envía SYN',
      desc:'Cliente intenta conectar. Token SYN viaja por el canal.',
      cliente:'SYN-ENVIADO', servidor:'ESCUCHA', tokens:{'tk-syn':true}, trans:'tr-env-syn',
      formula:'M(p_SYN)=1', viaje:['ec-cerrado','pn-bufc','tr-env-syn','pn-syn'],
      log:{tipo:'token', msg:'[SYN] enviado → en tránsito'},
      afp: {
        estado: 'q₁', op: 'PUSH "{"', tope: '{"', pila: ['Z₀', '{'],
        formula: 'δ(q₀, "{", Z₀) = (q₁, "{Z₀}")', desc: 'Cliente abre trama en el AFP.'
      },
      turing: {
        estado: 'q_cifrar', pos: 1, action: 'WRITE S*',
        cinta: ['B', 'S*', 'Y', 'N', 'B', 'B', 'B', 'B'],
        formula: 'Cifrado en marcha', desc: 'MT inicia cifrado normal.'
      }
    },
    {
      titulo:'Paso 2 — Servidor OFF emite RST',
      desc:'SYN llega a servidor OFF. δ_S → ESCUCHA (emite RST). Canal limpiado.',
      cliente:'SYN-ENVIADO', servidor:'ESCUCHA', tokens:{}, trans:null,
      formula:'A_S_OFF: ∀SYN→RST', viaje:['pn-syn','tr-ent-syn','pn-bufs','es-escucha'],
      log:{tipo:'error', msg:'[RST] emitido — MT escribe código de rechazo en cinta'},
      afp: {
        estado: 'q_reject', op: 'INTERRUPT', tope: 'RST', pila: ['Z₀', 'RST!'],
        formula: 'Interrupción por RST', desc: 'El AFP recibe señal de corte inmediato.'
      },
      turing: {
        estado: 'q_abort', pos: 4, action: 'WRITE RST',
        cinta: ['!', 'R', 'S', 'T', '!', 'B', 'B', 'B'],
        formula: 'δ(q_serv, "OFF") = (q_abort, "RST", S)',
        desc: 'MT del servidor escribe código de aborto "RST!" y detiene la máquina.'
      }
    },
    {
      titulo:'Paso 3 — Cliente recibe RST → CERRADO',
      desc:'δ_C(SYN-ENVIADO, rcv_RST) → CERRADO. Conexión abortada. Sin deadlock.',
      cliente:'CERRADO', servidor:'ESCUCHA', tokens:{}, trans:null,
      formula:'δ_C(SYN-ENV,rcvRST)=CERRADO', viaje:['ec-synenv', 'pto-to-c1', 'pto-to-c2', 'pto-to-c3', 'ec-cerrado'],
      log:{tipo:'error', msg:'[RST] procesado → AFP resetea pila y MT finaliza en aborto'},
      afp: {
        estado: 'q₀', op: 'RESET → Z₀', tope: 'Z₀', pila: ['Z₀'],
        formula: 'Vaciado completo', desc: 'Pila restaurada limpiamente a Z₀; sesión terminada sin deadlock.'
      },
      turing: {
        estado: 'q_abort', pos: 0, action: 'HALT_ABORT',
        cinta: ['!', 'R', 'S', 'T', '!', 'B', 'B', 'B'],
        formula: 'Parada por rechazo', desc: 'MT permanece en estado de aborto documentando el rechazo.'
      }
    }
  ],

  simultaneous: [
    {
      titulo:'Estado Inicial — Apertura Simultánea',
      desc:'Ambos nodos inician conexión al mismo tiempo. S envía un SYN (activo) en vez de esperar en ESCUCHA.',
      cliente:'CERRADO', servidor:'CERRADO', tokens:{}, trans:null,
      formula:'Active Open en C y S', viaje:null,
      log:{tipo:'warn', msg:'ESCENARIO: Apertura Simultánea'},
      afp: {
        estado: 'q₀', op: 'NOOP', tope: 'Z₀', pila: ['Z₀'],
        formula: 'AFP dual en espera', desc: 'Pila en reposo.'
      },
      turing: {
        estado: 'q₀', pos: 0, action: 'READY',
        cinta: ['B', 'C_SYN', 'S_SYN', 'B', 'B', 'B', 'B', 'B'],
        formula: 'MT dual en reposo', desc: 'Cinta particionada para ambos extremos concurrentes.'
      }
    },
    {
      titulo:'Paso 1 — Envío Simultáneo de SYN',
      desc:'Ambos envían SYN. Los tokens viajan en sentidos opuestos cruzando la red.',
      cliente:'SYN-ENVIADO', servidor:'SYN-RECIBIDO', tokens:{'tk-syn':true,'tk-synack':true}, trans:null,
      formula:'M(p_SYN)=1 ∧ M(p_SYNACK)=1', 
      viaje:[
        ['ec-cerrado','pn-bufc','tr-env-syn','pn-syn'], 
        ['es-synrec','tr-env-sack','pn-synack']
      ],
      log:{tipo:'token', msg:'SYN cruzados — AFP apila delimitadores concurrentes'},
      afp: {
        estado: 'q_simul', op: 'PUSH {C / {S', tope: '{S', pila: ['Z₀', '{C', '{S'],
        formula: 'δ_dual: apilado simétrico', desc: 'El AFP registra ambas aperturas simultáneas en la pila.'
      },
      turing: {
        estado: 'q_simul', pos: 1, action: 'WRITE C*',
        cinta: ['#', 'C*', 'S*', '#', 'B', 'B', 'B', 'B'],
        formula: 'Cifrado concurrente', desc: 'MT cifra simultáneamente las cabeceras cruzadas.'
      }
    },
    {
      titulo:'Paso 2 — Recepción Mutua de SYN',
      desc:'Cada extremo recibe el SYN del otro nodo estando en estado de sincronización.',
      cliente:'SYN-ENVIADO', servidor:'SYN-RECIBIDO', tokens:{}, trans:null,
      formula:'δ(SYN-ENV,rcvSYN)=SYN-REC', 
      viaje:[
        ['pn-syn','tr-ent-syn','pn-bufs','es-escucha','es-synrec'], 
        ['pn-synack','tr-ent-sack','pn-bufc2','ec-synenv']
      ],
      log:{tipo:'info', msg:'Ambos reciben SYN del otro — AFP valida cruce'},
      afp: {
        estado: 'q_simul', op: 'VALIDATE DUAL', tope: '{S', pila: ['Z₀', '{C', '{S'],
        formula: 'Verificación de simetría', desc: 'Pila mantiene consistencia en la condición de carrera controlada.'
      },
      turing: {
        estado: 'q_simul', pos: 2, action: 'MOVE R',
        cinta: ['#', 'C*', 'S*', '#', 'B', 'B', 'B', 'B'],
        formula: 'Inspección de paridad', desc: 'MT confirma que ambas peticiones son válidas y compatibles.'
      }
    },
    {
      titulo:'Paso 3 — Envío de SYN-ACKs',
      desc:'Como respuesta al SYN recibido, ambos extremos generan y envían un paquete de confirmación (ACK).',
      cliente:'ESTABLECIDO', servidor:'SYN-RECIBIDO', tokens:{'tk-synack':true, 'tk-ack':true}, trans:null,
      formula:'Generación simétrica de ACKs', 
      viaje:[
        ['ec-synenv', 'ec-estab', 'tr-env-ack', 'pn-ack'], 
        ['es-synrec', 'tr-env-sack', 'pn-synack'] 
      ],
      log:{tipo:'token', msg:'ACKs cruzados en el canal — AFP prepara resolución'},
      afp: {
        estado: 'q_res', op: 'POP {S', tope: '{C', pila: ['Z₀', '{C'],
        formula: 'Resolución de carrera', desc: 'AFP desapila el primer bloque validado.'
      },
      turing: {
        estado: 'q_res', pos: 3, action: 'WRITE ACK',
        cinta: ['#', 'OK', 'OK', '#', 'B', 'B', 'B', 'B'],
        formula: 'Confirmación simétrica', desc: 'MT valida y sella la paridad de la conexión.'
      }
    },
    {
      titulo:'Paso 4 — ESTABLECIDO (ambos lados)',
      desc:'Cada nodo recibe el ACK del otro. Ambos alcanzan el estado ESTABLECIDO. ¡Simulación exitosa!',
      cliente:'ESTABLECIDO', servidor:'ESTABLECIDO', tokens:{}, trans:null,
      formula:'∃σ: A_C=A_S=ESTAB ✓', 
      viaje:[
        ['pn-ack', 'tr-ent-ack', 'es-estab'],
        ['pn-synack', 'tr-ent-sack', 'pn-bufc2', 'ec-synenv', 'ec-estab']
      ],
      log:{tipo:'ok', msg:'✓ APERTURA SIMULTÁNEA completada — AFP y MT en estado de éxito'},
      afp: {
        estado: 'q_acc', op: 'POP {C → ACEPTACIÓN ✓', tope: 'Z₀', pila: ['Z₀'],
        formula: 'δ(q_res, ε, Z₀) = (q_acc, Z₀)',
        desc: '¡Ambos flujos validados y aceptados! Pila limpia en Z₀.'
      },
      turing: {
        estado: 'q_halt', pos: 3, action: 'HALT ✓',
        cinta: ['#', 'OK', 'OK', '#', 'B', 'B', 'B', 'B'],
        formula: 'HALT_SUCCESS', desc: 'MT finaliza en parada con cinta autenticada.'
      }
    }
  ]
};

// ─── MOTOR DEL SIMULADOR ─────────────────────────────────────────
const sim = { escenario:'normal', paso:0, pasos:[], logN:0, animando:false };

const MAP_C = { 'CERRADO':'ec-cerrado','SYN-ENVIADO':'ec-synenv','SYN-RECIBIDO':'ec-synenv','ESTABLECIDO':'ec-estab','FIN-ESPERA':'ec-fin' };
const MAP_S = { 'ESCUCHA':'es-escucha','SYN-RECIBIDO':'es-synrec','CERRADO':null,'SYN-ENVIADO':'es-synrec','ESTABLECIDO':'es-estab','CERRANDO':'es-cerrando' };
const IDS_C = ['ec-cerrado','ec-synenv','ec-estab','ec-fin'];
const IDS_S = ['es-escucha','es-synrec','es-estab','es-cerrando'];
const TODOS_TK = ['tk-bufc','tk-syn','tk-bufs','tk-synack','tk-bufc2','tk-ack','tk-perdido'];
const TODAS_TR = ['tr-env-syn','tr-ent-syn','tr-env-sack','tr-ent-sack','tr-env-ack','tr-ent-ack'];

function iniciarSimulador() {
  sim.velocidad = 1;
  sim.autoPlay = false;
  sim.autoPlayTimeout = null;

  document.querySelectorAll('.btn-escenario').forEach(b => {
    b.addEventListener('click', () => {
      if (sim.animando) return;
      document.querySelectorAll('.btn-escenario').forEach(x => x.classList.remove('activo'));
      b.classList.add('activo');
      sim.escenario = b.dataset.esc;
      
      const panelAuto = document.getElementById('panel-autoplay');
      if (sim.escenario === 'masiva') {
        panelAuto.style.display = 'block';
        document.getElementById('btn-auto-play').style.display = 'block';
        document.getElementById('btn-auto-pause').style.display = 'none';
        sim.autoPlay = false;
        clearTimeout(sim.autoPlayTimeout);
        generarEscenarioMasivo(parseInt(document.getElementById('input-n-paquetes').value) || 5);
        sim.pasos = ESCENARIOS['masiva'];
      } else {
        sim.pasos = ESCENARIOS[sim.escenario];
        panelAuto.style.display = 'none';
        sim.autoPlay = false;
        clearTimeout(sim.autoPlayTimeout);
      }
      
      aplicarPaso(0, true);
      log('info', `Escenario: ${b.textContent.trim()}`);
    });
  });

  // Eventos Auto-Play
  document.getElementById('btn-auto-play').addEventListener('click', () => {
    if (sim.escenario === 'masiva') {
      const n = parseInt(document.getElementById('input-n-paquetes').value) || 5;
      const dir = document.getElementById('select-direccion').value;
      generarEscenarioMasivo(n, dir);
      sim.pasos = ESCENARIOS['masiva'];
    }
    
    if (sim.paso >= sim.pasos.length - 1) aplicarPaso(0, true);
    sim.autoPlay = true;
    document.getElementById('btn-auto-play').style.display = 'none';
    document.getElementById('btn-auto-pause').style.display = 'block';
    log('info', `▶ Auto-Play activado (${sim.escenario === 'masiva' ? 'N=' + document.getElementById('input-n-paquetes').value : ''})`);
    if (!sim.animando) procesarAutoPlay();
  });

  document.getElementById('btn-auto-pause').addEventListener('click', () => {
    sim.autoPlay = false;
    clearTimeout(sim.autoPlayTimeout);
    document.getElementById('btn-auto-play').style.display = 'block';
    document.getElementById('btn-auto-pause').style.display = 'none';
    log('warn', '⏸ Auto-Play en pausa');
  });

  document.getElementById('slider-velocidad').addEventListener('input', (e) => {
    sim.velocidad = parseInt(e.target.value);
    document.getElementById('disp-velocidad').textContent = sim.velocidad + 'x';
  });

  document.getElementById('btn-next').addEventListener('click', () => {
    if (!sim.animando && sim.paso < sim.pasos.length - 1) aplicarPaso(sim.paso + 1, false);
  });
  document.getElementById('btn-prev').addEventListener('click', () => {
    if (!sim.animando && sim.paso > 0) aplicarPaso(sim.paso - 1, true);
  });
  document.getElementById('btn-reset').addEventListener('click', () => {
    if (!sim.animando) { 
      sim.autoPlay = false;
      clearTimeout(sim.autoPlayTimeout);
      document.getElementById('btn-auto-play').style.display = 'block';
      document.getElementById('btn-auto-pause').style.display = 'none';
      aplicarPaso(0, true); 
      log('info','Reset → Estado Inicial Multimodelo aplicado'); 
    }
  });

  sim.pasos = ESCENARIOS.normal;
  aplicarPaso(0, true);
  initTooltips();
}

async function aplicarPaso(idx, instantaneo) {
  const p = sim.pasos[idx];
  if (!p) return;

  sim.animando = true;
  sim.paso = idx;

  // 1. Limpiar tokens y transiciones ANTES de animar
  limpiarTokens();
  limpiarTrans();

  // 2. Animar token viajero por la Red de Petri
  if (!instantaneo && p.viaje && p.viaje.length >= 2) {
    let color = '#f78166';
    if (p.color) color = p.color;
    else if (p.tokens && Object.keys(p.tokens).includes('tk-perdido')) color = '#f85149';
    
    await animarToken(p.viaje, color, 420);
  }

  // 3. Actualizar AFDs de Cliente y Servidor
  actualizarFSM(p.cliente, IDS_C, MAP_C, '#388bfd');
  actualizarFSM(p.servidor, IDS_S, MAP_S, '#3fb950');

  // 4. Actualizar Autómata con Pila (AFP) y Máquina de Turing (MT) en simultáneo
  actualizarAFP(p.afp);
  actualizarTuring(p.turing);

  // 5. Mostrar tokens estáticos finales en la Red de Petri
  Object.entries(p.tokens || {}).forEach(([id, v]) => { if(v) mostrarToken(id); });

  // 6. Disparo de transición de Red de Petri activa
  if (p.trans) { dispararTrans(p.trans); }

  // 7. Actualización de paneles y contadores
  const total = sim.pasos.length - 1;
  document.getElementById('paso-num').textContent    = `Paso ${idx} / ${total}`;
  document.getElementById('paso-titulo').textContent = p.titulo;
  document.getElementById('paso-desc').textContent   = p.desc;
  document.getElementById('paso-formula').textContent = p.formula;
  document.getElementById('disp-cliente').textContent  = p.cliente;
  document.getElementById('disp-servidor').textContent = p.servidor;

  const tkActivos = Object.entries(p.tokens||{}).filter(([,v])=>v).map(([k])=>k.replace('tk-','p_'));
  document.getElementById('tokens-display').innerHTML = tkActivos.length
    ? tkActivos.map(t=>`<span style="color:var(--c-token)">● ${t}</span>`).join('  ')
    : '<span style="color:var(--c-texto-dim)">Todas las plazas vacías</span>';

  document.getElementById('barra-prog').style.width = `${(idx/total)*100}%`;
  document.getElementById('btn-prev').disabled = idx === 0;
  document.getElementById('btn-next').disabled = idx === total;

  if (p.log) log(p.log.tipo, p.log.msg);
  sim.animando = false;

  // Auto-Play
  if (sim.autoPlay && sim.paso < sim.pasos.length - 1) {
    const espera = 600 / (sim.velocidad || 1);
    sim.autoPlayTimeout = setTimeout(procesarAutoPlay, espera);
  } else if (sim.autoPlay && sim.paso >= sim.pasos.length - 1) {
    sim.autoPlay = false;
    document.getElementById('btn-auto-play').style.display = 'block';
    document.getElementById('btn-auto-pause').style.display = 'none';
    log('warn', '⏹ Auto-Play finalizado');
  }
}

function procesarAutoPlay() {
  if (!sim.autoPlay) return;
  if (sim.paso < sim.pasos.length - 1) {
    aplicarPaso(sim.paso + 1, false);
  }
}

// ─── ACTUALIZADORES DE AFP & TURING ───────────────────────────────
function actualizarAFP(afp) {
  if (!afp) return;
  const elEstado = document.getElementById('disp-afp-estado');
  const elOp = document.getElementById('disp-afp-op');
  const elTope = document.getElementById('disp-afp-tope');
  const elFormula = document.getElementById('disp-afp-formula');
  const elDesc = document.getElementById('disp-afp-desc');
  const elStack = document.getElementById('afp-stack-container');

  if (elEstado) elEstado.textContent = afp.estado || 'q₀';
  if (elOp) {
    elOp.textContent = afp.op || 'NOOP';
    if (afp.op.includes('PUSH')) {
      elOp.style.background = 'rgba(63, 185, 80, 0.2)';
      elOp.style.color = '#3fb950';
      elOp.style.borderColor = 'rgba(63, 185, 80, 0.4)';
    } else if (afp.op.includes('POP')) {
      elOp.style.background = 'rgba(248, 81, 73, 0.2)';
      elOp.style.color = '#f85149';
      elOp.style.borderColor = 'rgba(248, 81, 73, 0.4)';
    } else if (afp.op.includes('ACEPT')) {
      elOp.style.background = 'rgba(56, 139, 253, 0.2)';
      elOp.style.color = '#79c0ff';
      elOp.style.borderColor = 'rgba(56, 139, 253, 0.4)';
    } else {
      elOp.style.background = 'rgba(227, 98, 9, 0.2)';
      elOp.style.color = '#ffab70';
      elOp.style.borderColor = 'rgba(227, 98, 9, 0.4)';
    }
  }
  if (elTope) elTope.textContent = 'Tope: ' + (afp.tope || 'Z₀');
  if (elFormula) elFormula.textContent = afp.formula || '';
  if (elDesc) elDesc.textContent = afp.desc || '';

  if (elStack && Array.isArray(afp.pila)) {
    elStack.innerHTML = '';
    afp.pila.forEach((item, idx) => {
      const div = document.createElement('div');
      div.className = 'stack-item';
      if (idx === 0 || item.includes('Z₀')) div.classList.add('z0');
      else if (idx === afp.pila.length - 1) div.classList.add('accent');
      div.textContent = item;
      elStack.appendChild(div);
    });
  }
}

function actualizarTuring(mt) {
  if (!mt) return;
  const elEstado = document.getElementById('disp-mt-estado');
  const elPos = document.getElementById('disp-mt-pos');
  const elAction = document.getElementById('disp-mt-action');
  const elFormula = document.getElementById('disp-mt-formula');
  const elDesc = document.getElementById('disp-mt-desc');
  const elTape = document.getElementById('mt-tape-container');
  const elIndicator = document.getElementById('mt-head-indicator');

  if (elEstado) elEstado.textContent = mt.estado || 'q₀';
  if (elPos) elPos.textContent = 'Celda ' + (mt.pos !== undefined ? mt.pos : 0);
  if (elAction) {
    elAction.textContent = mt.action || 'R/W';
    if (mt.action.includes('HALT')) {
      elAction.style.background = 'rgba(63, 185, 80, 0.25)';
      elAction.style.color = '#3fb950';
      elAction.style.borderColor = 'rgba(63, 185, 80, 0.5)';
    } else {
      elAction.style.background = 'rgba(188, 140, 255, 0.2)';
      elAction.style.color = '#d2a8ff';
      elAction.style.borderColor = 'rgba(188, 140, 255, 0.4)';
    }
  }
  if (elFormula) elFormula.textContent = mt.formula || '';
  if (elDesc) elDesc.textContent = mt.desc || '';

  if (elTape && Array.isArray(mt.cinta)) {
    elTape.innerHTML = '';
    mt.cinta.forEach((cellVal, idx) => {
      const cell = document.createElement('div');
      cell.className = 'tape-cell';
      if (idx === mt.pos) cell.classList.add('active');
      if (cellVal === 'B') cell.classList.add('blank');
      cell.textContent = cellVal;
      elTape.appendChild(cell);
    });

    if (elIndicator) {
      setTimeout(() => {
        const activeCell = elTape.children[mt.pos];
        if (activeCell) {
          const offsetLeft = activeCell.offsetLeft + (activeCell.offsetWidth / 2);
          elIndicator.style.left = offsetLeft + 'px';
        }
      }, 50);
    }
  }
}

// ─── GENERADOR DE ESCENARIO MASIVO (CON AFP & MT) ──────────────────
function generarEscenarioMasivo(n, dir = 'cs') {
  const base = JSON.parse(JSON.stringify(ESCENARIOS.normal));
  const esCS = dir === 'cs';
  const color = esCS ? '#79c0ff' : '#bc8cff';
  const tituloDir = esCS ? 'Cliente ➔ Servidor' : 'Servidor ➔ Cliente';
  
  for (let i = 1; i <= n; i++) {
    const celdaMT = ((i - 1) % 6) + 1;
    const charDato = String.fromCharCode(65 + ((i - 1) % 26)); // A, B, C...
    
    // Simulación de la cinta deslizante de Turing
    const cintaDinamica = ['#', 'D₁', 'D₂', 'D₃', 'D₄', 'D₅', '#', 'B'];
    cintaDinamica[celdaMT] = `${charDato}*`;

    const paso = {
      titulo: `Datos (${tituloDir}) — ${i}/${n}`,
      desc: esCS 
        ? `Cliente transmite trama ${charDato} al Servidor. MT cifra byte y AFP valida delimitadores.`
        : `Servidor transmite descarga ${charDato} al Cliente. MT valida cinta y AFP apila respuesta.`,
      cliente: 'ESTABLECIDO', servidor: 'ESTABLECIDO', 
      tokens: {},
      color: color,
      formula: `Tx_${dir}(${i})`,
      log: { tipo: 'token', msg: `[DATA] ${i}/${n} transmitido (${charDato}) — MT Celda ${celdaMT}` },
      afp: {
        estado: 'q_stream',
        op: (i % 2 === 1) ? `PUSH "D_${i}"` : `POP "D_${i-1}"`,
        tope: (i % 2 === 1) ? `D_${i}` : 'Z₀',
        pila: (i % 2 === 1) ? ['Z₀', '{', `D_${i}`] : ['Z₀', '{'],
        formula: `δ(q_stream, "${charDato}", Tope) = (q_stream, γ)`,
        desc: `Transmisión simultánea ${i}/${n}: AFP valida flujo de tramas de aplicación balanceadas.`
      },
      turing: {
        estado: 'q_stream',
        pos: celdaMT,
        action: `WRITE ${charDato}*`,
        cinta: cintaDinamica,
        formula: `δ(q_stream, "${charDato}") = (q_stream, "${charDato}*", R)`,
        desc: `MT procesa byte ${charDato} en celda ${celdaMT}: genera firma cifrada antes de inyección.`
      }
    };

    if (esCS) {
      paso.trans = 'tr-ent-ack';
      paso.viaje = ['ec-estab', 'tr-env-ack', 'pn-ack', 'tr-ent-ack', 'es-estab'];
    } else {
      paso.trans = 'tr-ent-sack';
      paso.viaje = ['es-estab', 'es-synrec', 'tr-env-sack', 'pn-synack', 'tr-ent-sack', 'pn-bufc2', 'ec-synenv', 'ec-estab'];
    }
    
    base.push(paso);
  }
  
  base.push({
    titulo: 'Transmisión Completada',
    desc: `Se han procesado los ${n} paquetes en sentido ${tituloDir}. Todos los modelos en estado final.`,
    cliente: 'ESTABLECIDO', servidor: 'ESTABLECIDO', 
    tokens: {}, trans: null,
    formula: 'Fin Tx',
    viaje: null,
    log: { tipo: 'ok', msg: `✓ FLUJO ${dir.toUpperCase()} COMPLETADO — 4 Modelos Convergieron` },
    afp: {
      estado: 'q_acc', op: 'POP "{" → ACEPTACIÓN ✓', tope: 'Z₀', pila: ['Z₀'],
      formula: 'δ(q_stream, "EOF", "{") = (q_acc, "Z₀")',
      desc: 'Transmisión masiva completada exitosamente. El AFP validó todos los paquetes y la pila quedó limpia en Z₀.'
    },
    turing: {
      estado: 'q_halt', pos: 6, action: 'HALT ✓',
      cinta: ['#', 'D_OK', 'D_OK', 'D_OK', 'D_OK', 'D_OK', '#', 'B'],
      formula: 'HALT (Stream OK)',
      desc: 'Máquina de Turing completó el cómputo de la ráfaga completa alcanzando estado de parada.'
    }
  });
  
  ESCENARIOS['masiva'] = base;
}

// ─── FUNCIONES SVG ───────────────────────────────────────────────
function actualizarFSM(estadoActivo, ids, mapa, color) {
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const activo = mapa[estadoActivo] === id;
    el.style.transition = 'fill .35s, filter .35s';
    el.style.fill   = activo ? color   : '#060b14';
    el.style.filter = activo ? `drop-shadow(0 0 12px ${color})` : 'none';
  });
}

function mostrarToken(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.transition = 'opacity 0.2s ease';
  el.style.opacity = '1';
}

function limpiarTokens() {
  TODOS_TK.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.style.transition = 'none';
      el.style.opacity = '0';
    }
  });
}

function dispararTrans(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.animation = 'none'; void el.offsetWidth;
  el.style.filter = 'drop-shadow(0 0 10px #d29922) brightness(2.2)';
  el.style.animation = 'trans-fire .7s cubic-bezier(.4,0,.2,1) both';
  setTimeout(() => { if(el) el.style.filter='none'; }, 750);
}

function limpiarTrans() {
  TODAS_TR.forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.style.filter='none'; el.style.animation='none'; }
  });
}

// ─── CONSOLA ─────────────────────────────────────────────────────
function log(tipo, msg) {
  const c = document.getElementById('consola-body');
  if (!c) return;
  sim.logN++;
  const n = String(sim.logN).padStart(2,'0');
  const span = document.createElement('span');
  span.className = 'log-line';
  span.innerHTML = `<span class="log-time">[${n}]</span><span class="log-${tipo}"> ${msg}</span>`;
  c.appendChild(span);
  c.scrollTop = c.scrollHeight;
  while(c.children.length > 60) c.removeChild(c.firstChild);
}

// ─── INIT ────────────────────────────────────────────────────────
iniciarApp();
