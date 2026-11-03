# Challenge técnico — Integrations Technical Specialist (Toolbox)

Resolución del test técnico para el puesto de Integrations Technical Specialist. El enunciado original está en `docs/enunciado-challenge.pdf`; cada ejercicio vive en su propia carpeta con su entregable y la justificación de las decisiones tomadas.

## Ejercicios

| Carpeta | Ejercicio | Entregable | Estado |
|---------|-----------|------------|--------|
| `01-saml-assertions/` | Explicar las Assertions en SAML con un ejemplo breve | Documento | Listo |
| `02-curl-httpbin/` | Reproducir con cURL un POST a httpbin.org con headers, query params y body JSON | Comando cURL + respuesta obtenida | Listo |
| `03-jwt-decode/` | Función que decodifica el payload de un JWT sin firma ni cifrado | Código (TypeScript) + tests | Listo |
| `04-inventory-integration/` | API de integración con un proveedor de inventario: DSS y documentación (máx. 3 hojas) | Diagrama de secuencia + documento | Listo |

## Cómo leer cada ejercicio

Cada carpeta tiene un `README.md` con esta estructura:

1. **Enunciado**: el requisito textual del challenge, sin reinterpretar.
2. **Respuesta**: lo que se entrega.
3. **Supuestos y decisiones**: qué se asumió, qué es propuesta propia y por qué. Lo que pide el enunciado y lo que proponemos nosotros se marca explícitamente.

## Convenciones

- Los documentos están en castellano porque el enunciado y el equipo evaluador lo están.
- El código, los identificadores y los comentarios están en inglés, siguiendo la convención habitual de la industria.
- No se instalan dependencias que un ejercicio no necesite.
