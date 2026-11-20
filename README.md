# Gestor de pedidos de material

Aplicación web desarrollada en **HTML, CSS y JavaScript puro** (sin frameworks, backend, bases de datos ni almacenamiento persistente en `localStorage` o cookies) para consultar un catálogo de material informático y de oficina, gestionar un carrito activo en memoria, validar un formulario de pedido y registrar el historial de compras con exportación en formato JSON.

---

## 1. Cómo clonar y ejecutar el proyecto en otro ordenador (VS Code + Git Bash)

La aplicación debe ejecutarse obligatoriamente a través de un **servidor HTTP local de archivos estáticos** y nunca abriendo el archivo directamente con `file://`.

### Paso 1: Abrir Git Bash en Visual Studio Code y clonar el repositorio
1. Abre **Visual Studio Code**.
2. Abre el terminal integrado pulsando `Ctrl + ñ` (o menú superior **Terminal > Nuevo terminal**).
3. En la pestaña del terminal, pulsa la flecha desplegable junto al símbolo `+` y selecciona **Git Bash**.
4. Sitúate en la carpeta donde quieras guardar el proyecto (por ejemplo, el Escritorio):
   ```bash
   cd ~/Desktop
   ```
5. Clona el repositorio de GitHub y entra en la carpeta creada:
   ```bash
   git clone [https://github.com/](https://github.com/)<usuario>/gestor-pedidos.git
   cd gestor-pedidos
   ```
6. Abre el proyecto en VS Code ejecutando en la misma terminal:
   ```bash
   code .
   ```

### Paso 2: Ejecutar la aplicación mediante HTTP con Live Server
1. En Visual Studio Code, verifica que tienes instalada la extensión **Live Server** (en el panel de Extensiones, `Ctrl + Shift + X`).
2. En el explorador de archivos de la izquierda, haz clic derecho sobre `index.html` y selecciona **Open with Live Server** (o pulsa **Go Live** abajo a la derecha).
3. El navegador se abrirá automáticamente en una URL local HTTP (`http://127.0.0.1:5500/index.html`).

### Paso 3: Comprobación inicial en DevTools
1. Pulsa `F12` en el navegador para abrir las herramientas de desarrollo.
2. En **Network**, recarga la página (`Ctrl + R`) y comprueba que `index.html`, `styles.css`, `Producto.js`, `logica.js` y `app.js` cargan con estado `200`.
3. En **Console**, verifica que no hay errores de JavaScript.

---

## 2. Estructura de carpetas del proyecto

```text
gestor-pedidos/
├── index.html          # Estructura semántica HTML5, formulario con novalidate y contenedores vacíos
├── css/
│   └── styles.css      # Estilos visuales, rejilla adaptable y estados de validación (.error, [aria-invalid="true"])
├── js/
│   ├── Producto.js     # Definición de la clase Producto (constructor y métodos con this) y datos iniciales
│   ├── logica.js       # Funciones puras de cálculo, formateo y validación (sin tocar el DOM)
│   └── app.js          # Estado en memoria, renderizado seguro del DOM y delegación de eventos
└── README.md           # Documentación del proyecto, guía de desarrollo, casos de prueba y evidencias
```

---

## 3. Cómo se ha construido la práctica y cómo funcionan los códigos paso a paso

Para cumplir con la separación de responsabilidades vista en clase, el desarrollo se ha dividido en **5 fases** donde HTML define la estructura, CSS la presentación y JavaScript se reparte en tres archivos cargados en orden mediante `<script src="..." defer></script>`.

### Fase 1: Maquetación semántica y restricciones HTML5 (`index.html`)
1. **División en 4 bloques funcionales**: Se crean cuatro etiquetas `<section>` independientes para el **Catálogo**, el **Carrito activo**, el **Formulario de confirmación** y el **Historial de pedidos**.
2. **Contenedores dinámicos vacíos**: `#contenedor-catalogo`, `#contenedor-carrito` y `#contenedor-historial` se dejan vacíos en el HTML para rellenarlos dinámicamente desde JavaScript mediante manipulación del DOM.
3. **Formulario con validación coordinada**:
   - Se añade `novalidate` en `<form id="form-pedido">` para impedir que el navegador muestre sus globos por defecto antes de tiempo y permitir que JavaScript coordine toda la validación.
   - Se declaran restricciones HTML5 en los controles (`required`, `type="email"`, `minlength="2"`, `maxlength="60"`, `maxlength="200"`).
   - Las opciones de entrega (`recogida` y `envio`) se agrupan en un `<fieldset>` con `<legend>`, y los campos de dirección y código postal se meten dentro de `<div id="bloque-envio" class="oculto">` para mostrarlos solo cuando se elige envío.
   - Cada campo incluye un `<small id="err-..." class="error" aria-live="polite">` enlazado con `aria-describedby` para mostrar los errores de validación de forma accesible.

