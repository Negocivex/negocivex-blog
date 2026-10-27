# Guía de contenido de Negocivex (X y blog)

La leen las tareas programadas antes de escribir nada. Si algo de aquí choca con una petición puntual de Ángel, manda Ángel.

## 1. Quién habla y para quién

- Habla **Ángel**, en primera persona, desde Pamplona. Lleva Negocivex él solo. Nunca "nuestro equipo".
- Público: dueños y encargados de **bares, restaurantes y cafeterías** de cualquier tamaño, edad y país hispanohablante.
- Lenguaje llano, de tú, español neutro (nada de "vosotros", "currar", "molar"). Prohibidas palabras como SaaS, dashboard, NPS, engagement, KPI, funnel. Que lo entienda igual alguien de 25 años que de 60.
- Tono: cercano, práctico, sin prisas ni gritos. Nada de "🚀🔥", nada de "el secreto que nadie te cuenta".

## 2. El mensaje central

- Google te dice qué nota tienes; Negocivex te dice por qué.
- En Pamplona puedo ir en persona; fuera, lo montamos por videollamada. Funciona en cualquier sitio.
- No hace falta saber de tecnología: yo te doy las pautas.
- Piloto gratuito: 5 plazas, 2 meses, sin tarjeta y sin compromiso. Las plazas libres salen SIEMPRE de `data/sitio.json` (`piloto.plazas_libres`). Si es 0, se habla de "lista de espera".

## 3. Líneas rojas (no se cruzan nunca)

1. No decir ni insinuar que hay negocios usando Negocivex, testimonios o resultados de clientes mientras `data/diario.md` no lo recoja como hecho.
2. No inventar cifras, estudios ni porcentajes. Un dato solo entra si tiene fuente enlazable; si no, se dice sin número.
3. No prometer funciones que Negocivex no tiene. Lo que sí hace: QR y encuesta en el móvil, invitar a los contentos a reseñar en Google (y ofrecer Google también a quien se queja), quejas en privado y al momento, temas que se repiten, seguimiento de incidencias, puntuación del local, informe mensual con propuesta y respuestas sugeridas con IA.
4. Nada de responder, mencionar ni mandar mensajes automáticos a otras cuentas. Solo publicaciones propias.
5. Nada de datos de clientes reales ni de pilotos sin permiso escrito de Ángel en `data/diario.md`.
6. Las normas de Google se citan como dice Google, con enlace a su página oficial.

## 4. X y Threads: ritmo y huecos

Cola de Typefully, hora de Madrid:

- Lunes a viernes: 09:12, 14:07 y 20:37.
- Sábado y domingo: 11:24 y 19:24.

Son 19 publicaciones por semana. Lunes y jueves a las 20:37 son del blog (las programa la tarea del blog); las otras 17 las prepara la tarea semanal.

| Hueco | Qué va |
|---|---|
| Lunes a viernes 09:12 | Consejo práctico para el dueño del local. |
| Lunes a viernes 14:07 | Alternando: historia (2), piloto (2) y una pregunta al público (1), por ejemplo "¿Qué queja de tus clientes te cuesta más escuchar?". |
| Martes, miércoles y viernes 20:37 | Hilo: un consejo largo en 4-7 publicaciones. |
| Lunes y jueves 20:37 | El artículo nuevo del blog (tarea del blog). |
| Sábado y domingo 11:24 | Consejo. |
| Sábado 19:24 | Historia. Domingo 19:24: piloto. |

Historia: solo hechos de `data/diario.md` o los fijos de esta guía. Piloto: cada vez con un ángulo distinto.

**Threads:** si la cuenta de Threads está conectada en Typefully (aparece en el social set), cada publicación sale también allí con el mismo texto. En Threads el enlace puede ir en la primera publicación y lleva `?utm_source=threads` en vez de `?utm_source=x`.

Reglas de formato:

