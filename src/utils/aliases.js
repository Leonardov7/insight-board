const TECH_WORDS = [
  'CLOUD', 'NEURAL', 'CORE', 'DATA', 'LOGIC', 'CYBER', 'BIT', 'NODO', 'LINK', 'ALICIA',
  'SYNAPSE', 'QUBIT', 'CORTEX', 'AXON', 'TENSOR', 'MATRIX', 'NEXUS', 'PRIME', 'VECTOR', 'PROXY'
];

const ADJETIVOS = [
  'Digital', 'Virtual', 'Binario', 'Cuántico', 'Sincrónico', 'Neural', 'Cripto', 'Atómico', 
  'Latente', 'Sintético', 'Híbrido', 'Recursivo', 'Asíncrono', 'Heurístico', 'Lógico', 'Vectorial',
  'Cibernético', 'Algorítmico', 'Procesado', 'Distribuido', 'Persistente', 'Dinámico', 'Meta'
];

const SUJETOS = [
  'Hopper', 'Node', 'Byte', 'User', 'Core', 'Link', 'Pulse', 'Prime', 'Ghost', 'Matrix', 
  'Nexus', 'Trace', 'Spark', 'Shell', 'Grid', 'Flow', 'Array', 'Buffer', 'Cluster', 'Kernel',
  'Socket', 'Thread', 'Fiber', 'Logic', 'Mind'
];

// Genera el código de la sesión (Ej: NEURAL-A8F2)
export const generateTechCode = () => {
  const word = TECH_WORDS[Math.floor(Math.random() * TECH_WORDS.length)];
  const code = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${word}-${code}`;
};

// Genera un color Neón/Vibrante (Formato HSL para asegurar brillo)
const generateNeonColor = () => {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 80%, 60%)`; // Alta saturación y brillo medio-alto
};

/**
 * @param {Array} takenNames - Lista de nombres ya ocupados en la sesión actual
 */
export const generateAlias = (takenNames = []) => {
  let name = "";
  let attempts = 0;

  // Intentamos generar un nombre que no esté en la lista de nombres ocupados
  do {
    const adj = ADJETIVOS[Math.floor(Math.random() * ADJETIVOS.length)];
    const suj = SUJETOS[Math.floor(Math.random() * SUJETOS.length)];
    name = `${adj} ${suj}`;
    attempts++;
  } while (takenNames.includes(name) && attempts < 50);

  // Si después de 50 intentos sigue habiendo choque (clase masiva), añadimos un ID
  if (attempts >= 50) {
    name += ` ${Math.random().toString(36).substring(2, 4).toUpperCase()}`;
  }

  return {
    name: name,
    color: generateNeonColor()
  };
};