### Fase 2: Hoja de estilos y estados visuales (`css/styles.css`)
1. **Distribución adaptable**: En `.grid-catalogo` se utiliza `display: grid` con `grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr))` para que las tarjetas de productos se coloquen automáticamente en columnas según el ancho de pantalla.
2. **Clases de estado controladas desde JS**:
   - `.agotado`: reduce la opacidad de la tarjeta cuando el stock de un producto llega a `0`.
   - `.oculto` (`display: none`): oculta o muestra tanto los campos postales como el detalle plegable de cada pedido en el historial.
   - `[aria-invalid="true"]`: pinta el borde de rojo (`border: 2px solid #9b1c1c`) en cualquier control marcado como inválido por JavaScript.

### Fase 3: Creación de la clase `Producto` y datos iniciales (`js/Producto.js`)
1. **Clase `Producto`**:
   - En el `constructor(id, nombre, categoria, precio, stock)` se validan los tipos antes de guardar nada: `Number.isInteger()` para `id` y `stock`, `Number.isFinite()` para `precio` y `.trim() !== ""` para las cadenas. Si algún dato falla, lanza un `TypeError`.
   - Se implementan dos métodos que trabajan sobre la propia instancia usando `this`:
     - `tieneStockDisponible(cantidad)`: devuelve `true` solo si `cantidad` es un entero positivo y `this.stock >= cantidad`.
     - `descontarStock(cantidad)`: vuelve a llamar a `this.tieneStockDisponible(cantidad)` y, si es válido, resta `this.stock -= cantidad`.
2. **Array `datosProductosIniciales`**: Contiene 6 objetos de 3 categorías (`perifericos`, `oficina`, `monitores`), incluyendo el producto `id: 102` con `stock: 0` para probar el estado agotado y productos que permiten alcanzar o superar los `100 €`.

### Fase 4: Programación de las funciones puras sin DOM (`js/logica.js`)
Este archivo no contiene ningún `document.querySelector` ni modifica la interfaz; solo recibe datos y devuelve resultados:
1. **`calcularSubtotal(carrito, catalogo)`**: Recorre cada línea del carrito con un bucle `for...of`, busca su producto en `catalogo` usando `.find(item => item.id === linea.productoId)` y suma `producto.precio * linea.cantidad`.
2. **`calcularDescuento(subtotal, porcentaje = 0)`**: Utiliza un parámetro por defecto (`porcentaje = 0`), comprueba con `Number.isFinite()` que los números sean válidos y devuelve `subtotal * (porcentaje / 100)`.
3. **`validarDatosPedido(datos)`**:
   - Limpia espacios exteriores con `.trim()` en el nombre y verifica que mida entre 2 y 60 caracteres.
   - Comprueba el formato de correo con expresión regular.
   - Verifica con `["recogida", "envio"].includes(datos.modalidad)` que el valor del radio no haya sido manipulado.
   - Si `datos.modalidad === "envio"`, valida la dirección (5 a 100 caracteres) y comprueba el código postal español con `RegExp.test()` usando `/^(?:0[1-9]|[1-4][0-9]|5[0-2])[0-9]{3}$/`, donde `(?:0[1-9]|[1-4][0-9]|5[0-2])` agrupa sin captura las provincias del `01` al `52` y `[0-9]{3}` exige las 3 cifras restantes.
   - Comprueba que las observaciones no pasen de 200 caracteres y que `datos.acepto === true`.
4. **`comprobarStockCarrito(listaCarrito, listaCatalogo)`**: Comprueba que el carrito no esté vacío y que cada producto siga teniendo stock suficiente antes de confirmar la compra.