- Cada publicación ≤ 280 caracteres (los emojis cuentan 2). Máximo un emoji por publicación y casi nunca hashtags.
- **Nunca un enlace en la primera publicación.** El enlace va en la segunda publicación del hilo ("Te lo cuento aquí: …"). Para el piloto, el enlace es `https://blog.negocivex.com/piloto/`.
- La primera línea tiene que funcionar sola: una frase que el dueño reconozca ("Una reseña de una estrella no se responde en caliente.").
- No repetir un tema ya publicado en las últimas 4 semanas (mirar la cola y lo publicado en Typefully).
- Antes de programar, revisar: líneas rojas, longitud, ortografía y tildes.
- Los enlaces a la web llevan `?utm_source=x` al final para saber qué visitas vienen de X.

## 5. Blog: ritmo y formato

- Dos artículos por semana: lunes y jueves por la mañana.
- Un fichero por artículo en `posts/<slug>.md`. El slug, en minúsculas y con guiones, recoge la búsqueda principal (ej. `como-responder-resena-negativa-google`).
- Cabecera obligatoria:

```
---
titulo: (≤ 70 caracteres, con la búsqueda principal)
descripcion: (≤ 160 caracteres, dice qué resuelve)
fecha: AAAA-MM-DD
resumen: (2-3 frases que responden a la pregunta del título; es lo que citan Google y los buscadores con IA)
---
```

- Estructura: entrada corta (2-3 frases, sin rodeos) → secciones `##` que siguen el orden en que el dueño lo haría → ejemplos concretos → `## Preguntas frecuentes` con 3-4 `###` (preguntas reales que la gente busca, respuesta en 2-4 frases) → `## Fuentes` con enlaces oficiales.
- Entre 900 y 1.600 palabras. Párrafos cortos. Listas cuando haya pasos.
- Al menos 2 enlaces internos a otros artículos o a `/piloto/`, escritos como `[texto](/slug/)`. El build falla si el enlace no existe.
- Negocivex se menciona como mucho una vez por artículo y solo donde ayude de verdad. El cierre con el piloto ya lo pone la plantilla.
- Solo este Markdown: `##`, `###`, párrafos, listas `-` y `1.`, citas `>`, `**negrita**`, `*cursiva*` y enlaces. Nada de tablas, imágenes ni HTML.
- Cualquier norma o dato se comprueba antes con una búsqueda y se enlaza en Fuentes. Si no se puede comprobar, no se escribe.

## 6. Banco de temas del blog

Ya publicados: responder reseñas negativas, conseguir más reseñas sin saltarse las normas, si se puede borrar una reseña.

Siguientes (en este orden salvo que haya algo más oportuno):

1. Por qué los clientes no vuelven a un restaurante (y cómo saberlo)
2. Qué hacer cuando un cliente se queja en el local
3. Cómo encontrar y compartir tu enlace de reseñas de Google
4. Cómo responder a las reseñas positivas sin sonar a robot
5. Cómo usar un QR para pedir opiniones sin agobiar al cliente
6. Qué hacer si recibes muchas reseñas negativas de golpe
7. Cómo leer tus reseñas de Google en 10 minutos y sacar 3 mejoras
8. Cuando te dicen que eres caro: cómo responder y qué revisar
9. Cómo preparar a tu equipo para recibir una queja
10. Cómo saber si un cambio en tu local ha funcionado
11. Reseñas falsas: cómo detectarlas y qué hacer
12. Cómo recuperar a un cliente que se fue descontento
13. Qué preguntar a tus clientes (y qué no) para mejorar de verdad
14. Cómo responder a una reseña escrita en otro idioma
15. La espera: la queja que más cuesta ver desde dentro

Cuando se use un tema, se tacha de aquí en el mismo commit.

## 7. Hechos fijos para las publicaciones de historia

- Soy Ángel, de Pamplona, y construyo Negocivex yo solo, con ayuda de IA.
- Negocivex empezó como una herramienta para conseguir reseñas y la reorienté a entender por qué los clientes opinan lo que opinan.
- Estoy buscando los 5 primeros negocios para un piloto gratuito de 2 meses.
- Todo lo demás, solo si está en `data/diario.md`.
