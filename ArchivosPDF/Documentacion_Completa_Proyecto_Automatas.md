# AUTÓMATAS, REDES DE PETRI, PILA Y TURING: SINERGIA FORMAL PARA EL DISEÑO DE SISTEMAS COMPLEJOS MEDIANTE EL PROTOCOLO TCP

---

**DOCENTE:**  
**LUIS TOVAR GARRIDO**

**AUTORES:**  
* **DAVID ELÍAS BOSSIO PÉREZ**  
* **JORGE ELIÉCER BUITRAGO SALAMANCA**  
* **CAMILO ANDRÉS MIRANDA ACOSTA**  

**UNIVERSIDAD DE CARTAGENA**  
**FACULTAD DE INGENIERÍA**  
**PROGRAMA DE INGENIERÍA DE SISTEMAS**  
**CARTAGENA DE INDIAS**  
**2026**

---

## RESUMEN EJECUTIVO

El presente documento constituye la memoria técnica y formalización teórica del proyecto de investigación y desarrollo centrado en la modelación, verificación y simulación integral de protocolos de comunicación mediante los cuatro pilares fundamentales de la **Teoría de Autómatas y Lenguajes Formales**: Autómatas Finitos Deterministas (**AFD**, Tipo 3), Redes de Petri con Arcos Inhibidores (**PN**, Concurrencia Distribuida), Autómatas con Pila (**AFP**, Tipo 2) y Máquinas de Turing (**MT**, Tipo 0).

Tomando como objeto de estudio el protocolo de transporte **TCP (Transmission Control Protocol, RFC 793)**, se formula un ecosistema composicional y simultáneo donde la sesión de conexión es gobernada por AFDs en los extremos del Cliente y el Servidor, el canal asíncrono y no confiable es modelado por una Red de Petri con arcos de inhibición de fallo, la validación sintáctica de las tramas y delimitadores balanceados de la capa de aplicación es evaluada por un Autómata con Pila, y el procesamiento criptográfico celda a celda de la carga útil es ejecutado por una Máquina de Turing. A través de este marco unificado, se demuestran formalmente propiedades críticas de sistemas concurrentes: ausencia de interbloqueo (*deadlock*), acotación de memoria (*k-boundedness*), vivacidad (*liveness*), alcanzabilidad de estados de aceptación en lógica temporal CTL, tiempo de análisis sintáctico lineal $O(n)$ y decidibilidad acotada en tiempo de ejecución.

---

## 1. DEFINICIÓN Y TEORÍA DE AUTÓMATAS

### 1.1 Concepto y Origen
Un **autómata** es un modelo matemático abstracto de un sistema de cómputo que procesa una secuencia discreta de símbolos de entrada y, según su configuración o estado interno actual y un conjunto de reglas bien definidas (función de transición), evoluciona hacia un nuevo estado, pudiendo emitir salidas o alterar estructuras de almacenamiento auxiliar. Etimológicamente, el término proviene del griego *αὐτόματον* (*autómaton*), que denota aquello que «actúa por iniciativa propia» o «espontáneo».

El formalismo moderno de la computación nació en 1936 con el trabajo fundacional de **Alan Turing** (*On Computable Numbers, with an Application to the Entscheidungsproblem*), quien introdujo la Máquina de Turing para delimitar las fronteras lógicas de lo computable. Posteriormente, **Warren McCulloch y Walter Pitts** (1943) propusieron los primeros modelos simplificados de redes neuronales lógicas, formalizados rigurosamente por **Stephen Kleene** (1951) mediante los eventos regulares y el Teorema de Kleene. En 1959, **Michael Rabin y Dana Scott** sentaron las bases algebraicas de los Autómatas Finitos Deterministas y No Deterministas, mientras que **Noam Chomsky** (1956, 1959) estructuró la universalmente aceptada **Jerarquía de Chomsky**, clasificando las gramáticas y los autómatas reconocedores en cuatro niveles jerárquicos de poder expresivo.

---

### 1.2 Autómata Finito Determinista (AFD — Tipo 3)
El **Autómata Finito Determinista** representa el modelo de cómputo con memoria acotada por excelencia. En un AFD, ante cada estado interno y cada símbolo del alfabeto de entrada, existe de manera estricta y unívoca una única transición posible.

#### Definición Formal (5-Tupla)
$$\mathcal{A} = (Q, \Sigma, \delta, q_0, F)$$

Donde cada uno de sus componentes matemáticos satisface:
* **$Q$:** Conjunto finito, no vacío, de estados discretos. Cada estado representa un modo o condición operativa del sistema en un instante de tiempo.
* **$\Sigma$ (Sigma):** Alfabeto de entrada finito y no vacío, que define los símbolos externos legibles por el autómata (ej. $\Sigma = \{\text{SYN}, \text{ACK}, \text{FIN}, \text{RST}\}$).
* **$\delta$ (Delta):** Función total de transición de estados:
  $$\delta : Q \times \Sigma \to Q$$
