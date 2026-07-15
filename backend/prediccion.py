"""
prediccion.py
-------------
Todo lo que tiene que ver con la Inteligencia Artificial en tiempo de uso vive aquí.

Este archivo NO sabe nada de HTTP, ni de FastAPI, ni de React.
Su única responsabilidad es: recibir los bytes de una imagen y devolver
un diccionario de Python con las predicciones.

Separarlo de main.py permite probar el modelo desde una terminal, sin
levantar el servidor.
"""

import io
import json
from pathlib import Path

import numpy as np
import tensorflow as tf
from PIL import Image

# --------------------------------------------------------------------
# Rutas
# --------------------------------------------------------------------
# Path(__file__).parent = la carpeta donde está ESTE archivo (backend/).
# Se usan rutas absolutas para que el backend funcione igual sin importar
# desde qué carpeta se ejecute el comando (en local o en Render).
CARPETA_BACKEND = Path(__file__).parent
RUTA_MODELO = CARPETA_BACKEND / "modelo" / "modelo_razas.keras"
RUTA_CLASES = CARPETA_BACKEND / "modelo" / "clases.json"
RUTA_RAZAS = CARPETA_BACKEND / "razas.json"

# El modelo fue entrenado con imágenes de 224x224 píxeles.
# Toda imagen que llegue debe redimensionarse EXACTAMENTE a este tamaño.
TAMANO_IMAGEN = (224, 224)

# --------------------------------------------------------------------
# Estado en memoria
# --------------------------------------------------------------------
# Se cargan una sola vez, cuando arranca el servidor, y quedan en RAM.
# Cargar el modelo en cada petición tardaría varios segundos: sería un error grave.
_modelo = None
_clases: list[str] = []

# La ficha informativa de cada raza. Es un JSON pequeño, se lee siempre al importar.
informacion_razas: dict = json.loads(RUTA_RAZAS.read_text(encoding="utf-8"))


def cargar_modelo() -> None:
    """
    Carga el modelo entrenado y la lista de clases en memoria.

    Se llama UNA sola vez, desde el arranque de FastAPI (ver main.py).
    Las variables quedan a nivel de módulo, así que las siguientes
    peticiones reutilizan el modelo ya cargado.
    """
    global _modelo, _clases

    if not RUTA_MODELO.exists():
        raise FileNotFoundError(
            f"No se encontró el modelo en {RUTA_MODELO}. "
            "Ejecuta primero: python entrenamiento.py"
        )

    _modelo = tf.keras.models.load_model(RUTA_MODELO)
    _clases = json.loads(RUTA_CLASES.read_text(encoding="utf-8"))

    print(f"[prediccion] Modelo cargado. {len(_clases)} razas disponibles.")


def modelo_listo() -> bool:
    """Indica si el modelo ya está en memoria. Lo usa el endpoint de salud."""
    return _modelo is not None


def procesar_imagen(contenido: bytes) -> np.ndarray:
    """
    Convierte los bytes crudos que llegan por HTTP en el tensor que espera Keras.

    Pasos:
      1. Abrir los bytes como imagen (Pillow).
      2. Convertir a RGB (descarta transparencia de PNG y arregla imágenes en
         escala de grises; el modelo siempre espera 3 canales).
      3. Redimensionar a 224x224.
      4. Convertir a un arreglo de NumPy de números decimales (0-255).
      5. Agregar una dimensión al inicio: (224, 224, 3) -> (1, 224, 224, 3).
         Keras siempre trabaja por lotes; aquí el lote es de una sola imagen.

    Ojo: aquí NO se normaliza a valores entre -1 y 1. Esa normalización está
    incluida DENTRO del modelo como una capa (ver entrenamiento.py). Así es
    imposible que el entrenamiento y la predicción usen escalas distintas.
    """
    imagen = Image.open(io.BytesIO(contenido)).convert("RGB")
    imagen = imagen.resize(TAMANO_IMAGEN)
    arreglo = np.asarray(imagen, dtype=np.float32)
    return np.expand_dims(arreglo, axis=0)


def predecir(contenido: bytes, cantidad_top: int = 3) -> dict:
    """
    Función principal del módulo: bytes de imagen -> resultado listo para JSON.

    Devuelve un diccionario con esta forma:

    {
      "raza": "Border Collie",
      "confianza": 94.31,
      "informacion": { ...ficha de razas.json... },
      "top": [
        {"raza": "Border Collie", "confianza": 94.31},
        {"raza": "Pastor Australiano", "confianza": 3.02},
        {"raza": "Akita", "confianza": 0.91}
      ]
    }
    """
    if _modelo is None:
        raise RuntimeError("El modelo no está cargado.")

    tensor = procesar_imagen(contenido)

    # verbose=0 evita que Keras imprima una barra de progreso en cada petición.
    # El resultado es un arreglo (1, 25): 25 probabilidades que suman 1.
    probabilidades = _modelo.predict(tensor, verbose=0)[0]

    # argsort ordena de menor a mayor y devuelve ÍNDICES.
    # [::-1] invierte el orden y [:cantidad_top] toma los mejores.
    indices_top = np.argsort(probabilidades)[::-1][:cantidad_top]

    top = []
    for indice in indices_top:
        clave = _clases[indice]
        ficha = informacion_razas.get(clave, {})
        top.append(
            {
                "clave": clave,
                "raza": ficha.get("nombre", clave),
                "confianza": round(float(probabilidades[indice]) * 100, 2),
            }
        )

    clave_ganadora = _clases[indices_top[0]]

    return {
        "raza": top[0]["raza"],
        "confianza": top[0]["confianza"],
        "informacion": informacion_razas.get(clave_ganadora, {}),
        "top": top,
    }
