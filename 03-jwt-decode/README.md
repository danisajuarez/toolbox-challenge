# Ejercicio 3 — Decodificar un JWT

## Enunciado

> Programe en el lenguaje que prefiera, una función simple para des-encodear el contenido del siguiente token JWT (no está firmado ni encriptado). Copie y pegue el código desarrollado.

Token del enunciado:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

## Respuesta (código a entregar)

Archivo `src/decode-jwt.ts`:

```ts
export interface DecodedJwt {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  /** Raw third segment, still base64url-encoded. Not verified. */
  signature: string;
}

const BASE64URL_PATTERN = /^[A-Za-z0-9_-]*$/;

export function decodeJwt(token: string): DecodedJwt {
  const segments = token.split(".");

  if (segments.length !== 3) {
    throw new Error(
      `Invalid JWT: expected 3 dot-separated segments, got ${segments.length}`,
    );
  }

  const [header, payload, signature] = segments;

  return {
    header: decodeJsonSegment(header, "header"),
    payload: decodeJsonSegment(payload, "payload"),
    signature,
  };
}

function decodeJsonSegment(
  segment: string,
  name: "header" | "payload",
): Record<string, unknown> {
  if (!BASE64URL_PATTERN.test(segment)) {
    throw new Error(`Invalid JWT: ${name} is not base64url-encoded`);
  }

  // JWT uses base64url (RFC 4648 §5): '-' and '_' instead of '+' and '/',
  // and no '=' padding. Node's Buffer handles that alphabet natively.
  const json = Buffer.from(segment, "base64url").toString("utf8");

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error(`Invalid JWT: ${name} is not valid JSON`);
  }

  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`Invalid JWT: ${name} must be a JSON object`);
  }

  return parsed as Record<string, unknown>;
}
```

Resultado para el token del enunciado:

```json
{
  "header": { "alg": "HS256", "typ": "JWT" },
  "payload": { "sub": "1234567890", "name": "John Doe", "iat": 1516239022 },
  "signature": "SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
}
```

## Cómo ejecutarlo

Requiere Node 22.18 o superior, que ejecuta TypeScript sin compilar. No hay dependencias que instalar.

```sh
cd 03-jwt-decode
npm test          # corre los tests con el runner nativo de Node
npm run demo      # decodifica el token del enunciado
npm run decode -- <otro-token>
```

## Qué hace y por qué

Un JWT en serialización compacta son tres segmentos separados por punto: `header.payload.signature`. Header y payload son objetos JSON codificados en **base64url**; la firma es el HMAC o la firma asimétrica de `header.payload`, también en base64url. Decodificar el contenido es, en esencia, separar por punto, revertir base64url y parsear JSON.

| Decisión | Por qué |
|----------|---------|
| `Buffer.from(segment, "base64url")` | base64url no es base64: usa `-` y `_` en lugar de `+` y `/`, y no lleva padding `=`. Node lo soporta de forma nativa desde la versión 15.7, así que no hace falta reemplazar caracteres a mano ni agregar padding. |
| Validar el alfabeto con una regex antes de decodificar | El decoder de Node es tolerante: ignora caracteres inválidos en lugar de fallar. Sin la regex, un segmento corrupto llegaría a `JSON.parse` y daría un error confuso. Es una línea y mejora el mensaje de error. |
| Verificar que header y payload sean objetos JSON | La especificación (RFC 7519) exige que ambos sean objetos. Un string o un array decodificado sin error sería un token malformado que pasa en silencio. |
| Devolver la firma cruda sin verificarla | El enunciado pide decodificar, no verificar. Se devuelve el segmento para que quien lo use lo vea, y el nombre y el comentario dejan claro que no está validado. |
| Lanzar `Error` en lugar de devolver `null` | Un token inválido es un error de entrada, no un resultado vacío. Fallar explícito evita que un `null` se propague hasta un lugar donde ya no se entiende de dónde vino. |
| TypeScript sin compilador ni dependencias | Node 22.18+ ejecuta `.ts` nativamente (type stripping). Se gana tipado en el código sin agregar `typescript`, `ts-node` ni un paso de build para un ejercicio de 50 líneas. |
| Tests con `node:test` y `node:assert` | Mismo criterio: están en Node, no hay nada que instalar. Hay un test por regla: decodificación correcta, cantidad de segmentos, alfabeto base64url y tipo del contenido. |

## Lo que esta función NO hace, y por qué importa

**Decodificar no es verificar.** Cualquiera puede leer el contenido de un JWT: no está cifrado, solo codificado. Lo que impide que un atacante fabrique un token es la firma, y esta función no la valida. En producción, antes de confiar en un claim del payload, hay que:

1. Verificar la firma con la clave correspondiente al `alg` esperado (y rechazar `alg: none`).
2. Validar `exp`, `nbf`, `iss` y `aud`.
3. Usar una librería mantenida (por ejemplo `jose`) en lugar de código propio.

Un detalle del enunciado: dice que el token "no está firmado ni encriptado". El header dice `alg: HS256` y hay un tercer segmento, así que técnicamente **sí tiene firma** (es el token de ejemplo de jwt.io, firmado con el secreto `your-256-bit-secret`). Lo que no tenemos es la clave para verificarla, y el ejercicio no lo pide. "No cifrado" sí es correcto: no es un JWE.

## Supuestos y decisiones

| Tema | Decisión | Es requisito del enunciado o propuesta propia |
|------|----------|-----------------------------------------------|
| Lenguaje | TypeScript sobre Node. | El enunciado deja el lenguaje a elección. |
| Entorno de ejecución | Node 22.18+ con type stripping nativo. En versiones anteriores habría que compilar con `tsc` o renombrar a `.js` y quitar las anotaciones de tipo. | Propuesta propia. |
| Alcance | Solo decodificación. No se verifica firma ni claims. | Requisito del enunciado; la sección anterior explica el límite. |
| Validaciones de entrada | Cantidad de segmentos, alfabeto base64url y que header/payload sean objetos JSON. | Propuesta propia: lo mínimo para que un token inválido falle con un mensaje claro. |
| Portabilidad a navegador | Se usa `Buffer`, que es de Node. En navegador se reemplazaría por `atob` tras convertir base64url a base64. No se abstrajo porque el enunciado no lo pide. | Propuesta propia. |

## Fuentes

- RFC 7519, *JSON Web Token (JWT)*: https://www.rfc-editor.org/rfc/rfc7519
- RFC 7515, *JSON Web Signature (JWS)*, serialización compacta: https://www.rfc-editor.org/rfc/rfc7515
- RFC 4648 §5, *Base 64 Encoding with URL and Filename Safe Alphabet*: https://www.rfc-editor.org/rfc/rfc4648#section-5
- Node.js, `Buffer` y el encoding `base64url`: https://nodejs.org/api/buffer.html#buffers-and-character-encodings
- Node.js, ejecución nativa de TypeScript: https://nodejs.org/api/typescript.html