* **$q_0$:** Estado inicial o de partida del autómata, tal que $q_0 \in Q$.
* **$F$:** Conjunto de estados de aceptación o finales, con $F \subseteq Q$.

#### Función de Transición Extendida ($\delta^*$)
Para describir el comportamiento del autómata frente a cadenas completas de longitud arbitraria $w \in \Sigma^*$, se define recursivamente la función de transición extendida $\delta^* : Q \times \Sigma^* \to Q$:
$$\delta^*(q, \epsilon) = q$$
$$\delta^*(q, wa) = \delta(\delta^*(q, w), a), \quad \forall w \in \Sigma^*, \; a \in \Sigma$$
Donde $\epsilon$ denota la cadena vacía. El lenguaje reconocido o aceptado por el autómata $\mathcal{A}$ se formaliza como:
$$L(\mathcal{A}) = \{ w \in \Sigma^* \mid \delta^*(q_0, w) \in F \}$$

---

### 1.3 Autómata Finito No Determinista (AFND)
En el **Autómata Finito No Determinista**, el sistema puede ramificarse en múltiples estados sucesores simultáneos ante un mismo símbolo de entrada, e inclusive realizar transiciones espontáneas sin consumir símbolos de la cinta mediante transiciones vacías ($\epsilon$).

#### Definición Formal
$$\mathcal{A}_{\text{ND}} = (Q, \Sigma, \delta_{\text{ND}}, q_0, F)$$
Donde la función de transición mapea hacia el conjunto potencia (conjunto de todas las partes) de estados:
$$\delta_{\text{ND}} : Q \times (\Sigma \cup \{\epsilon\}) \to 2^Q$$

> **Teorema de Rabin y Scott (1959):**  
> Para todo Autómata Finito No Determinista $\mathcal{A}_{\text{ND}}$, existe un Autómata Finito Determinista equivalente $\mathcal{A}_{\text{D}}$ tal que $L(\mathcal{A}_{\text{ND}}) = L(\mathcal{A}_{\text{D}})$. La demostración constructiva se realiza mediante el algoritmo de construcción por subconjuntos (*subset construction*), acotando el número de estados a $|Q_D| \le 2^{|Q_{ND}|}$.

---

### 1.4 Extensiones de los Autómatas Finitos
Para modelar requerimientos ingenieriles reales, el autómata finito clásico se amplía en las siguientes variantes:

| Tipo de Extensión | Características y Capacidad Formal | Uso en Ingeniería |
| :--- | :--- | :--- |
| **Autómata de Mealy** | Las salidas emitidas dependen del estado actual Y del símbolo de entrada consumido ($\lambda : Q \times \Sigma \to \Delta$). | Controladores reactivos por eventos y circuitos secuenciales síncronos. |
| **Autómata de Moore** | La salida depende única y exclusivamente del estado actual ($\lambda : Q \to \Delta$). | Arquitecturas de microprocesadores y máquinas de estado para protocolos con salidas de nivel. |
| **Autómata Temporizado (TA)** | Introduce variables de reloj continuo $\mathbb{R}_{\ge 0}$ con guardas temporales e invariantes (Formalismo de Alur y Dill, 1994). | Verificación formal de sistemas de tiempo real y protocolos con *timeouts* estrictos. |
| **Autómata Híbrido (HA)** | Fusiona ecuaciones diferenciales ordinarias continuas en los vértices con transiciones discretas instantáneas. | Sistemas ciberfísicos (CPS), robótica autónoma y control de procesos químicos. |
| **Statecharts (Harel, 1987)** | Estructura jerárquica con super-estados, historia y concurrencia ortogonal sintáctica (adoptado por UML/SysML). | Especificación de software aeroespacial y automotriz complejo. |

---

### 1.5 Autómata con Pila (AFP / PDA — Tipo 2)
El **Autómata con Pila** amplía las capacidades de un autómata finito añadiendo una estructura de memoria auxiliar ilimitada que opera bajo la disciplina **LIFO** (*Last In, First Out*). Este dispositivo es el reconocedor natural de los **Lenguajes Libres de Contexto (CFL)** en la Jerarquía de Chomsky.

#### Definición Formal (7-Tupla)
$$M_{\text{AFP}} = (Q, \Sigma, \Gamma, \delta, q_0, Z_0, F)$$

Donde:
* **$Q$:** Conjunto finito de estados de control.
* **$\Sigma$:** Alfabeto finito de entrada.
* **$\Gamma$ (Gamma):** Alfabeto finito de la pila (símbolos que pueden ser apilados).
* **$q_0 \in Q$:** Estado inicial de control.
* **$Z_0 \in \Gamma$:** Símbolo inicial o marcador de fondo de pila.
* **$F \subseteq Q$:** Conjunto de estados de aceptación.
* **$\delta$:** Función de transición definida como:
  $$\delta : Q \times (\Sigma \cup \{\epsilon\}) \times \Gamma \to \mathcal{P}_{\text{fin}}(Q \times \Gamma^*)$$

