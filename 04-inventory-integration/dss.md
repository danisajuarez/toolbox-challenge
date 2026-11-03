# DSS — Diagramas de Secuencia del Sistema

Un diagrama por función. Cada uno muestra todas las transacciones del flujo: la del cliente contra nuestra API, la de nuestra API contra el tercero y, cuando aplica, la persistencia local. Las ramas `alt` cubren cada código de respuesta que el enunciado define para el tercero, más los fallos de red que ningún contrato puede evitar.

Participantes:

| Participante | Rol |
|--------------|-----|
| **Cliente** | Quien consume nuestra API (front, otro servicio, integrador). |
| **Inventory API** | La API que diseñamos. Autentica al cliente, valida, orquesta y traduce errores. |
| **serviciodetercero.com** | El proveedor externo. Sus endpoints y códigos son los del enunciado. |
| **Base de datos** | Persistencia local. Solo interviene en el alta de usuario (ver supuestos en la documentación). |

## 1. Alta de usuario

```mermaid
sequenceDiagram
    autonumber
    actor C as Cliente
    participant API as Inventory API
    participant T as serviciodetercero.com
    participant DB as Base de datos

    C->>API: POST /users {email, name, ...}
    API->>API: Autenticar cliente, validar body, generar correlationId
    alt token inválido
        API-->>C: 401 UNAUTHORIZED
    else body inválido
        API-->>C: 400 VALIDATION_ERROR
    else usuario ya existe localmente
        API-->>C: 409 USER_ALREADY_EXISTS
    end

    API->>T: POST /connect/upload {user} (X-Correlation-Id)
    alt tercero registra OK
        T-->>API: 200 OK
        API->>DB: INSERT user
        alt INSERT OK
            DB-->>API: OK
            API-->>C: 201 Created {user}
        else INSERT falla
            DB-->>API: error
            API->>API: log ERROR con correlationId (usuario en tercero sin copia local)
            API-->>C: 500 INTERNAL_ERROR
        end
    else tercero rechaza (4xx / 5xx)
        T-->>API: error
        API-->>C: 502 UPSTREAM_ERROR {upstreamStatus}
    else tercero no responde
        T-->>API: timeout
        API-->>C: 504 UPSTREAM_TIMEOUT
    end
```

## 2. Consultar producto

```mermaid
sequenceDiagram
    autonumber
    actor C as Cliente
    participant API as Inventory API
    participant T as serviciodetercero.com

    C->>API: GET /products/{productId}
    API->>API: Autenticar cliente, validar productId, generar correlationId
    alt token inválido
        API-->>C: 401 UNAUTHORIZED
    else productId inválido
        API-->>C: 400 VALIDATION_ERROR
    end

    API->>T: GET /getProduct?id={productId} (X-Correlation-Id)
    alt producto disponible
        T-->>API: 200 {product}
        API-->>C: 200 {product}
    else PD-001 (no existe)
        T-->>API: error PD-001
        API-->>C: 404 PRODUCT_NOT_FOUND {upstreamCode: PD-001}
    else PD-002 (existe, reservado)
        T-->>API: error PD-002
        API-->>C: 409 PRODUCT_RESERVED {upstreamCode: PD-002}
    else PD-003 (existe, agotado)
        T-->>API: error PD-003
        API-->>C: 409 PRODUCT_OUT_OF_STOCK {upstreamCode: PD-003}
    else código no contemplado o 5xx
        T-->>API: error desconocido
        API->>API: log WARN con correlationId
        API-->>C: 502 UPSTREAM_ERROR
    else tercero no responde
        T-->>API: timeout (1 reintento, es GET)
        API-->>C: 504 UPSTREAM_TIMEOUT
    end
```

## 3. Cargar producto

```mermaid
sequenceDiagram
    autonumber
    actor C as Cliente
    participant API as Inventory API
    participant T as serviciodetercero.com

    C->>API: POST /products {sku, name, quantity, ...}
    API->>API: Autenticar cliente, validar body, generar correlationId
    alt token inválido
        API-->>C: 401 UNAUTHORIZED
    else body inválido
        API-->>C: 400 VALIDATION_ERROR
    end

    API->>T: POST /upload/product {product} (X-Correlation-Id)
    alt 200 (producto cargado)
        T-->>API: 200 OK
        API-->>C: 201 Created {product}
    else 401 / 403 (falló la transacción)
        T-->>API: 401 o 403
        API->>API: log ERROR + alerta (posible problema de credenciales con el tercero)
        API-->>C: 502 UPSTREAM_REJECTED {upstreamStatus: 401|403}
    else otro 4xx / 5xx
        T-->>API: error
        API-->>C: 502 UPSTREAM_ERROR
    else tercero no responde
        T-->>API: timeout (sin reintento, es POST)
        API-->>C: 504 UPSTREAM_TIMEOUT
    end
```

## Convenciones de los diagramas

- `autonumber` numera cada transacción para poder referenciarla en la documentación y en los logs.
- Las ramas de autenticación y validación se dibujan una vez por diagrama; en la implementación son un middleware compartido.
- El `X-Correlation-Id` se genera en la API y se propaga al tercero en cada llamada. Es lo que permite seguir una transacción de punta a punta cuando algo falla.
- Los códigos de error de nuestra API (`PRODUCT_RESERVED`, `UPSTREAM_REJECTED`, etc.) y su justificación están en `documentacion-integracion.md`.