### Fase 5: Gestión de estado, DOM seguro y eventos (`js/app.js`)
1. **Colecciones en memoria**:
   - `catalogo`: se construye transformando `datosProductosIniciales` mediante `.map(dato => new Producto(...))`.
   - `carrito` y `pedidos`: arrays declarados con `const` donde se van insertando objetos con `.push()`.
2. **Renderizado del DOM sin `innerHTML`**:
   - En `crearTarjetaProducto()`, `renderizarCarrito()` y `renderizarHistorial()` se crean todos los elementos con `document.createElement()`, se asignan los textos con `.textContent` y se insertan con `.append()`, evitando cualquier inyección de HTML.
   - Para filtrar el catálogo e historial se usa `.filter()`, y para recorrer y pintar elementos se usa `.forEach()`.
3. **Delegación de eventos**:
   - En lugar de poner un `addEventListener` en cada botón dinámico, se registra un único evento `click` en el contenedor padre (`contenedorCatalogo`, `contenedorCarrito` y `contenedorHistorial`) y se detecta el botón pulsado mediante `evento.target.closest('button[data-accion]')`.
   - Al añadir un producto al carrito (`anadirAlCarrito`), si ya existe una línea con ese `productoId` (localizada con `.find()`), se suman las cantidades sin duplicar la línea; al retirarlo (`retirarLineaCarrito`), se busca su posición con `.findIndex()` y se elimina con `.splice(indice, 1)`.
4. **Validación en tiempo real y confirmación (`submit`)**:
   - `obtenerDatosFormulario()` recoge los valores usando `new FormData(formPedido)` y `campoAcepto.checked`.
   - `sincronizarValidacionFormulario()` limpia errores anteriores con `campo.setCustomValidity("")`, aplica los mensajes devueltos por `validarDatosPedido()`, actualiza `aria-invalid` y comprueba `formPedido.checkValidity()`.
   - Al cambiar de **Envío** a **Recogida** (`actualizarCamposEnvio`), se ocultan los campos postales, se quita `required` y se borra su `setCustomValidity("")` para que no bloqueen el envío.
   - En el evento `submit`, se llama a `evento.preventDefault()`. Si todo es válido y hay stock, se usa `.map()` sobre `carrito` para llamar a `producto.descontarStock()` en cada instancia y guardar una instantánea fija (nombre y precio del momento) dentro de `pedidos`. Después se vacía el carrito con `carrito.splice(0, carrito.length)`, se reinicia el formulario con `.reset()` y se vuelven a pintar catálogo, carrito e historial.
5. **Exportación JSON**: Al pulsar **Exportar historial**, se ejecuta `JSON.stringify(pedidos, null, 2)` y se vuelca el resultado en el `<textarea>`.

---

## 4. Casos de prueba reproducibles en el navegador