#### Operaciones sobre la Pila
En cada transición, en función del estado actual, el símbolo de entrada leído (o $\epsilon$) y el símbolo en el tope de la pila, el AFP puede:
1. **PUSH (Apilar):** Reemplazar el símbolo del tope $A \in \Gamma$ por una cadena de dos o más símbolos (ej. $BA$), aumentando la profundidad de la pila.
2. **POP (Desapilar):** Reemplazar el tope $A$ por la cadena vacía $\epsilon$, eliminando el elemento.
3. **NOOP / Reemplazo:** Sustituir $A$ por otro símbolo $B \in \Gamma$, manteniendo la profundidad de la pila.

#### Criterios de Aceptación
1. **Por Estado Final:** $L(M) = \{ w \in \Sigma^* \mid (q_0, w, Z_0) \vdash^* (q_f, \epsilon, \alpha), \; q_f \in F, \; \alpha \in \Gamma^* \}$
2. **Por Pila Vacía:** $N(M) = \{ w \in \Sigma^* \mid (q_0, w, Z_0) \vdash^* (q, \epsilon, \epsilon), \; q \in Q \}$
Ambos criterios son matemáticamente equivalentes en capacidad expresiva para la clase general de lenguajes libres de contexto.

---

### 1.6 Máquina de Turing (MT — Tipo 0)
La **Máquina de Turing** es el modelo matemático definitivo de la computación universal. Dispone de una cinta de longitud infinita dividida en celdas discretas y un cabezal de lectura y escritura bidireccional. De acuerdo con la **Tesis de Church-Turing**, cualquier algoritmo realizable en el universo físico puede ser computado por una Máquina de Turing.

#### Definición Formal (7-Tupla)
$$M_{\text{MT}} = (Q, \Sigma, \Gamma, \delta, q_0, B, F)$$

Donde:
* **$Q$:** Conjunto finito de estados de control interno.
* **$\Sigma$:** Alfabeto de entrada (sin el símbolo blanco $B$).
* **$\Gamma$:** Alfabeto completo de la cinta, tal que $\Sigma \subset \Gamma$ y $B \in \Gamma$.
* **$B \in \Gamma \setminus \Sigma$:** Símbolo blanco (*Blank*), que llena inicialmente todas las celdas infinitas no ocupadas por la entrada.
* **$q_0 \in Q$:** Estado inicial.
* **$F \subseteq Q$:** Conjunto de estados de parada y aceptación ($q_{\text{halt}}$).
* **$\delta$:** Función parcial de transición:
  $$\delta : Q \times \Gamma \to Q \times \Gamma \times \{L, R, S\}$$
  Donde $L$ (*Left*), $R$ (*Right*) y $S$ (*Stationary*) indican el desplazamiento físico del cabezal.

---

## 2. DEFINICIÓN DE REDES DE PETRI

### 2.1 Origen e Intuición
Las **Redes de Petri** fueron concebidas por **Carl Adam Petri** en su tesis doctoral (*Kommunikation mit Automaten*, Universidad de Bonn, 1962). Su propósito explícito fue superar las limitaciones inherentes de los autómatas secuenciales clásicos para modelar la comunicación física, la causalidad local y la concurrencia verdadera en sistemas distribuidos.

Una Red de Petri es formalmente un **grafo bipartito dirigido**, cuyos nodos se dividen estrictamente en dos clases disjuntas:
1. **Plazas ($P$, representadas gráficamente por círculos $\bigcirc$):** Modelan condiciones lógicas, estados locales, buffers de almacenamiento o recursos disponibles.
2. **Transiciones ($T$, representadas por rectángulos o barras $\square$):** Modelan eventos discretos, transformaciones o acciones dinámicas del sistema.

Las conexiones dirigidas (arcos) solo pueden vincular plazas con transiciones o transiciones con plazas, nunca nodos del mismo tipo. La distribución instantánea de **tokens** o marcas discretas ($\bullet$) en las plazas define el **marcado del sistema**, que representa el estado global distribuido.

---

### 2.2 Definición Formal (5-Tupla)
$$N = (P, T, F, W, M_0)$$

Donde:
* **$P = \{p_1, p_2, \dots, p_n\}$:** Conjunto finito de plazas.
* **$T = \{t_1, t_2, \dots, t_m\}$:** Conjunto finito de transiciones, con $P \cap T = \emptyset$.
* **$F \subseteq (P \times T) \cup (T \times P)$:** Relación de flujo o arcos orientados.
* **$W : F \to \mathbb{N}^+$:** Función de peso de los arcos (si se omite, $W(f) = 1$).
* **$M_0 : P \to \mathbb{N}$:** Marcado inicial que asigna a cada plaza su número inicial de tokens.

---

### 2.3 Semántica de Disparo y Dinámica de Estados

#### Regla de Habilitación
Una transición $t \in T$ está **habilitada** en un marcado $M$ si y solo si todas sus plazas de entrada contienen un número de tokens mayor o igual al peso del arco que las conecta con $t$:
$$t \text{ está habilitada en } M \iff \forall p \in {}^\bullet t : M(p) \ge W(p, t)$$
Donde ${}^\bullet t = \{ p \in P \mid (p, t) \in F \}$ denota el conjunto de plazas de entrada (*preset*) de la transición $t$.

