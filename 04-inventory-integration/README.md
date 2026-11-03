# Ejercicio 4 — API de integración con un proveedor de inventario

## Enunciado

> Suponga que usted debe realizar una API que se conecta con servicios de terceros para suplir funciones de control de inventario. Roberto Mansilla, el gerente del proyecto, le solicita a usted que el API supla 3 funciones:
>
> 1 – Alta de usuario: Que además debe registrar el usuario en un servicio de terceros en http://serviciodetercero.com/connect/upload
>
> 2 – Consultar producto: Que a su vez consultará en http://serviciodetercero.com/getProduct. Se manejan los siguientes códigos de errores en el API del tercero.
> - PD-001: Si el producto no existe.
> - PD-002: Si el producto existe pero está reservado.
> - PD-003: Si el producto existe pero está agotado.
>
> 3 – Cargar producto: Que a su vez consultará en http://serviciodetercero.com/upload/product. Se manejan los siguientes códigos de estado en el API del tercero.
> - 200: Si el producto se cargó.
> - 403/401: Si fallo la transacción.
>
> Se pide:
> 1 – Desarrollar un DSS incluyendo todas las transacciones que suceden en el flujo.
> 2 – Documentar dicha integración (en máximo 3 hojas).

## Entregables

| Archivo | Qué es | Responde a |
|---------|--------|------------|
| `dss.md` | Diagrama de Secuencia del Sistema, uno por función, con los caminos de éxito y de error | Punto 1 del "Se pide" |
| `documentacion-integracion.md` | Documento de integración: contrato de la API, mapeo de errores, decisiones transversales, supuestos | Punto 2 del "Se pide" (máximo 3 hojas) |
| `documentacion-integracion.pdf` | El mismo documento exportado a PDF A4, 3 páginas, para entregar | Punto 2 del "Se pide" |

Los diagramas están en Mermaid, que GitHub renderiza directamente. Para exportar a PDF o imagen se puede usar https://mermaid.live sin instalar nada.

## Lo que pide el enunciado y lo que proponemos nosotros

| Tema | Enunciado | Propuesta propia |
|------|-----------|------------------|
| Funciones | Tres: alta de usuario, consultar producto, cargar producto. | Nada más. No se agregan listados, bajas ni modificaciones. |
| URLs del tercero | `/connect/upload`, `/getProduct`, `/upload/product`. | Se respetan tal cual. Métodos HTTP y formato de payload del tercero **no están especificados**: se asumen y se marcan como supuestos. |
| Códigos del tercero | PD-001, PD-002, PD-003 en consulta; 200 y 401/403 en carga. | Se mapean a códigos HTTP y de error propios. El mapeo es decisión nuestra y se justifica en el documento. |
| Persistencia local | "Alta de usuario: que **además** debe registrar..." implica que el usuario existe en nuestro sistema y en el tercero. Para productos no se menciona persistencia local. | Usuarios se guardan localmente. Productos se delegan al tercero sin copia local. |
| Autenticación de nuestra API | No se menciona. | Bearer token. Es un supuesto, no un requisito. |
| Protocolo | El enunciado usa `http://`. | Se recomienda `https://` y se deja como riesgo si el tercero no lo soporta. |
| DSS | Se pide "un DSS incluyendo todas las transacciones". | Se interpreta DSS como Diagrama de Secuencia del Sistema y se entrega uno por función, con todas las ramas de respuesta del tercero. |
| Código | No se pide. | No se implementa. Si el equipo lo pide, el siguiente paso natural sería una especificación OpenAPI y después el servicio. |
