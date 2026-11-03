# Ejercicio 2 — POST a httpbin.org con cURL

## Enunciado

> Realice una llamada al servicio https://httpbin.org/post mediante curl, cuya respuesta sea lo más similar posible al siguiente ejemplo. Copie y pegue el código del comando utilizado.

Respuesta esperada (textual del enunciado, reformateada para lectura):

```json
{
  "args": { "type": "authorization" },
  "data": "{\n\"client_id\": \"1234\",\n\"mail\": \"1@1.com\",\n\"country\": \"AR\"\n}",
  "files": {},
  "form": {},
  "headers": {
    "Accept": "*/*",
    "Cache-Control": "no-cache",
    "Connection": "close",
    "Content-Length": "59",
    "Content-Type": "application/json",
    "Host": "httpbin.org",
    "User-Agent": "curl/7.29.0"
  },
  "json": { "client_id": "1234", "country": "AR", "mail": "1@1.com" }
}
```

## Respuesta (comando a entregar)

```sh
curl 'https://httpbin.org/post?type=authorization' \
  -H 'Content-Type: application/json' \
  -H 'Cache-Control: no-cache' \
  -H 'Connection: close' \
  -A 'curl/7.29.0' \
  --data-binary '{
"client_id": "1234",
"mail": "1@1.com",
"country": "AR"
}'
```

El mismo comando está en `request.sh`. La respuesta real obtenida está en `response.json` (con el campo `origin`, que es la IP pública de quien ejecuta, reemplazado por `<redacted>`).

## Cómo se derivó el comando

httpbin.org es un servicio de eco: devuelve lo que recibió. Por eso cada campo de la respuesta esperada dice qué tiene que llevar el request.

| Campo de la respuesta | Qué revela del request | Cómo se reproduce |
|-----------------------|------------------------|-------------------|
| `args.type = "authorization"` | Un query parameter en la URL | `?type=authorization` en la URL |
| `json` y `data` | Un body JSON con `client_id`, `mail` y `country` | `--data-binary '...'` |
| `data` con `\n` entre campos y sin espacios de indentación | El body tiene saltos de línea literales y nada más | Se escribe el body con saltos de línea reales dentro de las comillas |
| `headers.Content-Length = "59"` | El body pesa exactamente 59 bytes | Consecuencia del punto anterior; se verificó con `wc -c` |
| `headers.Content-Type = "application/json"` | Header explícito; cURL por defecto manda `application/x-www-form-urlencoded` con `-d` | `-H 'Content-Type: application/json'` |
| `headers.Cache-Control = "no-cache"` | Header explícito | `-H 'Cache-Control: no-cache'` |
| `headers.Connection = "close"` | Header explícito | `-H 'Connection: close'` |
| `headers.User-Agent = "curl/7.29.0"` | Quien generó el ejemplo usaba cURL 7.29.0 (2013) | `-A 'curl/7.29.0'` sobrescribe el User-Agent |
| `headers.Accept = "*/*"` | Valor por defecto de cURL | No requiere nada |
| `form = {}` y `files = {}` | El body no es un formulario ni multipart | Consecuencia de mandar JSON crudo |
| `json` muestra las claves en otro orden que `data` | httpbin ordena las claves al serializar | No depende del request |

Detalles del comando:

- **No se usa `-X POST`.** cURL ya hace POST cuando se pasa un body. Agregar `-X POST` es redundante y, si algún día hay un redirect, fuerza POST donde no corresponde.
- **`--data-binary` en lugar de `-d`.** Para una cadena inline ambos mandan el body tal cual, pero `-d` elimina saltos de línea cuando lee desde un archivo (`@body.json`). `--data-binary` deja claro que el body se envía byte a byte y evita sorpresas si se mueve a un archivo.
- **El body no está indentado.** Cualquier espacio o tab adicional cambia el `Content-Length` y el campo `data`. Es la parte que más fácil se rompe al "embellecer" el comando.
- **`-A 'curl/7.29.0'`** es puramente cosmético: imita la versión de cURL de quien generó el ejemplo. Sin ese flag la respuesta sería funcionalmente idéntica, con el User-Agent de la versión local.

## Respuesta obtenida vs. esperada

Comando ejecutado el 2026-11-03 con cURL 8.18.0 desde Linux. Coinciden `args`, `data`, `files`, `form`, `json` y todos los headers salvo uno.

| Diferencia | Causa | Se puede corregir desde el comando |
|------------|-------|------------------------------------|
| `headers.Connection` no aparece en la respuesta | `Connection` es un header *hop-by-hop* (RFC 7230 §6.1). El balanceador que hoy antecede a httpbin.org lo consume y no lo reenvía a la aplicación, que por eso no lo ve. El header sí se envía: se verificó con `curl -v`. | No. Depende de la infraestructura de httpbin, no del cliente. |
| Aparecen `method`, `origin` y `url` | Versiones más nuevas de httpbin agregan esos campos al eco. El ejemplo del enunciado es de una versión anterior. | No. Son campos que agrega el servidor. |

## Supuestos y decisiones

| Tema | Decisión | Es requisito del enunciado o propuesta propia |
|------|----------|-----------------------------------------------|
| Imitar el User-Agent | Se incluye `-A 'curl/7.29.0'` porque el enunciado pide "lo más similar posible". | Interpretación del enunciado; se aclara que es cosmético. |
| Shell | El comando usa comillas simples y saltos de línea literales, compatible con sh, bash y zsh. No funciona tal cual en PowerShell o cmd. | Propuesta propia. |
| `response.json` | Se guarda la respuesta real como evidencia, con `origin` redactado por ser un dato personal. | Propuesta propia. |