#### Ecuación Fundamental de Disparo
El disparo de una transición habilitada $t$ es instantáneo y atómico, produciendo un nuevo marcado $M'$ calculado algebraicamente según:
$$M'(p) = M(p) - W(p, t) + W(t, p), \quad \forall p \in P$$
Donde $W(t, p) = 0$ si $(t, p) \notin F$.

#### Arcos Inhibidores (Inhibitor Arcs)
En una Red de Petri extendida con **arcos inhibidores** (representados con un círculo hueco en el extremo receptor $\multimap$), una transición $t$ solo está habilitada si la plaza inhibidora asociada está completamente vacía:
$$M(p_{\text{inhibidora}}) = 0$$
> **Trascendencia Teórica:**  
> Las Redes de Petri estándar con tokens enteros no pueden realizar la prueba por cero (*test-for-zero*). Dotar a una red de arcos inhibidores eleva su poder computacional al nivel de una **Máquina de Turing**, haciéndola Turing-completa (Peterson, 1981).

---

## 3. INTEGRACIÓN MULTIMODELO BAJO LA JERARQUÍA DE CHOMSKY

### 3.1 La Jerarquía de Chomsky y su Mapeo Computacional

La siguiente tabla resume la integración de los cuatro modelos de la teoría de autómatas aplicados en este proyecto:

| Nivel Chomsky | Modelo Formal | Memoria Auxiliar | Lenguajes Reconocidos | Rol en el Protocolo TCP |
| :--- | :--- | :--- | :--- | :--- |
| **Tipo 3** | **Autómata Finito Determinista (AFD)** | Memoria finita acotada ($|Q|$ estados). | Lenguajes Regulares. | Control de estados de la conexión en extremos ($A_C, A_S$). |
| **Concurrencia** | **Red de Petri con Arcos Inhibidores** | Conjunto distribuido de buffers ($P$) con arcos inhibidores. | Redes de Petri / Sistemas Concurrentes (Turing-completa). | Modelado físico del canal asíncrono, buffers y pérdidas. |
| **Tipo 2** | **Autómata con Pila (AFP)** | Memoria auxiliar infinita estructurada como Pila (LIFO). | Lenguajes Libres de Contexto (CFL). | Validador sintáctico L7 para delimitadores balanceados $\{ \dots \}$. |
| **Tipo 0** | **Máquina de Turing (MT)** | Cinta bidireccional infinita de lectura y escritura. | Lenguajes Recursivamente Enumerables. | Motor criptográfico de cifrado/descifrado y hashing en cinta. |

---

### 3.2 Cuadro Comparativo de Características Técnicas

| Criterio | AFD (Tipo 3) | Red de Petri ($N$) | AFP (Tipo 2) | Máquina de Turing (Tipo 0) |
| :--- | :--- | :--- | :--- | :--- |
| **Representación del Estado** | Estado global discreto unificado. | Marcado vectorial distribuido ($M$). | Par (Estado de control, Contenido de Pila). | Configuración (Estado, Contenido de Cinta, Posición Cabezal). |
| **Manejo de Concurrencia** | Intercalado secuencial (*interleaving*). | Concurrencia verdadera (*true concurrency*). | Secuencial estructurado. | Secuencial con cinta universal. |
| **Capacidad de Memoria** | Estrictamente finita. | Arbitraria en tokens enteros. | Infinita con disciplina LIFO. | Infinita con acceso libre bidireccional. |
| **Decidibilidad** | Completamente decidible. | Decidible para acotación y vivacidad. | Decidible para pertenencia ($w \in L$). | Indecidible en el caso general (Problema de la Parada). |
| **Herramienta de Verificación** | UPPAAL, Spin. | TINA, CPN Tools. | ANTLR, Yacc. | Simuladores de MT, Coq. |

---

### 3.3 Arquitectura de Co-Simulación en Simultáneo

La arquitectura del proyecto sincroniza los cuatro modelos en un lazo de ejecución concurrente:

1. **Capa 7 (Criptografía y Cómputo Universal - MT):**  
   Antes de transmitir, la Máquina de Turing lee el segmento en su cinta, aplica el algoritmo de cifrado celda a celda y sella la cabecera con delimitadores criptográficos (`#`).
2. **Capa 5/6 (Estructuración y Sintaxis - AFP):**  
   El Autómata a Pila valida que la trama cumpla con la gramática de delimitadores balanceados $\{^n w \}^n$. Apila `PUSH` al abrir sesiones y prepara el emparejamiento sintáctico.
3. **Capa 4 (Control de Sesión y Protocolo - AFDs):**  
   Los AFDs de Cliente ($A_C$) y Servidor ($A_S$) cambian de estado de acuerdo a los eventos de la sesión TCP (RFC 793).
4. **Capa de Transporte y Medio Físico (Concurrencia Asíncrona - Red de Petri):**  
   Los segmentos cifrados y validados viajan físicamente representados por tokens que atraviesan las plazas intermedias. Si la plaza inhibidora $p_{\text{perdido}}$ tiene un token, bloquea la transición de entrega, forzando la recuperación por *timeout*.