| Caso de prueba | Pasos a seguir en el navegador | Datos de entrada | Resultado esperado |
| :--- | :--- | :--- | :--- |
| **1. Carrito vacío** | Con el carrito vacío, rellenar nombre, correo, marcar la casilla de aceptación y pulsar **Confirmar pedido**. | Carrito: vacío (`0` productos) | Se impide la confirmación, no se crea ningún pedido y aparece el mensaje `"El carrito está vacío. Añade al menos un producto."` |
| **2. Producto agotado** | Observar la tarjeta de *Teclado mecánico* en el catálogo. | Stock inicial: `0` | El campo numérico y el botón aparecen deshabilitados (`Agotado`) y no se puede añadir al carrito. |
| **3. Suma de cantidades** | Añadir 2 unidades de *Ratón óptico USB* y volver a añadir 3 unidades del mismo producto. | Cantidad: `2` y después `3` | No se crea una segunda línea en el carrito; la línea existente actualiza su cantidad a `5` y el total de unidades marca `5`. |
| **4. Stock insuficiente** | Con 5 unidades de *Ratón óptico USB* (`stock: 8`) en el carrito, intentar añadir 4 unidades más. | Cantidad: `4` (total `9` > `8`) | Se rechaza la operación y se muestra aviso indicando que el máximo disponible es `8`. |
| **5. Umbral de 100 €** | Añadir 1 *Silla ergonómica básica* (`89.00 €`) y comprobar el descuento; después añadir 2 *Paquete 500 folios A4* (`6.25 €`). | Subtotal: `89.00 €` -> `101.50 €` | Con `89.00 €` el descuento es `0.00 €`. Al alcanzar `101.50 €` (>= `100 €`), se aplica el 10 % (`10.15 €`) y el total es `91.35 €`. |
| **6. Correo inválido** | Escribir un correo sin formato válido en el formulario y pulsar **Confirmar pedido**. | Correo: `cliente@dominio` | El control se resalta en rojo (`aria-invalid="true"`) y muestra un error de formato sin confirmar el pedido. |
| **7. Código postal inválido** | Marcar **Envío a domicilio**, escribir una dirección válida y probar un código postal fuera de rango o con letras. | CP: `53001` o `2800A` | `RegExp.test()` devuelve `false` (provincias válidas `01` a `52`) y muestra el error asociado al campo CP. |
| **8. Cambio de modalidad** | Con error visible en dirección/CP en modo **Envío a domicilio**, cambiar la selección a **Recogida en tienda**. | Radio: `recogida` | Se ocultan los campos postales, dejan de ser obligatorios y se borran sus errores personalizados (`setCustomValidity("")`). |
| **9. Eliminación de líneas** | Con dos productos distintos en el carrito, pulsar el botón **Retirar** de uno de ellos. | Clic en **Retirar** | Se elimina únicamente esa línea mediante delegación de eventos y se recalculan unidades, subtotal, descuento y total. |
| **10. Filtros sin resultados** | Escribir `"Impresora"` en el buscador del catálogo. Después, tras confirmar un pedido de recogida, filtrar el historial por **Envío**. | Búsqueda: `"Impresora"` / Historial: `envio` | En el catálogo se muestra `"No se han encontrado productos con los filtros seleccionados."` En el historial se muestra `0` pedidos, `0.00 €` (sin `NaN`) y el aviso de estado vacío. |

---

## 5. Evidencias de depuración y red (DevTools)

*(Sustituir las rutas de imagen tras realizar las capturas en tu navegador)*:

### Evidencia en la pestaña Network (carga por HTTP)
* **Comprobación**: Al abrir `http://127.0.0.1:5500/index.html` con DevTools abierto en **Network**, se verifica que todos los recursos (`index.html`, `styles.css`, `Producto.js`, `logica.js`, `app.js`) se sirven mediante protocolo HTTP con código `200 OK`.
* *(Insertar aquí captura de la pestaña Network)*

### Evidencia de depuración con punto de interrupción (Sources)
* **Comprobación**: Se coloca un *breakpoint* en `js/app.js` dentro del manejador `submit`, justo en la línea `producto.descontarStock(linea.cantidad)`. Al confirmar un pedido válido, la ejecución se detiene y el panel **Scope** permite inspeccionar el contenido del array `carrito`, el valor numérico de `subtotal` y la reducción en tiempo real de `producto.stock` antes y después de ejecutar el paso.
* *(Insertar aquí captura de la pestaña Sources con el punto de interrupción detenido)*

---

## 6. Uso de Inteligencia Artificial

* **Enlace / exportación de la conversación**: *(Incluir aquí el enlace público o ruta al archivo exportado del chat utilizado)*.
* **Análisis de decisiones tomadas**:
  * **Consultas realizadas**: Se consultó cómo estructurar la separación entre funciones puras sin acceso al DOM y la actualización de la interfaz, cómo combinar `novalidate` con `setCustomValidity()` y `reportValidity()`, y cómo plantear la expresión regular de provincias españolas (`01` a `52`).
  * **Aceptado y adaptado**: Se aceptó la división en tres archivos JS (`Producto.js`, `logica.js`, `app.js`) cargados con `defer` para mantener la compatibilidad con scripts clásicos vistos en las sesiones, y la delegación de eventos usando `closest('button[data-accion]')`.
  * **Descartado**: Se descartó el uso de `innerHTML` para renderizar tarjetas o filas dinámicas y el uso de `localStorage` o módulos complejos no necesarios, sustituyéndolos por `createElement`/`textContent`/`append` y colecciones en memoria tal como exige el enunciado.