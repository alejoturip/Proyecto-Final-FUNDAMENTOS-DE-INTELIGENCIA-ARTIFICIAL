# Guion de la Presentación — Identificador de Razas Caninas

**Duración:** 20 min máx · **Integrantes:** Alejandro y Marcos
**Sugerencia de reparto:** Alejandro (diapositivas 1–7, la parte técnica del modelo),
Marcos (diapositivas 8–13, arquitectura, resultados y demo). Ajústenlo a gusto,
pero **ambos deben hablar** (la rúbrica lo exige).

> Cómo usar este archivo: cada bloque es una diapositiva. En **negrita** va lo
> que se muestra; en _cursiva_ el guion de lo que se dice.

---

### Diapositiva 1 — Portada
**Identificador de Razas Caninas con Inteligencia Artificial**
Fundamentos de IA · 2026-A · Alejandro Fabara y Marcos ______

_"Buenos días. Presentamos una aplicación web que identifica la raza de un perro a partir de una foto, usando una red neuronal."_

---

### Diapositiva 2 — El problema y la motivación *(Alejandro)*
- Existen +340 razas; muchas se parecen entre sí.
- Útil en veterinarias, refugios y apps de adopción.
- **Aporte de la IA:** aprende sola qué rasgos distinguen cada raza.

_"Reconocer una raza a ojo requiere experiencia. Quisimos automatizarlo con visión por computadora. Elegimos clasificación de imágenes porque toca todos los temas del curso sobre un caso concreto."_

---

### Diapositiva 3 — Qué hace la aplicación *(Alejandro)*
- Subís una foto → devuelve **raza, confianza, Top 3 y ficha** de la raza.
- 25 razas · ~92% de exactitud.

_"El usuario sube una foto y en 1–2 segundos obtiene la raza más probable, qué tan segura está la red, las tres candidatas y datos de la raza."_

---

### Diapositiva 4 — Tecnologías *(Alejandro)*
- **Frontend:** React + Vite + Tailwind (Netlify)
- **Backend:** Python + FastAPI (Render)
- **IA:** MobileNetV2 + Transfer Learning + TensorFlow Lite

_"Dos aplicaciones separadas: la interfaz en React y la API en Python, que solo se conocen por una URL."_

---

### Diapositiva 5 — El modelo: Transfer Learning *(Alejandro)*
- No entrenamos desde cero (haría falta millones de imágenes).
- Partimos de **MobileNetV2 preentrenada en ImageNet** (1.2M de fotos).
- Solo le enseñamos la parte final: distinguir las 25 razas.

_"Reutilizamos una red que ya sabe ver bordes, texturas y formas, y le enseñamos solo lo nuevo. Esto es Transfer Learning y es lo que permite entrenar en una laptop."_

---

### Diapositiva 6 — Cómo se entrenó *(Alejandro)*
- **Etapa 1:** base congelada, se entrena solo la cabeza (10 épocas).
- **Etapa 2:** ajuste fino de las últimas 60 capas (learning rate 100× menor).
- Contra el sobreajuste: aumento de datos, dropout, validación, EarlyStopping.

_"En dos etapas: primero la capa nueva, después afinamos con mucho cuidado la parte alta de MobileNet para no borrar lo que ya sabía."_

---

### Diapositiva 7 — Parámetros configurables *(Alejandro)*
- Mostrar en vivo: `python entrenamiento.py --help`
- Épocas, batch size, learning rate, capas a descongelar.

_"El entrenamiento no está fijo en el código: podemos experimentar con estos hiperparámetros para buscar mejor precisión."_

---

### Diapositiva 8 — Arquitectura y flujo *(Marcos)*
- Diagrama Navegador (Netlify) ↔ Servidor (Render).
- La IA (`prediccion.py`) está **separada** del framework web (`main.py`).

_"La lógica de IA no depende de FastAPI. Si mañana cambiamos de framework, solo tocamos un archivo. Esa separación es la decisión de diseño central del proyecto."_

---

### Diapositiva 9 — El dataset *(Marcos)*
- 25 razas, 4 256 imágenes (80% entrenamiento / 20% validación).
- 21 razas de **Stanford Dogs**; 4 complementadas desde **Wikimedia Commons**.

_"Filtramos automáticamente el dataset de Stanford. Cuatro razas no estaban ahí, así que las bajamos de Wikimedia Commons con un script propio."_

---

### Diapositiva 10 — Resultados y métricas *(Marcos)*
- **Exactitud: 91.8%** en validación.
- Mejores: Pastor Alemán (F1 1.000), Caniche, Yorkshire.
- Más difíciles: Dachshund, Akita (datos de Commons, más ruidosos).
- Mostrar la **matriz de confusión**.