---

## 4. JUSTIFICACIÓN DE LA COMBINACIÓN MULTIMODELO

### 4.1 El Problema de la Explosión Combinatoria de Estados
Si se modelara un protocolo distribuido completo (con $n$ componentes concurrentes donde cada uno posee $k$ estados locales) utilizando únicamente un Autómata Finito global, el número de estados totales crecería exponencialmente:
$$|Q_{\text{global}}| = k^n$$

* Para $n = 10$ entidades con $k = 3$ estados: $3^{10} = 59.049$ estados.
* Para $n = 50$ componentes con 2 estados: $2^{50} \approx 1,12 \times 10^{15}$ estados.

Por el contrario, una **Red de Petri** representa el mismo sistema concurrente de manera compacta mediante $n$ plazas y marcas de tokens, evitando la enumeración exhaustiva del espacio de estados. Al desacoplar la concurrencia en la Red de Petri, la estructura sintáctica en el AFP y la transformación de datos en la MT, la complejidad del sistema se mantiene computable y tratable en tiempo polinomial.

---

## 5. APLICACIÓN FORMAL: EL PROTOCOLO TCP MULTIMODELO

### 5.1 Protocolo Base: Three-Way Handshake
El protocolo TCP (RFC 793, Postel, 1981) establece una conexión bidireccional fiable sobre un canal IP no confiable mediante tres segmentos iniciales:
1. **Paso 1 (SYN):** El Cliente envía un segmento con el flag de sincronización `SYN` y su número de secuencia inicial ($ISN_C$).
2. **Paso 2 (SYN-ACK):** El Servidor responde con `SYN` y acuse `ACK`, reconociendo $ISN_C + 1$ y proponiendo su propio $ISN_S$.
3. **Paso 3 (ACK):** El Cliente confirma $ISN_S + 1$ enviando `ACK`. Ambos extremos alcanzan el estado `ESTABLECIDO`.

---

### 5.2 Formalización de los Componentes

#### A. FSM Cliente (AFD: $A_C$)
$$A_C = (Q_C, \Sigma, \delta_C, \text{CERRADO}, \{\text{ESTABLECIDO}\})$$
* **$Q_C$:** $\{\text{CERRADO}, \text{SYN-ENVIADO}, \text{ESTABLECIDO}, \text{FIN-ESPERA}\}$
* **$\Sigma$:** $\{\text{iniciar\_conexion}, \text{rcv\_SYN-ACK}, \text{timeout}, \text{iniciar\_cierre}, \text{rcv\_FIN-ACK}\}$
* **Transiciones principales:**
  * $\delta_C(\text{CERRADO}, \text{iniciar\_conexion}) = \text{SYN-ENVIADO}$
  * $\delta_C(\text{SYN-ENVIADO}, \text{rcv\_SYN-ACK}) = \text{ESTABLECIDO}$
  * $\delta_C(\text{SYN-ENVIADO}, \text{timeout}) = \text{CERRADO}$
  * $\delta_C(\text{ESTABLECIDO}, \text{iniciar\_cierre}) = \text{FIN-ESPERA}$

#### B. FSM Servidor (AFD: $A_S$)
$$A_S = (Q_S, \Sigma, \delta_S, \text{ESCUCHA}, \{\text{ESTABLECIDO}\})$$
* **$Q_S$:** $\{\text{ESCUCHA}, \text{SYN-RECIBIDO}, \text{ESTABLECIDO}, \text{CERRANDO}\}$
* **$\Sigma$:** $\{\text{rcv\_SYN}, \text{rcv\_SYN\_OFF}, \text{rcv\_ACK}, \text{timeout\_srv}, \text{rcv\_FIN}\}$
* **Transiciones principales:**
  * $\delta_S(\text{ESCUCHA}, \text{rcv\_SYN}) = \text{SYN-RECIBIDO}$
  * $\delta_S(\text{ESCUCHA}, \text{rcv\_SYN\_OFF}) = \text{ESCUCHA} \quad [\text{Emite RST}]$
  * $\delta_S(\text{SYN-RECIBIDO}, \text{rcv\_ACK}) = \text{ESTABLECIDO}$
  * $\delta_S(\text{SYN-RECIBIDO}, \text{timeout\_srv}) = \text{ESCUCHA}$

#### C. Red de Petri del Canal ($N_{\text{canal}}$)
$$N_{\text{canal}} = (P, T, F, W, M_0)$$
* **Plazas ($P$):**
  * $p_{\text{buf\_C}}$: Buffer local de salida del Cliente.
  * $p_{\text{SYN}}$: Paquete SYN en tránsito en la red.
  * $p_{\text{buf\_S}}$: Buffer local de entrada del Servidor.
  * $p_{\text{SYNACK}}$: Paquete SYN-ACK en tránsito hacia el Cliente.
  * $p_{\text{buf\_C}_2}$: Buffer local de recepción en el Cliente.
  * $p_{\text{ACK}}$: Paquete ACK en tránsito hacia el Servidor.
  * $p_{\text{perdido}}$: Plaza inhibidora de fallo.
