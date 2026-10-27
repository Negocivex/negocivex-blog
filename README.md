# Blog de Negocivex

Blog estático en blog.negocivex.com. Sin dependencias y alojado en Vercel, igual que Círculo Golf Indoor.

- `posts/`: un fichero por artículo. Si su fecha es futura, no sale hasta ese día (en el siguiente despliegue).
- `data/sitio.json`: datos del sitio y del piloto. **Cuando se ocupe una plaza, se baja `plazas_libres`.**
- `data/diario.md`: hechos reales que se pueden contar en X.
- `GUIA-CONTENIDO.md`: voz, reglas y ritmo de X y del blog. La siguen las tareas programadas.
- `scripts/og.py`: crea las imágenes para compartir de cada artículo.
- `node build.mjs`: genera la web en `dist/`. Si un artículo está mal (falta un campo, enlace interno roto, descripción larga), el build falla y Vercel mantiene la versión anterior.
