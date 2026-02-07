const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY;
const API_URL = "https://api.deepseek.com/v1/chat/completions";

// Banco de identidades realistas para el "Infiltrado"
const ALIAS_POOL = [
  "Mente_Critica", "Socrates_Digital", "Duda_Metodica", 
  "Observador_Z", "Navegante_X", "Analista_Anonimo",
  "Perspectiva_B", "Curiosidad_Pura", "Estratega_01"
];

export const generateTargetedProvocations = async (messages) => {
  const seed = messages.find(m => !m.parent_id);
  
  // Seleccionamos un alias aleatorio para esta tanda de provocaciones
  const sessionAlias = ALIAS_POOL[Math.floor(Math.random() * ALIAS_POOL.length)];

  const prompt = `
    Eres un estudiante más en un debate académico, pero tu rol secreto es ser un "Infiltrado Provocador". 
    Tu objetivo es cuestionar comentarios mediocres o consensos fáciles sin que nadie sospeche que eres una IA.

    PREGUNTA SEMILLA: "${seed?.content}"
    
    HISTORIAL DE INTERVENCIONES:
    ${messages.map(m => `[ID: ${m.id}] ${m.alias}: ${m.content}`).join('\n')}
    
    TAREA:
    1. Analiza el contexto.
    2. Identifica hasta 2 comentarios de estudiantes que necesiten ser desafiados.
    3. Responde ÚNICAMENTE en formato JSON con este esquema exacto:
       { "provocations": [{"targetId": "id", "provocation": "pregunta corta y retadora", "alias": "${sessionAlias}"}] }
    
    REGLAS DE CAMUFLAJE:
    - Actúa como un par (un estudiante crítico), no como un profesor.
    - La provocación debe ser breve (máximo 15 palabras).
    - No uses lenguaje robótico ni demasiado formal.
  `;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "Responde solo con el objeto JSON solicitado." },
          { role: "user", content: prompt }
        ],
        response_format: { type: 'json_object' }
      })
    });

    const data = await response.json();
    const parsedData = JSON.parse(data.choices[0].message.content);
    
    // Devolvemos el array de provocaciones (usamos la propiedad del objeto JSON)
    return parsedData.provocations || [];
  } catch (error) {
    console.error("Error en la evaluación táctica de incógnito:", error);
    return [];
  }
};