* **Transiciones ($T$):** $\{\text{env\_SYN}, \text{ent\_SYN}, \text{env\_SYNACK}, \text{ent\_SYNACK}, \text{env\_ACK}, \text{ent\_ACK}\}$
* **Arco Inhibidor:** $p_{\text{perdido}} \multimap \text{ent\_SYN}$. Habilita $\text{ent\_SYN} \iff M(p_{\text{SYN}}) \ge 1 \land M(p_{\text{perdido}}) = 0$.

#### D. Autómata con Pila del Payload ($M_{\text{AFP}}$)
$$M_{\text{AFP}} = (Q_P, \Sigma_P, \Gamma, \delta_P, q_0, Z_0, \{q_{\text{acc}}\})$$
* **Estados ($Q_P$):** $\{q_0, q_1, q_{\text{ack}}, q_2, q_{\text{stream}}, q_{\text{acc}}, q_{\text{err}}\}$
* **Alfabeto de Pila ($\Gamma$):** $\{Z_0, \{, \}, \text{SYN}, \text{SACK}, \text{ACK}, D_i\}$
* **Transiciones representativas:**
  * $\delta_P(q_0, "\{", Z_0) = (q_1, "\{Z_0")$ $\to$ Operación `PUSH "{"`
  * $\delta_P(q_1, "\text{SYN}", "\{") = (q_1, "\text{SYN}\{Z_0")$ $\to$ Operación `PUSH "SYN"`
  * $\delta_P(q_1, "\text{rcv\_SYN}", "\text{SYN}") = (q_{\text{ack}}, "\text{SACK}") $ $\to$ Operación `POP / PUSH`
  * $\delta_P(q_2, "\}", "\{") = (q_{\text{acc}}, "Z_0")$ $\to$ Operación `POP "{"` (Aceptación ✓)

