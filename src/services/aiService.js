const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY;
const API_URL = "https://api.deepseek.com/v1/chat/completions";

const ALIAS_POOL = [
  "Mente_Critica", "Socrates_Digital", "Duda_Metodica", 
  "Observador_Z", "Navegante_X", "Analista_Anonimo",
  "Perspectiva_B", "Curiosidad_Pura", "Estratega_01"
];

// --- MÓDULO 1.2.1: AGENTE INFILTRADO (FILTRO DE SEGURIDAD NIVEL 3) ---
export const generateTargetedProvocations = async (messages) => {
  if (!messages || messages.length === 0) return [];

  // Localizamos la semilla (Primer comentario del docente)
  const seed = messages.find(m => !m.parent_id);
  
  // Lista de alias prohibidos con limpieza de strings
  const forbiddenAliases = ['docente', 'profesor', 'profesora', 'catedratico', 'admin', 'administrador', 'instructor'];
  
  // FILTRO QUIRÚRGICO:
  const validTargets = messages.filter(m => {
    const aliasClean = m.alias?.toLowerCase().trim();
    return (
      m.parent_id !== null &&            // 1. Si no tiene padre, es la semilla (DOCENTE). EXCLUIDO.
      m.id !== seed?.id &&               // 2. Verificación por ID de la semilla. EXCLUIDO.
      !m.is_ai &&                        // 3. No es un mensaje previo de la IA.
      !forbiddenAliases.includes(aliasClean) && // 4. El alias no coincide con roles de autoridad.
      !messages.some(reply => reply.parent_id === m.id && reply.is_ai) // 5. No ha sido provocado ya.
    );
  });

  // Si no hay estudiantes aptos para ser provocados, abortamos misión
  if (validTargets.length === 0) {
    console.log("🛡️ Filtro Activo: No hay objetivos estudiantiles válidos (Docente y Semilla protegidos).");
    return [];
  }

  const sessionAlias = ALIAS_POOL[Math.floor(Math.random() * ALIAS_POOL.length)];

  const prompt = `
    Eres un estudiante en un debate. Tu rol es ser un "Infiltrado Provocador".
    PREGUNTA SEMILLA (NO ATACAR): "${seed?.content}"
    
    LISTA DE ESTUDIANTES REALES (Elige EXACTAMENTE UNO para cuestionar): 
    ${validTargets.map(m => `[ID: ${m.id}] ${m.alias}: ${m.content}`).join('\n')}
    
    TAREA: 
    1. Identifica EXACTAMENTE 1 comentario de la lista de estudiantes anterior.
    2. Cuestiona su lógica de forma incisiva pero educada.
    3. REGLA DE ORO: Tienes estrictamente prohibido dirigirte al docente, cuestionar la semilla o responder a otros bots. Tu foco es el estudiante.
    
    JSON: { "provocations": [{"targetId": "id_elegido", "provocation": "pregunta corta", "alias": "${sessionAlias}"}] }
  `;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${DEEPSEEK_API_KEY}` },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "Responde solo en JSON." }, 
          { role: "user", content: prompt }
        ],
        response_format: { type: 'json_object' }
      })
    });
    
    const data = await response.json();
    const content = data.choices[0].message.content;
    const result = JSON.parse(content).provocations || [];
    
    // Garantizamos una sola participación por ejecución
    return result.slice(0, 1);
    
  } catch (error) {
    console.error("Error en provocación:", error);
    return [];
  }
};

// --- MÓDULO 2.0: MONITOR SEMÁNTICO (ORIGINAL COMPLETO) ---
export const getSemanticClusters = async (messages) => {
  if (messages.length < 3) return [];

  const prompt = `
    Analiza este debate y agrupa los mensajes en 3 o 4 categorías temáticas.
    MENSAJES: ${messages.map(m => `- ${m.content}`).join('\n')}
    JSON: { "clusters": [{"topic": "Título", "summary": "Resumen", "count": 0, "sentiment": "Sintonía|Divergencia"}] }
  `;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${DEEPSEEK_API_KEY}` },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "system", content: "Analista de datos cualitativos." }, { role: "user", content: prompt }],
        response_format: { type: 'json_object' }
      })
    });
    const data = await response.json();
    return JSON.parse(data.choices[0].message.content).clusters || [];
  } catch (error) {
    console.error("Error en clustering:", error);
    return [];
  }
};

