# Simulador y Verificador Multimodelo: TCP Handshake, Redes de Petri, AFP y Máquinas de Turing

[![Teoría de la Computación](https://img.shields.io/badge/Teor%C3%ADa_de_la_Computaci%C3%B3n-Jerarqu%C3%ADa_de_Chomsky-blue)](https://github.com/VladDracula2312/Proyecto-Automatas)
[![Despliegue Vercel](https://img.shields.io/badge/Vercel-Ready-black?logo=vercel)](https://vercel.com)
[![Licencia MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

Simulador interactivo y entorno de verificación formal que modela el protocolo de transporte **TCP (Three-Way Handshake y transmisión de datos)** integrando simultáneamente los cuatro grandes paradigmas de la **Teoría de Autómatas y Lenguajes Formales**:

1. **Tipo 3 (Regulares) — Autómatas Finitos Deterministas (AFD):** Control de sesión del Cliente ($A_C$) y del Servidor ($A_S$).
2. **Sistemas Distribuidos — Redes de Petri ($N_{\text{canal}}$):** Concurrencia asíncrona del medio físico, buffers acotados y arcos inhibidores de fallo.
3. **Tipo 2 (Libres de Contexto) — Autómata con Pila (AFP / PDA):** Parser sintáctico L7 para validación de tramas anidadas balanceadas ($\{ \dots \}$) en memoria LIFO.
4. **Tipo 0 (Recursivamente Enumerable) — Máquina de Turing (MT):** Cómputo universal y cifrado criptográfico celda a celda en cinta infinita.

---

## 🏛️ Arquitectura Multimodelo y Jerarquía de Chomsky

```
┌────────────────────────────────────────────────────────────────────────┐
│                   CAPA 7: APLICACIÓN & CRIPTOGRAFÍA                    │
│   Máquina de Turing (MT): Cifra y sella bytes en cinta infinita        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Carga útil cifrada
┌───────────────────────────────────▼────────────────────────────────────┐
│                   CAPA 5/6: VALIDACIÓN SINTÁCTICA                      │
│   Autómata con Pila (AFP): Valida delimitadores { ... } en memoria LIFO│
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Trama verificada
┌───────────────────────────────────▼────────────────────────────────────┐
│                   CAPA 4: SESIÓN Y PROTOCOLO                           │
│   AFD Cliente (Aᶜ)                      AFD Servidor (Aˢ)              │
│   [CERRADO ⇄ SYN-ENV ⇄ ESTAB]          [ESCUCHA ⇄ SYN-REC ⇄ ESTAB]     │
└───────────────────▲────────────────────────────────▲───────────────────┘
                    │        Tokens Concurrentes     │
┌───────────────────┴────────────────────────────────┴───────────────────┐
│                   CANAL ASÍNCRONO DISTRIBUIDO                          │
│   Red de Petri (Nᶜ): Plazas, Transiciones y Arco Inhibidor de Pérdida  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🔬 Modelos Formales Implementados

### 1. Autómatas Finitos Deterministas (AFD)
* **Cliente:** $A_C = (Q_C, \Sigma, \delta_C, q_0=\text{CERRADO}, F=\{\text{ESTABLECIDO}\})$
* **Servidor:** $A_S = (Q_S, \Sigma, \delta_S, q_0=\text{ESCUCHA}, F=\{\text{ESTABLECIDO}\})$
* Gobiernan los estados discretos del protocolo siguiendo el estándar RFC 793.

### 2. Red de Petri con Arcos Inhibidores
* $N_{\text{canal}} = (P, T, F, W, M_0)$
* **Plazas ($P$):** Buffers locales ($p_{\text{buf\_C}}, p_{\text{buf\_S}}, p_{\text{buf\_C}_2}$), paquetes en tránsito ($p_{\text{SYN}}, p_{\text{SYNACK}}, p_{\text{ACK}}$) y plaza de inhibición ($p_{\text{perdido}}$).
* **Transiciones ($T$):** Disparos de envío y entrega que modelan la concurrencia física.
* **Arco Inhibidor:** Bloquea $\text{ent\_SYN}$ cuando $M(p_{\text{perdido}}) \ge 1$, dotando a la red de capacidad de testeo a cero.

### 3. Autómata con Pila (AFP / PDA)
* $M_{\text{AFP}} = (Q_P, \Sigma, \Gamma, \delta_P, q_0, Z_0, \{q_{\text{acc}}\})$
* Implementa un analizador sintáctico determinista ($DPDA$) que verifica la gramática libre de contexto de la trama de aplicación:
  $$L = \{ \{^n \, w \, \}^n \mid n \ge 1 \}$$
* En cada paso de transmisión apila (`PUSH`) delimitadores o desapila (`POP`) confirmaciones, garantizando aceptación final por pila limpia ($Z_0$) y estado de aceptación ($q_{\text{acc}}$).

### 4. Máquina de Turing (MT)
* $M_{\text{MT}} = (Q_{\text{MT}}, \Sigma, \Gamma_{\text{cinta}}, \delta_{\text{MT}}, q_0, B, \{q_{\text{halt}}\})$
* Dispone de un cabezal móvil bidireccional sobre una cinta infinita. Lee la cabecera del mensaje, escribe símbolos cifrados ($S^*, Y^*, N^*, \dots$), sella delimitadores criptográficos (`#`) y alcanza el estado de parada ($q_{\text{halt}}$) al completar la verificación.

---

## 🎮 Escenarios de Simulación Simultánea

* **Handshake Normal:** Los 4 modelos convergen en 7 pasos hacia sus estados de aceptación ($A_C \in F$, $A_S \in F$, AFP en $q_{\text{acc}}$, MT en $q_{\text{halt}}$).
* **Pérdida de Paquete & Timeout:** El arco inhibidor de Petri bloquea la entrega; la MT entra en espera ($q_{\text{wait}}$) y el AFP resetea la pila tras la expiración del temporizador.
* **Rechazo (RST):** El servidor inactivo emite rechazo; la MT escribe código de aborto en cinta y el AFP limpia la memoria LIFO sin bloqueo.
* **Apertura Simultánea (*Simultaneous Open*):** Resolución de condición de carrera con sincronización simétrica en la cinta de Turing y pila dual.
* **Flujo Masivo de N Paquetes (Auto-Play):** Carga continua de $N$ tramas con velocidad ajustable (1x a 5x), animando en vivo los tokens, la pila y la cinta.

---

## 📊 Propiedades Verificables

| Propiedad | Modelo | Definición Matemática | Estado |
| :--- | :--- | :--- | :--- |
| **Ausencia de Deadlock** | Petri + AFD | $\neg \exists M : \forall t \in T, \; t \text{ no habilitada en } M$ | **Verificable** |
| **Acotación (k-Boundedness)** | Red de Petri | $\exists k : M(p) \le k, \; \forall M \text{ alcanzable}$ | **Verificable** |
| **Vivacidad (Liveness)** | AFD | $\forall t \in T, \forall M, \exists \sigma : t \text{ habilitada}$ | **Verificable** |
| **Alcanzabilidad** | Lógica CTL | $E\langle\rangle(A_C = \text{ESTAB} \land A_S = \text{ESTAB})$ | **UPPAAL ✓** |
| **Parsing Lineal** | AFP (Tipo 2) | $|\delta(q, a, X)| + |\delta(q, \epsilon, X)| \le 1$ | **$O(n)$ Lineal** |
| **Decidibilidad / Parada** | MT (Tipo 0) | $\forall w \in \Sigma^*, (q_0, w) \vdash^* (q_{\text{halt}}, u \underline{\alpha} v)$ | **Decidible** |

---

## 🚀 Despliegue en Vercel

Este proyecto está listo para ser desplegado en **Vercel** de forma directa:

1. Ingresa a [Vercel](https://vercel.com) e inicia sesión con GitHub.
2. Selecciona **"Add New Project"** e importa el repositorio:
   ```
   https://github.com/VladDracula2312/Proyecto-Automatas.git
   ```
3. En **Framework Preset**, déjalo en **"Other"** (sitio estático con `vercel.json` incluido).
4. Haz clic en **Deploy**. Vercel publicará la aplicación con SSL automático y CDN global.

---

## 💻 Ejecución Local

Dado que utiliza módulos nativos ES6 y peticiones `fetch()` locales para componentes modulares HTML, debes servir la carpeta con cualquier servidor HTTP local:

### Con Python:
```bash
python -m http.server 8080
```
Luego abre tu navegador en `http://localhost:8080`.

### Con Node.js / npx:
```bash
npx serve .
```

### Con VS Code:
Instala la extensión **Live Server** y haz clic en *"Go Live"* sobre `index.html`.

---

## 👥 Créditos
* **Asignatura:** Teoría de la Computación / Autómatas y Lenguajes Formales.
* **Universidad de Cartagena** — 2026.