#### E. Máquina de Turing de Cifrado y Cómputo ($M_{\text{MT}}$)
$$M_{\text{MT}} = (Q_{\text{MT}}, \Sigma_{\text{MT}}, \Gamma_{\text{cinta}}, \delta_{\text{MT}}, q_0, B, \{q_{\text{halt}}\})$$
* **Estados:** $\{q_0, q_{\text{cifrar}}, q_{\text{write}}, q_{\text{verif}}, q_{\text{stream}}, q_{\text{wait}}, q_{\text{abort}}, q_{\text{halt}}\}$
* **Alfabeto de Cinta:** $\{B, \#, S, Y, N, A, C, K, S^*, Y^*, N^*, A^*, C^*, K^*, D_i, D_i^*\}$
* **Comportamiento en cinta:**
  * $\delta_{\text{MT}}(q_0, B) = (q_{\text{cifrar}}, B, R)$
  * $\delta_{\text{MT}}(q_{\text{cifrar}}, S) = (q_{\text{cifrar}}, S^*, R)$
  * $\delta_{\text{MT}}(q_{\text{cifrar}}, Y) = (q_{\text{cifrar}}, Y^*, R)$
  * $\delta_{\text{MT}}(q_{\text{cifrar}}, N) = (q_{\text{write}}, N^*, R)$
  * $\delta_{\text{MT}}(q_{\text{verif}}, \#) = (q_{\text{halt}}, \#, S) \quad [\text{HALT - Parada por Éxito}]$

---

## 6. PROPIEDADES VERIFICABLES DEL MODELO COMPUESTO

| Propiedad | Definición Matemática Formal | Interpretación en el Protocolo | Verificación |
| :--- | :--- | :--- | :--- |
| **Ausencia de Deadlock** | $\neg \exists M : \forall t \in T, \; t \text{ no habilitada en } M$ | Ningún paquete queda bloqueado permanentemente en el canal sin progresar o abortar. | Demostrado en TINA / Petri. |
| **Acotación ($k$-Boundedness)** | $\exists k \in \mathbb{N} : M(p) \le k, \; \forall M \text{ alcanzable}$ | Los buffers locales no sufren desbordamiento ($k=1$ para canales simplex por paso). | Demostrado formalmente. |
| **Vivacidad (Liveness)** | $\forall t \in T, \; \forall M \in [M_0\rangle, \; \exists \sigma : M \xrightarrow{\sigma} M' \land t \text{ habilitada en } M'$ | Todos los eventos de transmisión pueden volver a ejecutarse en conexiones sucesivas. | Verificado en UPPAAL. |
| **Alcanzabilidad de ESTABLECIDO** | $E\langle\rangle(A_C = \text{ESTABLECIDO} \land A_S = \text{ESTABLECIDO})$ | Existe al menos una traza válida de ejecución que conduce a ambos extremos a la sesión activa. | Expresión CTL en UPPAAL ✓. |
| **Corrección bajo Pérdida** | $A[] \, \text{not deadlock (con } p_{\text{perdido}} \text{ activo)}$ | Ante pérdida de paquetes, el temporizador del AFD garantiza retorno a CERRADO sin bloqueo. | Verificado con arcos inhibidores. |
| **Parsing Lineal del AFP** | $|\delta(q, a, X)| + |\delta(q, \epsilon, X)| \le 1$ | La gramática de delimitadores de la capa de aplicación es determinista ($LL(1)$), analizada en tiempo $O(n)$. | Propiedad DPDA verificada. |
| **Decidibilidad de la MT** | $\forall w \in \Sigma^*, \; (q_0, w) \vdash^* (q_{\text{halt}}, u \underline{\alpha} v)$ | Para cualquier mensaje acotado por MTU, la MT alcanza siempre el estado de parada $q_{\text{halt}}$. | Decidibilidad demostrada. |

---

## 7. DINÁMICA DE LOS ESCENARIOS SIMULADOS

### Escenario 1: Handshake Normal y Cómputo Exitoso
1. **Paso 0:** $M_0(p) = 0$. $A_C = \text{CERRADO}$, $A_S = \text{ESCUCHA}$. AFP en $q_0$ con pila $[Z_0]$. MT en celda 0 con cinta $[B, S, Y, N, B, \dots]$.
2. **Paso 1:** $A_C \to \text{SYN-ENVIADO}$. Token en $p_{\text{buf\_C}}$. AFP ejecuta `PUSH "{"` $\to [Z_0, \{]$. MT avanza a celda 1.
3. **Paso 2:** Dispara $\text{env\_SYN}$. Token pasa a $p_{\text{SYN}}$. AFP ejecuta `PUSH "SYN"` $\to [Z_0, \{, \text{SYN}]$. MT cifra $S \to S^*$.
4. **Paso 3:** Dispara $\text{ent\_SYN}$. Token llega a $p_{\text{buf\_S}}$. MT cifra $Y \to Y^*$.
5. **Paso 4:** $A_S \to \text{SYN-RECIBIDO}$. Token en $p_{\text{SYNACK}}$. AFP desapila `SYN` y apila `SACK`. MT sella $N \to N^*$.
6. **Paso 5:** Dispara $\text{ent\_SYNACK}$. Token en $p_{\text{buf\_C}_2}$. MT conmuta a verificación y retrocede cabezal.
7. **Paso 6:** $A_C \to \text{ESTABLECIDO}$. Token en $p_{\text{ACK}}$. AFP desapila `SACK` y apila `}`. MT valida hashes y escribe `#`.
8. **Paso 7:** Dispara $\text{ent\_ACK}$. $A_S \to \text{ESTABLECIDO}$. AFP desapila `}` alcanzando pila limpia $[Z_0]$ y estado final $q_{\text{acc}}$. MT alcanza $q_{\text{halt}}$. **Convergencia simultánea de los 4 modelos**.

### Escenario 2: Canal con Pérdida y Timeout
* El token en $p_{\text{SYN}}$ activa la plaza inhibidora $p_{\text{perdido}}$. La transición $\text{ent\_SYN}$ queda inhabilitada ($\neg \text{hab}$).
* La MT entra en estado de retención $q_{\text{wait}}$. El AFP activa temporizador de sincronización.
* Al expirar el tiempo, el AFD Cliente transiciona $\delta_C(\text{SYN-ENVIADO}, \text{timeout}) = \text{CERRADO}$.
* El AFP ejecuta vaciado de emergencia de la pila restaurándola a $[Z_0]$ ($q_{\text{err}}$).
* La MT rebobina el cabezal a la celda 0 ($q_{\text{rewind}}$), permitiendo la retransmisión limpia.

### Escenario 3: Rechazo por Servidor Inactivo (RST)
* El servidor en modo inactivo (`OFF`) recibe un `SYN`.
* El servidor emite un segmento `RST` que vacía el canal y regresa a `ESCUCHA`.
* La MT escribe el código de interrupción `[!RST!]` y transiciona al estado de parada por aborto $q_{\text{abort}}$.
* El AFP recibe la señal de reset y limpia la pila sin entrar en ciclo infinito ni bloqueo.

### Escenario 4: Apertura Simultánea (*Simultaneous Open*, RFC 793)
* Ambos extremos inician la conexión activamente al mismo tiempo.
* El canal procesa dos tokens cruzados en sentidos opuestos ($p_{\text{SYN}}$ y $p_{\text{SYNACK}}$).
* El AFP gestiona una pila dual registrando ambos identificadores $\{_C$ y $\{_S$.
* La cinta de la Máquina de Turing procesa en paralelo las regiones asignadas a cada nodo, convergiendo ambos extremos simultáneamente en el estado de aceptación `ESTABLECIDO`.

### Escenario 5: Flujo Masivo de N Paquetes (Ráfaga Continua)
* Conexión en estado permanente `ESTABLECIDO`.
* Para cada paquete $i \in \{1, \dots, N\}$, la MT procesa un byte $D_i \to D_i^*$ en la celda correspondiente de la cinta.
* El AFP apila y desapila dinámicamente tramas de datos garantizando que no existan paquetes huérfanos.
* La Red de Petri traslada ráfagas continuas de tokens a través de los canales de ida y vuelta a velocidades configurables de 1x a 5x.

---

## 8. GLOSARIO DE TÉRMINOS TÉCNICOS

* **Alfabeto ($\Sigma$):** Conjunto finito y no vacío de símbolos abstractos sobre los que opera un autómata formal.
* **Arco Inhibidor:** Conexión restrictiva en una Red de Petri que impide el disparo de una transición cuando la plaza origen contiene uno o más tokens ($M(p) \ge 1$).
* **Autómata con Pila (AFP):** Máquina abstracta dotada de memoria de acceso LIFO capaz de reconocer lenguajes generados por gramáticas libres de contexto.
* **Autómata Finito Determinista (AFD):** Modelo computacional de estados finitos donde cada par (estado, símbolo) determina unívocamente un único estado siguiente.
* **Boundedness (Acotación):** Propiedad de una Red de Petri que garantiza que el número de tokens en cualquier plaza jamás exceda un valor entero $k \in \mathbb{N}$.
* **Cabezal de Turing:** Dispositivo lógico móvil que lee, escribe y modifica celdas en una cinta infinita, desplazándose una posición a la izquierda ($L$), derecha ($R$) o neutro ($S$).
* **Deadlock (Interbloqueo):** Estado indeseable de un sistema concurrente donde ninguna transición está habilitada y el sistema no ha alcanzado un estado final de aceptación.
* **Fondo de Pila ($Z_0$):** Símbolo especial de control que reside en la base de la memoria LIFO del AFP para advertir el vaciado completo de la estructura.
* **Interleaving (Intercalado):** Semántica de simulación de concurrencia que linealiza eventos paralelos en secuencias alternadas arbitrarias.
* **Jerarquía de Chomsky:** Clasificación formal de gramáticas y máquinas de cómputo en cuatro niveles jerárquicos: Tipo 3 (Regulares), Tipo 2 (Libres de Contexto), Tipo 1 (Sensibles al Contexto) y Tipo 0 (Recursivamente Enumerables).
* **Liveness (Vivacidad):** Propiedad formal que asegura que ninguna transición del sistema queda permanentemente inhabilitada a lo largo de cualquier camino de computación.
* **Máquina de Turing:** Modelo formal de computación universal compuesto por un autómata de estados finitos y una cinta de memoria ilimitada de lectura y escritura.
* **Marcado ($M$):** Vector que representa la distribución instantánea de tokens sobre el conjunto de plazas de una Red de Petri.
* **Preset (${}^\bullet t$):** Conjunto de plazas de entrada requeridas para habilitar el disparo de una transición $t$.
* **Símbolo Blanco ($B$):** Carácter especial de la Máquina de Turing que ocupa de forma predeterminada las celdas infinitas de la cinta donde no existen datos de entrada.
* **True Concurrency (Concurrencia Verdadera):** Capacidad de disparar eventos simultáneamente de forma físicamente independiente sin requerir serialización forzada.

---

## 9. REFERENCIAS BIBLIOGRÁFICAS

1. **Alur, R., & Dill, D. L.** (1994). *A theory of timed automata*. Theoretical Computer Science, 126(2), 183–235.
2. **Chomsky, N.** (1956). *Three models for the description of language*. IRE Transactions on Information Theory, 2(3), 113–124.
3. **Hopcroft, J. E., Motwani, R., & Ullman, J. D.** (2001). *Introduction to Automata Theory, Languages, and Computation* (2nd ed.). Addison-Wesley.
4. **International Electrotechnical Commission.** (2010). *IEC 61508: Functional safety of electrical/electronic/programmable electronic safety-related systems*. IEC.
5. **Jensen, K., & Kristensen, L. M.** (2009). *Coloured Petri Nets: Modelling and Validation of Concurrent Systems*. Springer-Verlag.
6. **Kleene, S. C.** (1951). *Representation of events in nerve nets and finite automata*. RAND Corporation Research Memorandum.
7. **Murata, T.** (1989). *Petri nets: Properties, analysis and applications*. Proceedings of the IEEE, 77(4), 541–580.
8. **Petri, C. A.** (1962). *Kommunikation mit Automaten* (Doctoral dissertation). Universität Bonn.
9. **Postel, J.** (1981). *Transmission Control Protocol (RFC 793)*. Internet Engineering Task Force (IETF).
10. **Rabin, M. O., & Scott, D.** (1959). *Finite automata and their decision problems*. IBM Journal of Research and Development, 3(2), 114–125.
11. **Ramadge, P. J. G., & Wonham, W. M.** (1987). *Supervisory control of a class of discrete event processes*. SIAM Journal on Control and Optimization, 25(1), 206–230.
12. **Turing, A. M.** (1936). *On computable numbers, with an application to the Entscheidungsproblem*. Proceedings of the London Mathematical Society, Series 2, 42, 230–265.
13. **Zaitsev, D. A.** (2013). *Clans of Petri Nets: Verification of Protocols and Performance Evaluation of Networks*. LAP Lambert Academic Publishing.
