# Ejercicio 1 — Assertions en SAML

## Enunciado

> Explique el término "Assertions" dentro de un entorno de autenticación SAML. Podría dar un ejemplo o caso de uso relacionado en pocas palabras?

## Respuesta breve (apta para entregar)

En SAML 2.0, una **Assertion** es el documento XML, emitido y firmado digitalmente por el Identity Provider (IdP), que contiene las afirmaciones sobre un usuario que el Service Provider (SP) necesita para confiar en él sin pedirle credenciales. Afirma tres cosas: **quién** es el sujeto (`<Subject>`), **que se autenticó**, cuándo y con qué método (`<AuthnStatement>`), y opcionalmente **qué atributos** tiene, como email, nombre o grupos (`<AttributeStatement>`). Incluye además condiciones de validez (`<Conditions>`: ventana temporal y audiencia) que el SP verifica junto con la firma antes de aceptarla.

**Ejemplo (Single Sign-On):** un empleado abre `app.ejemplo.com` (SP). La aplicación no tiene sus credenciales, así que lo redirige al IdP corporativo (por ejemplo Okta o Microsoft Entra ID). El usuario se autentica allí una sola vez. El IdP genera una Assertion firmada que, en esencia, dice: "`juan@empresa.com` se autenticó a las 13:00 con contraseña y MFA, pertenece al grupo `ventas`, y esta afirmación vale cinco minutos y solo para `app.ejemplo.com`". La envía al SP dentro de una SAML Response. El SP valida la firma, la vigencia y la audiencia, y crea la sesión local sin haber visto nunca la contraseña. Eso es SSO: una autenticación en el IdP sirve para todas las aplicaciones que confían en él.

---

## Explicación ampliada

### Qué resuelve

Sin SSO, cada aplicación guarda y valida contraseñas por su cuenta: más superficie de ataque, más onboarding y offboarding manual, y una experiencia pobre. SAML (Security Assertion Markup Language, estándar OASIS, versión 2.0 de 2005) separa dos roles: **quien autentica** (el IdP) y **quien consume el resultado** (el SP). La Assertion es el artefacto que transporta ese resultado de forma verificable.

### Qué contiene una Assertion

| Elemento | Qué afirma | Por qué importa para el SP |
|----------|------------|----------------------------|
| `Issuer` | Quién emitió la assertion (entityID del IdP) | Elegir con qué certificado validar la firma |
| `Signature` (XML-DSig) | Integridad y autenticidad del documento | Sin firma válida, la assertion no vale nada |
| `Subject` | A quién se refiere (`NameID`) y cómo se confirma (`SubjectConfirmation`, normalmente `bearer`) | Identificar al usuario y ligar la assertion al request original (`InResponseTo`) y a la URL de destino (`Recipient`) |
| `Conditions` | `NotBefore`, `NotOnOrAfter` y `AudienceRestriction` | Rechazar assertions vencidas o emitidas para otra aplicación |
| `AuthnStatement` | Que el usuario se autenticó, cuándo (`AuthnInstant`) y cómo (`AuthnContextClassRef`) | Saber si hubo MFA, y manejar la sesión (`SessionIndex`) para el logout |
| `AttributeStatement` | Atributos del usuario: email, nombre, grupos, roles | Autorización y aprovisionamiento dentro del SP |
| `AuthzDecisionStatement` | Decisión de autorización sobre un recurso | Existe en la especificación pero casi no se usa; la autorización suele quedar en el SP |

### Ejemplo XML simplificado

Una Assertion viaja dentro de una SAML Response. Se omiten namespaces repetidos y el contenido de la firma por legibilidad.

```xml
<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
                xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
                ID="_resp-001" Version="2.0" IssueInstant="2026-11-03T13:00:00Z"
                Destination="https://app.ejemplo.com/saml/acs"
                InResponseTo="_req-123">
  <saml:Issuer>https://idp.empresa.com</saml:Issuer>
  <samlp:Status>
    <samlp:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Success"/>
  </samlp:Status>

  <saml:Assertion ID="_asrt-001" Version="2.0" IssueInstant="2026-11-03T13:00:00Z">
    <saml:Issuer>https://idp.empresa.com</saml:Issuer>
    <ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#">...</ds:Signature>

    <saml:Subject>
      <saml:NameID Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress">
        juan@empresa.com
      </saml:NameID>
      <saml:SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer">
        <saml:SubjectConfirmationData Recipient="https://app.ejemplo.com/saml/acs"
                                      NotOnOrAfter="2026-11-03T13:05:00Z"
                                      InResponseTo="_req-123"/>
      </saml:SubjectConfirmation>
    </saml:Subject>

    <saml:Conditions NotBefore="2026-11-03T12:59:00Z" NotOnOrAfter="2026-11-03T13:05:00Z">
      <saml:AudienceRestriction>
        <saml:Audience>https://app.ejemplo.com</saml:Audience>
      </saml:AudienceRestriction>
    </saml:Conditions>

    <saml:AuthnStatement AuthnInstant="2026-11-03T13:00:00Z" SessionIndex="_sess-001">
      <saml:AuthnContext>
        <saml:AuthnContextClassRef>
          urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport
        </saml:AuthnContextClassRef>
      </saml:AuthnContext>
    </saml:AuthnStatement>

    <saml:AttributeStatement>
      <saml:Attribute Name="email">
        <saml:AttributeValue>juan@empresa.com</saml:AttributeValue>
      </saml:Attribute>
      <saml:Attribute Name="groups">
        <saml:AttributeValue>ventas</saml:AttributeValue>
      </saml:Attribute>
    </saml:AttributeStatement>
  </saml:Assertion>
</samlp:Response>
```

### Flujo SSO iniciado por el SP (Web Browser SSO Profile)