_"La red acierta ~92 de cada 100. Las razas que peor reconoce son justo las de fotos más heterogéneas: la calidad de los datos se refleja directo en el resultado."_

---

### Diapositiva 11 — Optimización: TensorFlow Lite *(Marcos)*
- Render Free = 512 MB; TensorFlow completo no entra.
- Convertimos a TFLite: **23 MB → 2.4 MB**, RAM ~450 MB → ~150 MB.

_"Detectamos un problema de memoria en producción y lo resolvimos cuantizando el modelo a TensorFlow Lite, sin perder precisión."_

---

### Diapositiva 12 — DEMO en vivo *(Marcos)*
1. Subir una foto clara → ver raza + confianza + Top 3.
2. Abrir "Ver métricas del modelo".
3. (Opcional) mostrar `/docs` de la API.

_"Vamos a probarlo en vivo."_ → **Tener 2–3 fotos listas de razas fáciles (pastor alemán, husky, pug).**

---

### Diapositiva 13 — Conclusiones y trabajos futuros *(ambos)*
- Transfer Learning: alta precisión con pocos datos y sin GPU.
- La calidad del dataset es tan importante como el modelo.
- Futuro: mejorar razas débiles, detectar "no es un perro", app móvil (TFLite).

_"Cerramos con lo aprendido y hacia dónde seguiría el proyecto."_

---

## Batería de preguntas difíciles (preparación para el Q&A)

**P: ¿Qué es Transfer Learning y por qué lo usaron?**
R: Reutilizar una red ya entrenada en una tarea grande (ImageNet) para otra
relacionada con pocos datos. Lo usamos porque entrenar desde cero necesitaría
millones de imágenes y una GPU potente; así logramos 92% con ~4 000 fotos.

**P: ¿Qué diferencia hay entre las capas congeladas y las entrenables?**
R: Congeladas = sus pesos no cambian durante el entrenamiento (conservan lo
aprendido de ImageNet). Entrenables = sus pesos se ajustan a nuestro problema.
En la etapa 1 congelamos todo MobileNet; en la etapa 2 descongelamos las últimas
60 capas para afinarlas.

**P: ¿Por qué dos learning rates distintos?**
R: La cabeza nueva arranca de cero y necesita pasos grandes (1e-3). En el ajuste
fino usamos 1e-5 (100× menor) para no destruir los pesos ya buenos de ImageNet.

**P: ¿Qué es overfitting y cómo lo evitaron?**
R: Cuando el modelo memoriza el entrenamiento pero falla con fotos nuevas. Lo
combatimos con aumento de datos, dropout (0.3), un 20% de validación separada y
EarlyStopping.

**P: ¿Qué significa la matriz de confusión?**
R: Cruza raza real vs. raza predicha. La diagonal son aciertos; las celdas fuera
de la diagonal, confusiones entre razas parecidas.

**P: ¿Precision vs. recall?**
R: Precision: de lo que llamó "X", cuánto era realmente X (falsos positivos).
Recall: de todos los X reales, cuántos reconoció (falsos negativos). F1 los
resume en un número.

**P: ¿Por qué el frontend es React y no Python, si pedían "en Python"?**
R: El núcleo del proyecto —la IA y la API— está en Python. React es solo la
interfaz gráfica que consume esa API, patrón estándar en aplicaciones web reales.

**P: ¿Por qué convirtieron a TensorFlow Lite?**
R: El servidor gratuito tiene 512 MB de RAM y TensorFlow completo no entra.
TFLite corre el mismo modelo con ~150 MB y un archivo de 2.4 MB.

**P: ¿Qué pasa si subo una foto que no es un perro?**
R: El modelo siempre elige la raza más parecida, pero con baja confianza. Una
mejora futura es agregar un detector previo que rechace imágenes sin perro.

**P: ¿Por qué algunas razas tienen peor precisión?**
R: Son en su mayoría las que complementamos desde Wikimedia Commons, con fotos
más variadas y ruidosas. Demuestra que la calidad de los datos limita al modelo.

**P: ¿Cómo se comunican el frontend y el backend?**
R: Por HTTP. React arma un `FormData` con la imagen y hace `POST /predecir`;
FastAPI responde un JSON. CORS autoriza que el dominio de Netlify llame al de Render.

**P: ¿Qué es el batch size y las épocas?**
R: Batch size = cuántas imágenes procesa antes de ajustar los pesos una vez.
Época = una pasada completa por todo el dataset.