// --- MÓDULO 3.0: GAMIFICACIÓN ROBUSTA (ORIGINAL COMPLETO) ---
export const getEngagementRanking = async (messages) => {
  // 1. CONTEXTO TOTAL: Enviamos todo para que la IA entienda la jerarquía
  const fullContext = messages.map(m => ({
    role: m.alias?.toLowerCase() === 'docente' ? 'VERDAD_ACADÉMICA' : (m.is_ai ? 'PROVOCADOR' : 'ESTUDIANTE'),
    alias: m.alias,
    content: m.content
  }));

  // 2. CANDIDATOS: Filtramos para que solo los estudiantes reales puedan ganar medallas
  const students = messages.filter(m => 
    !m.is_ai && 
    m.alias?.toLowerCase() !== 'docente' && 
    m.alias?.toLowerCase() !== 'profesor'
  );

  console.log(`📊 [ANALISTA] Estudiantes reales para evaluar: ${students.length}`);

  // Umbral de 5 mensajes de alumnos para asegurar que hay debate real
  if (students.length < 5) {
    console.warn("⚠️ [ANALISTA] Base insuficiente para ranking riguroso (min 5 alumnos).");
    return [];
  }

  const prompt = `
    Actúa como un Evaluador Académico Estricto. Tu tarea es generar el Top 3 (Cuadro de Honor).
    
    CONTEXTO DEL DEBATE:
    ${JSON.stringify(fullContext)}

    REGLAS DE ORO PARA EL RANKING:
    1. ANCLA DE VERDAD: Usa los mensajes marcados como 'VERDAD_ACADÉMICA' (Docente) como la única fuente de verdad técnica. 
    2. PENALIZACIÓN TROLL: Si un estudiante dice algo técnicamente incorrecto, absurdo o que parece una burla (ej: definir Arduino como un zapato o una empanada), QUÉDALO FUERA del ranking inmediatamente. No importa cuántas veces haya participado.
    3. RIGOR: No estás obligado a llenar los 3 puestos. Si solo 1 estudiante hizo aportes serios, pon 'null' en los otros puestos. Solo premia la calidad, la profundidad y el respeto a la verdad académica establecida por el docente.
    4. ROLES:
       - DISRUPTOR: Cuestiona con lógica superior.
       - CONECTOR: Sintetiza y une ideas del docente y compañeros de forma brillante.
       - ANALISTA: Aporta rigor técnico y precisión.

    TAREA: Devuelve un Top 3. Si un puesto no tiene un candidato digno, usa null.
    JSON: { 
      "ranking": [
        { "alias": "Nombre", "badge": "Rol", "definition": "Qué significa este rol", "reason": "Argumento pedagógico basado en su interacción" },
        null, 
        null
      ] 
    }
  `;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${DEEPSEEK_API_KEY}` },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "Eres un decano universitario imparcial y extremadamente riguroso." }, 
          { role: "user", content: prompt }
        ],
        response_format: { type: 'json_object' }
      })
    });
    
    const data = await response.json();
    const content = data.choices[0].message.content;
    const rawRanking = JSON.parse(content).ranking;
    
    const finalRanking = rawRanking.filter(item => item !== null);
    console.log("🏆 [ANALISTA] Cuadro de Honor validado:", finalRanking);
    return finalRanking;
    
  } catch (error) {
    console.error("❌ [ANALISTA] Error crítico en evaluación:", error);
    return [];
  }
};