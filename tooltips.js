// ─── TOOLTIPS ────────────────────────────────────────────────────
const TIP_DATA = {
  // ── Etiquetas de zona ──
  'fsm-c': { titulo:'FSM Cliente', clase:'c', subtitulo:'Autómata Finito Determinista', cuerpo:'Modela el comportamiento del extremo cliente de TCP. Controla el inicio, establecimiento y cierre de conexiones.', formula:'Aᶜ = (Qᶜ, Σ, δᶜ, CERRADO, {ESTAB})' },
  'canal': { titulo:'Red de Petri del Canal', clase:'n', subtitulo:'Nᶜ — Modelo Concurrente', cuerpo:'Modela el canal de comunicación. Plazas = buffers y mensajes en tránsito. Transiciones = eventos de envío y entrega.', formula:'Nᶜ = (P, T, F, W, M₀)' },
  'fsm-s': { titulo:'FSM Servidor', clase:'s', subtitulo:'Autómata Finito Determinista', cuerpo:'Modela el extremo servidor de TCP. Escucha peticiones entrantes y responde a los eventos del protocolo de forma reactiva.', formula:'Aˢ = (Qˢ, Σ, δˢ, ESCUCHA, {ESTAB})' },

  // ── Escenarios ──
  'normal':      { titulo:'Handshake Normal', clase:'w', subtitulo:'Flujo estándar TCP', cuerpo:'Flujo completo en 7 pasos: SYN → SYN-ACK → ACK. Sin pérdidas ni errores. Ambos extremos alcanzan ESTABLECIDO.', formula:'∃σ: Aᶜ=ESTAB ∧ Aˢ=ESTAB' },
  'perdida':     { titulo:'Pérdida de Paquete', clase:'w', subtitulo:'Fallo de red + Timeout', cuerpo:'La plaza inhibidora p_perdido bloquea la entrega del SYN. El cliente detecta el fallo via timeout y retransmite.', formula:'¬hab(ent_SYN): M(p_perd)=1' },
  'rst':         { titulo:'Rechazo (RST)', clase:'w', subtitulo:'Servidor inactivo (OFF)', cuerpo:'El servidor responde con RST al recibir SYN. El cliente regresa a CERRADO sin deadlock. No hay conexión establecida.', formula:'∀SYN → RST (si Aˢ=OFF)' },
  'simultaneous':{ titulo:'Apertura Simultánea', clase:'w', subtitulo:'Simultaneous Open — RFC 793', cuerpo:'Ambos nodos inician conexión al mismo tiempo. El protocolo TCP resuelve la condición de carrera: ambos convergen en ESTABLECIDO.', formula:'Aᶜ=Aˢ=SYN-ENV ⇒ Aᶜ=Aˢ=ESTAB' },

  
  // ── Plazas de la Red de Petri ──
  'pn-bufc':    { titulo:'p_buf_C', clase:'n', subtitulo:'Plaza — Buffer de salida (Cliente)', cuerpo:'Almacena el segmento SYN generado por el FSM Cliente antes de ser transmitido al canal. M(p_buf_C)=1 habilita enviar_SYN.', formula:'M(p_buf_C) ≥ 1 → env_SYN habilitada' },
  'pn-syn':     { titulo:'p_SYN', clase:'n', subtitulo:'Plaza — SYN en tránsito', cuerpo:'El segmento SYN está viajando por el canal de red de C hacia S. Su presencia (M≥1) habilita la transición entregar_SYN.', formula:'M(p_SYN) ≥ 1 → ent_SYN habilitada' },
  'pn-bufs':    { titulo:'p_buf_S', clase:'n', subtitulo:'Plaza — Buffer de entrada (Servidor)', cuerpo:'El segmento SYN ha llegado al servidor. Este token genera el evento recibir_SYN en el FSM Servidor.', formula:'M(p_buf_S) ≥ 1 → δˢ(ESCUCHA, rcvSYN)' },
  'pn-synack':  { titulo:'p_SYNACK', clase:'n', subtitulo:'Plaza — SYN-ACK en tránsito', cuerpo:'El segmento SYN-ACK viaja del servidor al cliente. M≥1 habilita entregar_SYNACK, llevando el token a p_buf_C₂.', formula:'M(p_SYNACK) ≥ 1 → ent_SYNACK habilitada' },
  'pn-bufc2':   { titulo:'p_buf_C₂', clase:'n', subtitulo:'Plaza — Buffer de entrada (Cliente)', cuerpo:'El SYN-ACK ha llegado al cliente. Este token genera el evento recibir_SYNACK que transiciona al cliente a ESTABLECIDO.', formula:'M(p_buf_C₂) ≥ 1 → δᶜ(SYN-ENV, rcvSYNACK)' },
  'pn-ack':     { titulo:'p_ACK', clase:'n', subtitulo:'Plaza — ACK en tránsito', cuerpo:'El segmento ACK final viaja del cliente al servidor. M≥1 habilita entregar_ACK, completando el handshake de 3 vías.', formula:'M(p_ACK) ≥ 1 → ent_ACK habilitada' },
  'pn-perdido': { titulo:'p_perdido', clase:'n', subtitulo:'Plaza — Inhibidor de pérdida', cuerpo:'Plaza especial con arco INHIBIDOR hacia ent_SYN. Si M(p_perdido)≥1, la transición ent_SYN queda INHABILITADA aunque p_SYN tenga tokens.', formula:'M(p_perd) ≥ 1 → ¬hab(ent_SYN)' },

  // ── Transiciones de la Red de Petri ──
  'tr-env-syn':  { titulo:'enviar_SYN', clase:'n', subtitulo:'Transición — Envío de SYN', cuerpo:'Consume token de p_buf_C y produce uno en p_SYN. Modela el acto de poner el segmento SYN en el canal de red.', formula:'M\'(p_SYN)=M(p_SYN)+1, M\'(p_buf_C)=M(p_buf_C)−1' },
  'tr-ent-syn':  { titulo:'entregar_SYN', clase:'n', subtitulo:'Transición — Entrega de SYN (con inhibidor)', cuerpo:'Habilitada cuando M(p_SYN)≥1 Y M(p_perdido)=0. Si hay pérdida, el arco inhibidor bloquea esta transición.', formula:'hab = M(p_SYN)≥1 ∧ M(p_perd)=0' },
  'tr-env-sack': { titulo:'enviar_SYNACK', clase:'n', subtitulo:'Transición — Envío de SYN-ACK', cuerpo:'Disparada por el servidor al transicionar a SYN-RECIBIDO. Produce un token en p_SYNACK que viajará hacia el cliente.', formula:'δˢ(ESCUCHA,rcvSYN)=SYN-REC → M\'(p_SYNACK)=1' },
  'tr-ent-sack': { titulo:'entregar_SYNACK', clase:'n', subtitulo:'Transición — Entrega de SYN-ACK', cuerpo:'Consume token de p_SYNACK y produce uno en p_buf_C₂. Modela la llegada del SYN-ACK al buffer del cliente.', formula:'M\'(p_buf_C₂)=M(p_buf_C₂)+1' },
  'tr-env-ack':  { titulo:'enviar_ACK', clase:'n', subtitulo:'Transición — Envío de ACK final', cuerpo:'Disparada al transicionar el cliente a ESTABLECIDO. Produce token en p_ACK. Es el tercer y último segmento del handshake.', formula:'δᶜ(SYN-ENV,rcvSYNACK)=ESTAB → M\'(p_ACK)=1' },
  'tr-ent-ack':  { titulo:'entregar_ACK', clase:'n', subtitulo:'Transición — Entrega de ACK (completa handshake)', cuerpo:'Entrega el ACK al servidor. El servidor transiciona a ESTABLECIDO. AMBOS autómatas han alcanzado el estado de aceptación.', formula:'∃σ: Aᶜ=ESTAB ∧ Aˢ=ESTAB ✓' },

  // ── Estados FSM Cliente ──
  'ec-cerrado': { titulo:'CERRADO', clase:'c', subtitulo:'Estado inicial del Cliente', cuerpo:'No hay conexión activa. Estado de partida. La transición iniciar_conexion lleva al cliente a SYN-ENVIADO y deposita un token en p_buf_C.', formula:'q₀ ∈ Qᶜ (estado inicial)' },
  'ec-synenv':  { titulo:'SYN-ENVIADO', clase:'c', subtitulo:'Cliente — Esperando SYN-ACK', cuerpo:'El cliente ha enviado SYN y aguarda respuesta. Si llega SYN-ACK → ESTABLECIDO. Si el timer expira → CERRADO (timeout).', formula:'δᶜ(SYN-ENV, rcvSYNACK) = ESTABLECIDO' },
  'ec-estab':   { titulo:'ESTABLECIDO', clase:'c', subtitulo:'Estado de aceptación (Cliente)', cuerpo:'Conexión TCP activa. El cliente puede transmitir y recibir datos. Estado de aceptación del autómata (doble círculo).', formula:'ESTAB ∈ Fᶜ (estado de aceptación)' },
  'ec-fin':     { titulo:'FIN-ESPERA', clase:'c', subtitulo:'Cliente — Cerrando conexión', cuerpo:'El cliente ha enviado FIN para iniciar el cierre activo de la conexión. Espera FIN-ACK del servidor para volver a CERRADO.', formula:'δᶜ(ESTAB, iniciar_cierre) = FIN-ESP' },

  // ── Estados FSM Servidor ──
  'es-escucha':   { titulo:'ESCUCHA', clase:'s', subtitulo:'Estado inicial del Servidor', cuerpo:'El servidor está activo esperando conexiones entrantes. Es el estado de partida del FSM Servidor (estado inicial).', formula:'q₀ˢ ∈ Qˢ (estado inicial)' },
  'es-synrec':    { titulo:'SYN-RECIBIDO', clase:'s', subtitulo:'Servidor — Procesando SYN', cuerpo:'El servidor recibió SYN y envió SYN-ACK. Espera el ACK final del cliente. Si el timer expira, retransmite SYN-ACK y vuelve a ESCUCHA.', formula:'δˢ(ESCUCHA, rcvSYN) = SYN-REC' },
  'es-estab':     { titulo:'ESTABLECIDO', clase:'s', subtitulo:'Estado de aceptación (Servidor)', cuerpo:'Conexión TCP activa en el servidor. El ACK del cliente ha sido recibido. Ambos autómatas están en sus estados de aceptación.', formula:'ESTAB ∈ Fˢ (estado de aceptación)' },
  'es-cerrando':  { titulo:'CERRANDO', clase:'s', subtitulo:'Servidor — Cerrando conexión', cuerpo:'El servidor recibió FIN del cliente e inicia el cierre pasivo. Envía FIN-ACK para completar el intercambio de cierre.', formula:'δˢ(ESTAB, rcvFIN) = CERRANDO' },

  // ── Transiciones de los FSM ──
  'fsm-c-init':    { titulo:'iniciar_conexion', clase:'c', subtitulo:'Transición FSM', cuerpo:'Disparada por la aplicación (Active Open). Mueve FSM-C a SYN-ENVIADO y solicita el envío de un SYN al canal.', formula:'δᶜ(CERRADO, iniciar_conexion)' },
  'fsm-c-rcvsack': { titulo:'rcv_SYN-ACK', clase:'c', subtitulo:'Transición FSM', cuerpo:'El cliente recibe el SYN-ACK esperado. Transiciona a ESTABLECIDO y genera el ACK final.', formula:'δᶜ(SYN-ENV, rcv_SYN-ACK) = ESTAB' },
  'fsm-c-close':   { titulo:'iniciar_cierre', clase:'c', subtitulo:'Transición FSM', cuerpo:'El cliente decide cerrar la conexión. Envía FIN y espera respuesta.', formula:'δᶜ(ESTAB, iniciar_cierre)' },
  'fsm-c-to':      { titulo:'timeout', clase:'c', subtitulo:'Transición FSM (Error)', cuerpo:'El temporizador expiró sin recibir respuesta. El cliente aborta y vuelve a CERRADO.', formula:'δᶜ(SYN-ENV, timeout) = CERRADO' },
  'fsm-s-rcvsyn':  { titulo:'rcv_SYN', clase:'s', subtitulo:'Transición FSM', cuerpo:'El servidor detecta un paquete SYN entrante. Responde con SYN-ACK y cambia a SYN-RECIBIDO.', formula:'δˢ(ESCUCHA, rcv_SYN) = SYN-REC' },
  'fsm-s-rcvack':  { titulo:'rcv_ACK', clase:'s', subtitulo:'Transición FSM', cuerpo:'El servidor recibe el ACK que completa el handshake a 3 vías. Pasa a ESTABLECIDO.', formula:'δˢ(SYN-REC, rcv_ACK) = ESTAB' },
  'fsm-s-rcvfin':  { titulo:'rcv_FIN', clase:'s', subtitulo:'Transición FSM', cuerpo:'El servidor recibe petición de cierre (FIN) del cliente e inicia el cierre pasivo.', formula:'δˢ(ESTAB, rcv_FIN) = CERRANDO' },
  'fsm-s-to':      { titulo:'timeout', clase:'s', subtitulo:'Transición FSM (Error)', cuerpo:'Expiró el tiempo esperando el ACK final. El servidor asume fallo y retorna a ESCUCHA.', formula:'δˢ(SYN-REC, timeout) = ESCUCHA' },

  // ── Integraciones FSM ↔ Petri Net ──
  'int-coloca-syn':  { titulo:'Coloca token SYN', clase:'w', subtitulo:'Integración Autómata → Red', cuerpo:'La transición iniciar_conexion del FSM-C inyecta un token en la plaza p_buf_C de la Red de Petri.', formula:'iniciar_conexion ⇒ M(p_buf_C)++' },
  'int-entrega-syn': { titulo:'Entrega SYN a FSM', clase:'w', subtitulo:'Integración Red → Autómata', cuerpo:'La llegada de un token a p_buf_S dispara el evento rcv_SYN en el FSM-S.', formula:'M(p_buf_S)≥1 ⇒ dispara(rcv_SYN)' },
  'int-coloca-sack': { titulo:'Coloca token SYN-ACK', clase:'w', subtitulo:'Integración Autómata → Red', cuerpo:'El FSM-S, al procesar rcv_SYN, genera un token para ser enviado (en t_env_SYNACK).', formula:'rcv_SYN ⇒ t_env_SYNACK habilitada' },
  'int-entrega-sack':{ titulo:'Entrega SYN-ACK a FSM', clase:'w', subtitulo:'Integración Red → Autómata', cuerpo:'La llegada del token a p_buf_C₂ dispara el evento rcv_SYN-ACK en el cliente.', formula:'M(p_buf_C₂)≥1 ⇒ dispara(rcv_SYN-ACK)' },
  'int-coloca-ack':  { titulo:'Coloca token ACK', clase:'w', subtitulo:'Integración Autómata → Red', cuerpo:'El FSM-C, al procesar rcv_SYN-ACK, genera el último token del handshake (ACK).', formula:'rcv_SYN-ACK ⇒ t_env_ACK habilitada' },
  'int-entrega-ack': { titulo:'Entrega ACK a FSM', clase:'w', subtitulo:'Integración Red → Autómata', cuerpo:'La llegada del token a t_ent_ACK notifica al servidor (rcv_ACK).', formula:'t_ent_ACK disparada ⇒ dispara(rcv_ACK)' },
  'int-inhibidor':   { titulo:'Arco Inhibidor', clase:'w', subtitulo:'Restricción de Red de Petri', cuerpo:'Si M(p_perdido) ≥ 1, este arco bloquea la transición ent_SYN anulando la entrega del paquete, simulando pérdida de red.', formula:'M(p_perd)≥1 ⇒ ¬habilitada(ent_SYN)' },

  // ── Jerarquía de Chomsky: AFP & Turing ──
  'afp-stack': { titulo:'Autómata a Pila (AFP)', clase:'w', subtitulo:'Tipo 2 — Memoria LIFO', cuerpo:'Validador sintáctico de la Capa de Aplicación. Analiza gramáticas libres de contexto para tramas anidadas { } del stream TCP.', formula:'M_AFP = (Q, Σ, Γ, δ, q₀, Z₀, F)' },
  'mt-tape':   { titulo:'Máquina de Turing (MT)', clase:'w', subtitulo:'Tipo 0 — Cómputo Universal', cuerpo:'Motor criptográfico en cinta infinita. Transforma y cifra celda a celda los bytes de control y datos antes de la transmisión.', formula:'M_MT = (Q, Σ, Γ, δ, q₀, B, F)' },
};

