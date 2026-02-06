const AdminTools = ({ messages }) => {
  const handleSynthesize = async () => {
    console.log("Enviando mensajes a la IA para resumir...", messages);
    // Aquí conectarás con tu API de IA (GPT-4/Claude) para procesar el board
    alert("Procesando síntesis de la discusión...");
  };

  return (
    <div className="fixed bottom-24 right-6 flex flex-col gap-3">
      <button 
        onClick={handleSynthesize}
        className="bg-purple-600 hover:bg-purple-500 text-white p-4 rounded-full shadow-2xl flex items-center gap-2 font-bold transition-all transform hover:scale-105"
      >
        ✨ Sintetizar Debate (IA)
      </button>
    </div>
  );
};