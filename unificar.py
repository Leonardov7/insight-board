import os

# Configuraciones
EXTENSIONES = ('.py', '.md', '.json', '.js', '.html', '.css', '.txt')
IGNORAR = {'venv', '.git', '__pycache__', 'node_modules', '.idea', '.vscode'}
NOMBRE_SALIDA = "CONTEXTO_COMPLETO_ALICIA.txt"

def construir_contexto():
    print(f"--- Iniciando compilación de contexto en: {os.getcwd()} ---")
    conteo = 0
    
    with open(NOMBRE_SALIDA, "w", encoding="utf-8") as archivo_final:
        archivo_final.write(f"RESUMEN TÉCNICO DEL PROYECTO\nRUTA: {os.getcwd()}\n\n")
        
        for raiz, carpetas, archivos in os.walk("."):
            # Filtrar carpetas para no entrar en venv ni .git
            carpetas[:] = [d for d in carpetas if d not in IGNORAR]
            
            for nombre in archivos:
                if nombre.endswith(EXTENSIONES) and nombre != "unificar.py" and nombre != NOMBRE_SALIDA:
                    ruta_completa = os.path.join(raiz, nombre)
                    
                    archivo_final.write(f"\n{'='*60}\n")
                    archivo_final.write(f"ARCHIVO: {ruta_completa}\n")
                    archivo_final.write(f"{'='*60}\n\n")
                    
                    try:
                        with open(ruta_completa, "r", encoding="utf-8") as f:
                            archivo_final.write(f.read())
                        conteo += 1
                        print(f"Añadido: {nombre}")
                    except Exception as e:
                        archivo_final.write(f"[ERROR LEYENDO ARCHIVO: {e}]\n")

    print(f"\n--- FINALIZADO ---")
    print(f"Se procesaron {conteo} archivos.")
    print(f"Archivo generado: {NOMBRE_SALIDA}")

if __name__ == "__main__":
    construir_contexto()