function initTooltips() {
  if (document.getElementById('tooltip-popup')) return;
  const tip = document.createElement('div');
  tip.id = 'tooltip-popup';
  document.body.appendChild(tip);
  let hideTimer = null;

  function mostrarTip(data, x, y) {
    clearTimeout(hideTimer);
    tip.innerHTML = `
      <div class="tip-subtitulo">${data.subtitulo}</div>
      <div class="tip-titulo ${data.clase}">${data.titulo}</div>
      <div class="tip-cuerpo">${data.cuerpo}</div>
      <span class="tip-formula">${data.formula}</span>
    `;
    posicionarTip(x, y);
    tip.classList.add('visible');
  }

  function ocultarTip() {
    hideTimer = setTimeout(() => tip.classList.remove('visible'), 100);
  }

  function posicionarTip(mx, my) {
    const margen = 16;
    const w = tip.offsetWidth  || 280;
    const h = tip.offsetHeight || 130;
    let left = mx + margen;
    let top  = my + margen;
    if (left + w > window.innerWidth  - 8) left = mx - w - margen;
    if (top  + h > window.innerHeight - 8) top  = my - h - margen;
    tip.style.left = left + 'px';
    tip.style.top  = top  + 'px';
  }

  document.addEventListener('mousemove', e => {
    if (tip.classList.contains('visible')) posicionarTip(e.clientX, e.clientY);
  });

  function bindTips() {
    // Botones con data-tip
    document.querySelectorAll('[data-tip]').forEach(el => {
      el.addEventListener('mouseenter', e => {
        const data = TIP_DATA[el.dataset.tip];
        if (data) mostrarTip(data, e.clientX, e.clientY);
      });
      el.addEventListener('mouseleave', ocultarTip);
    });

    // SVG: plazas, transiciones y estados FSM — se bindean por su ID
    const svgSel = [
      'circle[id^="pn-"]',
      'circle[id^="ec-"]',
      'circle[id^="es-"]',
      'rect[id^="tr-"]',
      '.flecha-hover'
    ].join(', ');

    // Notice we use the SVG selectors globally so it works on any view
    document.querySelectorAll(svgSel).forEach(el => {
      let key = el.id;
      // if it's a flecha-hover, it uses data-tip instead of id
      if (el.classList.contains('flecha-hover')) {
          key = el.dataset.tip;
      }
      if (!key || !TIP_DATA[key]) return;
      el.addEventListener('mouseenter', e => mostrarTip(TIP_DATA[key], e.clientX, e.clientY));
      el.addEventListener('mouseleave', ocultarTip);
    });
  }
  bindTips();
}