```
Usuario / Navegador          SP (app.ejemplo.com)            IdP (idp.empresa.com)
       |                              |                              |
       |-- 1. GET /panel ------------>|                              |
       |<- 2. 302 + AuthnRequest -----|   (HTTP-Redirect binding)    |
       |-- 3. GET /sso?SAMLRequest=... ----------------------------->|
       |<- 4. Formulario de login -----------------------------------|
       |-- 5. Credenciales (+ MFA) --------------------------------->|
       |<- 6. Página con form auto-submit: SAMLResponse (base64) ---|
       |-- 7. POST /saml/acs  SAMLResponse=... -->|   (HTTP-POST binding)
       |                              | 8. Valida firma, vigencia,   |
       |                              |    audiencia, InResponseTo   |
       |<- 9. Cookie de sesión + 302 /panel                          |
```

Puntos clave del flujo:

- El navegador es el intermediario: SP e IdP **no se hablan directamente**. Por eso la assertion tiene que ser firmada: viaja por un canal que no controlan.
- El `AuthnRequest` (paso 2) lleva un `ID` que la Response devuelve en `InResponseTo`. Así el SP sabe que la respuesta corresponde a un login que él pidió.
- El `ACS` (Assertion Consumer Service) es el endpoint del SP que recibe y valida la Response. Su URL se publica en los **metadatos** del SP; el certificado del IdP se publica en los metadatos del IdP. Ese intercambio previo de metadatos es la "relación de confianza".
- Existe también el flujo **iniciado por el IdP** (el usuario entra desde el portal del IdP y este envía la Response sin `AuthnRequest` previo). Es más simple pero más expuesto a CSRF, porque no hay `InResponseTo` que verificar.

### IdP, SP, SAML Response y SAML Assertion

| Concepto | Qué es | Rol en el flujo | Analogía |
|----------|--------|-----------------|----------|
| **Identity Provider (IdP)** | El sistema que **autentica** al usuario y emite assertions. Ejemplos: Okta, Microsoft Entra ID, Keycloak, ADFS. | Guarda las credenciales, aplica MFA y políticas, firma la assertion. | La autoridad que emite el pasaporte. |
| **Service Provider (SP)** | La aplicación que **consume** la assertion para crear una sesión. Ejemplos: Salesforce, Jira Cloud, cualquier app propia con SAML. | Redirige al IdP, recibe la Response en el ACS, valida y autoriza. | El control migratorio que revisa el pasaporte. |
| **SAML Response** | El **mensaje de protocolo** (`<samlp:Response>`) que el IdP envía al SP. Contiene `Status` (éxito o error), `InResponseTo`, `Destination` y cero o más assertions. | Es el sobre: puede decir "éxito, acá va la assertion" o "falló la autenticación" sin assertion alguna. | El sobre certificado con el pasaporte adentro. |
| **SAML Assertion** | El **token de seguridad** (`<saml:Assertion>`) con las afirmaciones sobre el usuario. Es lo que realmente lleva la identidad. | Se firma (y opcionalmente se cifra como `<EncryptedAssertion>`). Es lo que el SP verifica y de donde saca los atributos. | El pasaporte en sí. |

La distinción que más confunde: **Response y Assertion no son sinónimos.** La Response es el mensaje del protocolo; la Assertion es el contenido con valor de seguridad. Pueden firmarse ambos, solo uno, o cifrarse la assertion y firmarse la response. Un SP bien implementado define qué exige y rechaza lo demás.

### Qué valida un SP antes de aceptar una Assertion

- [ ] La firma XML es válida y fue hecha con el certificado publicado en los metadatos del IdP.
- [ ] `Issuer` coincide con el IdP esperado.
- [ ] `Conditions/NotBefore` y `NotOnOrAfter` encuadran el momento actual (con tolerancia de reloj de pocos minutos).
- [ ] `AudienceRestriction/Audience` es el entityID de este SP.
- [ ] `SubjectConfirmationData/Recipient` es la URL de este ACS y `InResponseTo` corresponde a un `AuthnRequest` emitido y aún no consumido.
- [ ] El `ID` de la assertion no fue visto antes dentro de su ventana de validez (anti-replay).
- [ ] `Status` de la Response es `Success`.

Estas comprobaciones existen porque la assertion llega a través del navegador del usuario. Si el SP se salta una, un atacante puede reutilizar una assertion vieja, usar una emitida para otra aplicación, o alterarla.

## Supuestos y decisiones

| Tema | Decisión | Es requisito del enunciado o propuesta propia |
|------|----------|-----------------------------------------------|
| Versión de SAML | Se explica SAML 2.0, la versión usada hoy en la práctica. | Propuesta propia: el enunciado no especifica versión. |
| Perfil de ejemplo | Web Browser SSO Profile, iniciado por el SP, con binding HTTP-POST para la Response. | Propuesta propia: es el caso de uso más común y el que mejor muestra las partes. |
| Idioma del documento | Castellano, porque el enunciado y el equipo evaluador lo están. | Propuesta propia. |
| Profundidad | La "Respuesta breve" es el entregable; el resto del documento es material de respaldo para la defensa. | El enunciado pide "en pocas palabras"; se respeta en la sección breve. |

## Fuentes

- OASIS, *Assertions and Protocols for SAML V2.0* (saml-core-2.0-os): https://docs.oasis-open.org/security/saml/v2.0/saml-core-2.0-os.pdf
- OASIS, *Profiles for SAML V2.0* (Web Browser SSO Profile): https://docs.oasis-open.org/security/saml/v2.0/saml-profiles-2.0-os.pdf
- OASIS, *Bindings for SAML V2.0* (HTTP-Redirect y HTTP-POST): https://docs.oasis-open.org/security/saml/v2.0/saml-bindings-2.0-os.pdf
