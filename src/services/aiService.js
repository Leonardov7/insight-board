const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY;
const API_URL = "https://api.deepseek.com/v1/chat/completions";

const ALIAS_POOL = [
  "Mente_Critica", "Socrates_Digital", "Duda_Metodica", 
  "Observador_Z", "Navegante_X", "Analista_Anonimo",
  "Perspectiva_B", "Curiosidad_Pura", "Estratega_01"
];

// --- MÓDULO 1.2.1: AGENTE INFILTRADO ---
export const generateTargetedProvocations = async (messages) => {
  const seed = messages.find(m => !m.parent_id);
  const sessionAlias = ALIAS_POOL[Math.floor(Math.random() * ALIAS_POOL.length)];

  const prompt = `
    Eres un estudiante en un debate. Tu rol es ser un "Infiltrado Provocador".
    PREGUNTA SEMILLA: "${seed?.content}"
    HISTORIAL: ${messages.map(m => `[ID: ${m.id}] ${m.alias}: ${m.content}`).join('\n')}
    TAREA: Identifica hasta 2 comentarios y cuestiona su lógica.
    JSON: { "provocations": [{"targetId": "id", "provocation": "pregunta corta", "alias": "${sessionAlias}"}] }
  `;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${DEEPSEEK_API_KEY}` },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "system", content: "Responde solo en JSON." }, { role: "user", content: prompt }],
        response_format: { type: 'json_object' }
      })
    });
    const data = await response.json();
    return JSON.parse(data.choices[0].message.content).provocations || [];
  } catch (error) {
    console.error("Error en provocación:", error);
    return [];
  }
};

// --- MÓDULO 2.0: MONITOR SEMÁNTICO (NUEVO) ---
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

//--------------Módulo de Gamificación (Ejemplo)----------------
export const getEngagementRanking = async (messages) => {
  if (messages.length < 5) return []; // Necesitamos una base mínima de debate

  const prompt = `
    Analiza el historial de este debate académico.
    MENSAJES: ${messages.map(m => `[${m.alias}]: ${m.content}`).join('\n')}
    
    TAREA:
    Identifica a los 3 mejores participantes (excluyendo al docente).
    JSON: { "ranking": [{
      "alias": "Nombre", 
      "score": 0, 
      "badge": "Disruptor|Conector|Analista", 
      "reason": "por qué (máx 10 palabras)"
    }] }
  `;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${DEEPSEEK_API_KEY}` },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "system", content: "Analista de comportamiento académico." }, { role: "user", content: prompt }],
        response_format: { type: 'json_object' }
      })
    });
    const data = await response.json();
    return JSON.parse(data.choices[0].message.content).ranking || [];
  } catch (error) {
    console.error("Error en ranking:", error);
    return [];
  }
};