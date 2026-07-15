# Carpeta del modelo

Esta carpeta está vacía a propósito. Se llena sola al ejecutar:

    python entrenamiento.py

Archivos que se generan aquí:

- `modelo_razas.keras` — la red entrenada (~15 MB). La carga `prediccion.py`.
- `clases.json` — el orden de las razas. El índice 0 del modelo corresponde
  al primer elemento de esta lista. **Sin este archivo las predicciones salen cruzadas.**

Ambos archivos deben subirse al repositorio: Render no entrena nada, solo predice.
