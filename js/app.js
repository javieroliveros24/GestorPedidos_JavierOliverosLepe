    "use strict";

    /* ==========================================================================
    1. ESTADO EN MEMORIA DE LA APLICACIÓN
    ========================================================================== */

    // Transforma los datos iniciales en instancias reales de la clase Producto usando map()
    const catalogo = datosProductosIniciales.map(
    dato => new Producto(dato.id, dato.nombre, dato.categoria, dato.precio, dato.stock)
    );

    // Colecciones activas en memoria durante la sesión
    const carrito = [];
    const pedidos = [];
    let siguienteNumeroPedido = 1001;

    /* ==========================================================================
    2. REFERENCIAS A ELEMENTOS ESTÁTICOS DEL DOM
    ========================================================================== */

    const inputBusqueda = document.querySelector("#busqueda-nombre");
    const selectCategoria = document.querySelector("#filtro-categoria");
    const mensajeCatalogo = document.querySelector("#mensaje-catalogo");
    const contenedorCatalogo = document.querySelector("#contenedor-catalogo");

    const mensajeCarrito = document.querySelector("#mensaje-carrito");
    const contenedorCarrito = document.querySelector("#contenedor-carrito");
    const spanTotalUnidades = document.querySelector("#total-unidades");
    const spanSubtotal = document.querySelector("#importe-subtotal");
    const spanDescuento = document.querySelector("#importe-descuento");
    const spanTotal = document.querySelector("#importe-total");

    const formPedido = document.querySelector("#form-pedido");
    const campoNombre = formPedido.elements.namedItem("nombre");
    const campoEmail = formPedido.elements.namedItem("email");
    const bloqueEnvio = document.querySelector("#bloque-envio");
    const campoDireccion = formPedido.elements.namedItem("direccion");
    const campoCP = formPedido.elements.namedItem("cp");
    const campoObservaciones = formPedido.elements.namedItem("observaciones");
    const contadorObservaciones = document.querySelector("#contador-observaciones");
    const campoAcepto = formPedido.elements.namedItem("acepto");
    const estadoPedido = document.querySelector("#estado-pedido");

    const selectFiltroHistorial = document.querySelector("#filtro-historial");
    const spanHistorialCantidad = document.querySelector("#historial-cantidad");
    const spanHistorialSuma = document.querySelector("#historial-suma");
    const mensajeHistorial = document.querySelector("#mensaje-historial");
    const contenedorHistorial = document.querySelector("#contenedor-historial");
    const btnExportar = document.querySelector("#btn-exportar");
    const textareaJSON = document.querySelector("#salida-json");

    // Registro de campos que ya han sido interactuados por el usuario
    const camposValidables = [
    campoNombre,
    campoEmail,
    campoDireccion,
    campoCP,
    campoObservaciones,
    campoAcepto
    ];
    const camposVisitados = new Set();

    /* ==========================================================================
    3. CONSTRUCCIÓN SEGURA Y RENDERIZADO DEL CATÁLOGO
    ========================================================================== */

    /**
     * Crea el nodo DOM <article> correspondiente a un producto sin usar innerHTML.
     * @param {Producto} producto
     * @returns {HTMLElement}
     */
    function crearTarjetaProducto(producto) {
    const articulo = document.createElement("article");
    articulo.className = "tarjeta-producto";
    if (producto.stock === 0) {
        articulo.classList.add("agotado");
    }

    const info = document.createElement("div");

    const titulo = document.createElement("h3");
    titulo.textContent = producto.nombre;

    const pCategoria = document.createElement("p");
    pCategoria.textContent = "Categoría: " + obtenerEtiquetaCategoria(producto.categoria);

    const pPrecio = document.createElement("p");
    pPrecio.textContent = "Precio: " + formatearEuros(producto.precio);

    const pStock = document.createElement("p");
    pStock.textContent = producto.stock > 0
        ? "Existencias: " + producto.stock + " uds."
        : "Sin existencias";

    info.append(titulo, pCategoria, pPrecio, pStock);

    const acciones = document.createElement("div");
    acciones.className = "acciones-producto";

    const idInput = "cant-prod-" + producto.id;
    const etiqueta = document.createElement("label");
    etiqueta.setAttribute("for", idInput);
    etiqueta.textContent = "Cant.";

    const inputCantidad = document.createElement("input");
    inputCantidad.id = idInput;
    inputCantidad.type = "number";
    inputCantidad.min = "1";
    inputCantidad.step = "1";
    inputCantidad.value = "1";
    if (producto.stock > 0) {
        inputCantidad.max = String(producto.stock);
    } else {
        inputCantidad.disabled = true;
    }

    const botonAnadir = document.createElement("button");
    botonAnadir.type = "button";
    botonAnadir.dataset.accion = "anadir";
    botonAnadir.dataset.id = String(producto.id);
    botonAnadir.textContent = producto.stock > 0 ? "Añadir" : "Agotado";
    if (producto.stock === 0) {
        botonAnadir.disabled = true;
    }

    acciones.append(etiqueta, inputCantidad, botonAnadir);
    articulo.append(info, acciones);
    return articulo;
    }

    /**
     * Filtra y dibuja el catálogo según el texto buscado y la categoría seleccionada.
     */
    function renderizarCatalogo() {
    const textoBuscado = inputBusqueda.value.trim().toLowerCase();
    const categoriaSeleccionada = selectCategoria.value;

    const productosFiltrados = catalogo.filter(producto => {
        const coincideNombre = producto.nombre.toLowerCase().includes(textoBuscado);
        const coincideCategoria = categoriaSeleccionada === "todas"
        || producto.categoria === categoriaSeleccionada;
        return coincideNombre && coincideCategoria;
    });

    contenedorCatalogo.replaceChildren();

    if (productosFiltrados.length === 0) {
        mensajeCatalogo.textContent = "No se han encontrado productos con los filtros seleccionados.";
        return;
    }

    mensajeCatalogo.textContent = "";
    productosFiltrados.forEach(producto => {
        const tarjeta = crearTarjetaProducto(producto);
        contenedorCatalogo.append(tarjeta);
    });
    }

    /* ==========================================================================
    4. GESTIÓN Y RENDERIZADO DEL CARRITO
    ========================================================================== */

    /**
     * Añade unidades de un producto al carrito comprobando existencias y evitando líneas duplicadas.
     * @param {number} productoId
     * @param {number} cantidad
     */
    function anadirAlCarrito(productoId, cantidad) {
    mensajeCarrito.classList.remove("error-general", "exito");

    const producto = catalogo.find(item => item.id === productoId);
    if (producto === undefined) {
        mensajeCarrito.textContent = "El producto seleccionado no existe.";
        mensajeCarrito.classList.add("error-general");
        return;
    }

    if (producto.stock === 0) {
        mensajeCarrito.textContent = "El producto '" + producto.nombre + "' está agotado.";
        mensajeCarrito.classList.add("error-general");
        return;
    }

    if (!Number.isInteger(cantidad) || cantidad <= 0) {
        mensajeCarrito.textContent = "Indica una cantidad entera positiva.";
        mensajeCarrito.classList.add("error-general");
        return;
    }

    const lineaExistente = carrito.find(linea => linea.productoId === productoId);
    const cantidadActual = lineaExistente !== undefined ? lineaExistente.cantidad : 0;
    const nuevaCantidadTotal = cantidadActual + cantidad;

    if (!producto.tieneStockDisponible(nuevaCantidadTotal)) {
        mensajeCarrito.textContent =
        "No hay stock suficiente para '" + producto.nombre + "'. Máximo disponible: " + producto.stock + ".";
        mensajeCarrito.classList.add("error-general");
        return;
    }

    if (lineaExistente !== undefined) {
        lineaExistente.cantidad = nuevaCantidadTotal;
    } else {
        carrito.push({ productoId: producto.id, cantidad });
    }

    mensajeCarrito.textContent = "Añadido al carrito: " + producto.nombre + " (x" + cantidad + ").";
    mensajeCarrito.classList.add("exito");
    renderizarCarrito();
    }

    /**
     * Retira una línea completa del carrito usando findIndex y splice.
     * @param {number} productoId
     */
    function retirarLineaCarrito(productoId) {
    const indice = carrito.findIndex(linea => linea.productoId === productoId);
    if (indice !== -1) {
        carrito.splice(indice, 1);
        mensajeCarrito.classList.remove("error-general", "exito");
        mensajeCarrito.textContent = "Producto retirado del carrito.";
        renderizarCarrito();
    }
    }

    /**
     * Actualiza la vista del carrito y los totales económicos calculados.
     */
    function renderizarCarrito() {
    contenedorCarrito.replaceChildren();

    if (carrito.length === 0) {
        const pVacio = document.createElement("p");
        pVacio.textContent = "El carrito está vacío.";
        contenedorCarrito.append(pVacio);

        spanTotalUnidades.textContent = "0";
        spanSubtotal.textContent = formatearEuros(0);
        spanDescuento.textContent = formatearEuros(0);
        spanTotal.textContent = formatearEuros(0);
        return;
    }

    let totalUnidades = 0;

    carrito.forEach(linea => {
        const producto = catalogo.find(item => item.id === linea.productoId);
        if (producto === undefined) return;

        totalUnidades += linea.cantidad;
        const subtotalLinea = producto.precio * linea.cantidad;

        const fila = document.createElement("div");
        fila.className = "linea-carrito";

        const descripcion = document.createElement("span");
        descripcion.textContent =
        producto.nombre +
        " — Cantidad: " + linea.cantidad +
        " × " + formatearEuros(producto.precio) +
        " = " + formatearEuros(subtotalLinea);

        const btnRetirar = document.createElement("button");
        btnRetirar.type = "button";
        btnRetirar.className = "peligro";
        btnRetirar.dataset.accion = "retirar";
        btnRetirar.dataset.id = String(producto.id);
        btnRetirar.textContent = "Retirar";

        fila.append(descripcion, btnRetirar);
        contenedorCarrito.append(fila);
    });

    const subtotal = calcularSubtotal(carrito, catalogo);
    const porcentajeDescuento = subtotal >= 100 ? 10 : 0;
    const descuento = calcularDescuento(subtotal, porcentajeDescuento);
    const total = subtotal - descuento;

    spanTotalUnidades.textContent = String(totalUnidades);
    spanSubtotal.textContent = formatearEuros(subtotal);
    spanDescuento.textContent = formatearEuros(descuento);
    spanTotal.textContent = formatearEuros(total);
    }

    /* ==========================================================================
    5. FORMULARIO Y VALIDACIÓN CON CONSTRAINT VALIDATION API
    ========================================================================== */

    function obtenerModalidadSeleccionada() {
    const radios = formPedido.elements.namedItem("modalidad");
    for (const radio of radios) {
        if (radio.checked) {
        return radio.value;
        }
    }
    return "";
    }

    /**
     * Muestra u oculta los campos postales y limpia sus errores si se elige recogida.
     */
    function actualizarCamposEnvio() {
    const modalidad = obtenerModalidadSeleccionada();
    const esEnvio = modalidad === "envio";

    bloqueEnvio.classList.toggle("oculto", !esEnvio);
    campoDireccion.required = esEnvio;
    campoCP.required = esEnvio;

    if (!esEnvio) {
        campoDireccion.setCustomValidity("");
        campoCP.setCustomValidity("");
        campoDireccion.removeAttribute("aria-invalid");
        campoCP.removeAttribute("aria-invalid");
        document.querySelector("#err-direccion").textContent = "";
        document.querySelector("#err-cp").textContent = "";
    }
    }

    function actualizarContadorObservaciones() {
    const longitud = campoObservaciones.value.length;
    contadorObservaciones.textContent = longitud + " / 200 caracteres";
    }

    /**
     * Extrae los valores actuales del formulario mediante FormData y propiedades DOM.
     */
    function obtenerDatosFormulario() {
    const formData = new FormData(formPedido);
    return {
        nombre: String(formData.get("nombre") ?? ""),
        email: String(formData.get("email") ?? ""),
        modalidad: String(formData.get("modalidad") ?? ""),
        direccion: String(formData.get("direccion") ?? ""),
        cp: String(formData.get("cp") ?? ""),
        observaciones: String(formData.get("observaciones") ?? ""),
        acepto: campoAcepto.checked
    };
    }

    /**
     * Ejecuta la validación completa y actualiza los estados de validez y avisos en el DOM.
     * @param {boolean} mostrarTodos Si es true, muestra errores incluso en campos no tocados aún.
     * @returns {boolean}
     */
    function sincronizarValidacionFormulario(mostrarTodos = false) {
    for (const campo of camposValidables) {
        campo.setCustomValidity("");
    }

    const datos = obtenerDatosFormulario();
    const resultado = validarDatosPedido(datos);

    campoNombre.setCustomValidity(resultado.errores.nombre);

    if (campoEmail.validity.typeMismatch) {
        campoEmail.setCustomValidity("El formato del correo electrónico no es válido.");
    } else {
        campoEmail.setCustomValidity(resultado.errores.email);
    }

    if (datos.modalidad === "envio") {
        campoDireccion.setCustomValidity(resultado.errores.direccion);
        campoCP.setCustomValidity(resultado.errores.cp);
    } else {
        campoDireccion.setCustomValidity("");
        campoCP.setCustomValidity("");
    }

    campoObservaciones.setCustomValidity(resultado.errores.observaciones);
    campoAcepto.setCustomValidity(resultado.errores.acepto);

    const mapaErroresDOM = [
        [campoNombre, "#err-nombre"],
        [campoEmail, "#err-email"],
        [campoDireccion, "#err-direccion"],
        [campoCP, "#err-cp"],
        [campoObservaciones, "#err-observaciones"],
        [campoAcepto, "#err-acepto"]
    ];

    for (const [control, selectorError] of mapaErroresDOM) {
        const elementoError = document.querySelector(selectorError);
        if (!mostrarTodos && !camposVisitados.has(control)) {
        continue;
        }
        elementoError.textContent = control.validationMessage;
        control.setAttribute("aria-invalid", String(!control.validity.valid));
    }

    const errModalidad = document.querySelector("#err-modalidad");
    errModalidad.textContent = resultado.errores.modalidad;

    return formPedido.checkValidity() && resultado.valido;
    }

    /* ==========================================================================
    6. HISTORIAL DE PEDIDOS
    ========================================================================== */

    /**
     * Renderiza los pedidos confirmados filtrados por modalidad y calcula sus estadísticas.
     */
    function renderizarHistorial() {
    const filtro = selectFiltroHistorial.value;
    const pedidosFiltrados = filtro === "todos"
        ? pedidos
        : pedidos.filter(pedido => pedido.modalidad === filtro);

    const cantidadPedidos = pedidosFiltrados.length;
    let sumaImportes = 0;
    pedidosFiltrados.forEach(pedido => {
        sumaImportes += pedido.total;
    });

    spanHistorialCantidad.textContent = String(cantidadPedidos);
    spanHistorialSuma.textContent = formatearEuros(sumaImportes);

    contenedorHistorial.replaceChildren();

    if (cantidadPedidos === 0) {
        mensajeHistorial.textContent = pedidos.length === 0
        ? "Todavía no se ha confirmado ningún pedido."
        : "No hay pedidos que coincidan con la modalidad seleccionada.";
        return;
    }

    mensajeHistorial.textContent = "";

    pedidosFiltrados.forEach(pedido => {
        const tarjeta = document.createElement("article");
        tarjeta.className = "pedido-item";

        const cabecera = document.createElement("div");
        cabecera.className = "pedido-cabecera";

        const infoPrincipal = document.createElement("div");
        const titulo = document.createElement("strong");
        titulo.textContent = "Pedido #" + pedido.id + " — " + pedido.cliente.nombre;

        const metadatos = document.createElement("p");
        const etiquetaModalidad = pedido.modalidad === "envio" ? "Envío a domicilio" : "Recogida en tienda";
        metadatos.textContent =
        "Fecha: " + pedido.fecha +
        " | Modalidad: " + etiquetaModalidad +
        " | Total: " + formatearEuros(pedido.total);

        infoPrincipal.append(titulo, metadatos);

        const btnDetalle = document.createElement("button");
        btnDetalle.type = "button";
        btnDetalle.className = "secundario";
        btnDetalle.dataset.accion = "toggle-detalle";
        btnDetalle.setAttribute("aria-expanded", "false");
        btnDetalle.textContent = "Ver detalle";

        cabecera.append(infoPrincipal, btnDetalle);

        const detalle = document.createElement("div");
        detalle.className = "pedido-detalle oculto";

        const listaLineas = document.createElement("ul");
        pedido.lineas.forEach(linea => {
        const li = document.createElement("li");
        const subtotalLinea = linea.precioUnitario * linea.cantidad;
        li.textContent =
            linea.nombre + " — " + linea.cantidad + " ud. × " +
            formatearEuros(linea.precioUnitario) + " = " + formatearEuros(subtotalLinea);
        listaLineas.append(li);
        });

        const resumenPie = document.createElement("p");
        resumenPie.textContent =
        "Subtotal: " + formatearEuros(pedido.subtotal) +
        " | Descuento: " + formatearEuros(pedido.descuento) +
        " | Total: " + formatearEuros(pedido.total);

        detalle.append(listaLineas, resumenPie);

        if (pedido.modalidad === "envio") {
        const pEnvio = document.createElement("p");
        pEnvio.textContent = "Dirección de envío: " + pedido.cliente.direccion + " (CP " + pedido.cliente.cp + ")";
        detalle.append(pEnvio);
        }

        if (pedido.cliente.observaciones !== "") {
        const pObs = document.createElement("p");
        pObs.textContent = "Observaciones: " + pedido.cliente.observaciones;
        detalle.append(pObs);
        }

        tarjeta.append(cabecera, detalle);
        contenedorHistorial.append(tarjeta);
    });
    }

    /* ==========================================================================
    7. REGISTRO DE EVENTOS Y DELEGACIÓN
    ========================================================================== */

    // Búsqueda y filtro del catálogo
    inputBusqueda.addEventListener("input", renderizarCatalogo);
    selectCategoria.addEventListener("change", renderizarCatalogo);

    // Delegación de eventos en el catálogo para añadir productos
    contenedorCatalogo.addEventListener("click", evento => {
    if (!(evento.target instanceof Element)) return;
    const boton = evento.target.closest('button[data-accion="anadir"]');
    if (!boton || !contenedorCatalogo.contains(boton)) return;

    const productoId = Number(boton.dataset.id);
    const tarjeta = boton.closest(".tarjeta-producto");
    if (!tarjeta) return;

    const inputCantidad = tarjeta.querySelector('input[type="number"]');
    const textoCantidad = inputCantidad.value.trim();
    const cantidad = inputCantidad.valueAsNumber;

    if (textoCantidad === "" || !Number.isInteger(cantidad) || cantidad <= 0) {
        mensajeCarrito.classList.remove("exito");
        mensajeCarrito.classList.add("error-general");
        mensajeCarrito.textContent = "Introduce una cantidad entera mayor que cero.";
        inputCantidad.focus();
        return;
    }

    anadirAlCarrito(productoId, cantidad);
    });

    // Delegación de eventos en el carrito para retirar líneas
    contenedorCarrito.addEventListener("click", evento => {
    if (!(evento.target instanceof Element)) return;
    const boton = evento.target.closest('button[data-accion="retirar"]');
    if (!boton || !contenedorCarrito.contains(boton)) return;

    const productoId = Number(boton.dataset.id);
    retirarLineaCarrito(productoId);
    });

    // Eventos input y change en el formulario
    formPedido.addEventListener("input", evento => {
    if (evento.target === campoObservaciones) {
        actualizarContadorObservaciones();
    }
    if (camposValidables.includes(evento.target)) {
        camposVisitados.add(evento.target);
    }
    estadoPedido.textContent = "";
    sincronizarValidacionFormulario(false);
    });

    formPedido.addEventListener("change", evento => {
    if (evento.target instanceof HTMLInputElement && evento.target.name === "modalidad") {
        actualizarCamposEnvio();
    }
    if (camposValidables.includes(evento.target)) {
        camposVisitados.add(evento.target);
    }
    estadoPedido.textContent = "";
    sincronizarValidacionFormulario(false);
    });

    // Envío del formulario y confirmación del pedido
    formPedido.addEventListener("submit", evento => {
    evento.preventDefault();
    estadoPedido.classList.remove("error-general", "exito");

    for (const campo of camposValidables) {
        camposVisitados.add(campo);
    }

    const formularioValido = sincronizarValidacionFormulario(true);
    if (!formularioValido) {
        estadoPedido.textContent = "Revisa los campos marcados en rojo antes de confirmar el pedido.";
        estadoPedido.classList.add("error-general");
        formPedido.reportValidity();
        const primerInvalido = camposValidables.find(campo => !campo.validity.valid);
        primerInvalido?.focus();
        return;
    }

    const comprobacionStock = comprobarStockCarrito(carrito, catalogo);
    if (!comprobacionStock.valido) {
        estadoPedido.textContent = comprobacionStock.mensaje;
        estadoPedido.classList.add("error-general");
        return;
    }

    const datos = obtenerDatosFormulario();
    const subtotal = calcularSubtotal(carrito, catalogo);
    const porcentajeDescuento = subtotal >= 100 ? 10 : 0;
    const descuento = calcularDescuento(subtotal, porcentajeDescuento);
    const total = subtotal - descuento;

    // Descuenta stock y crea una instantánea independiente de cada línea comprada
    const lineasConfirmadas = carrito.map(linea => {
        const producto = catalogo.find(item => item.id === linea.productoId);
        producto.descontarStock(linea.cantidad);
        return {
        productoId: producto.id,
        nombre: producto.nombre,
        precioUnitario: producto.precio,
        cantidad: linea.cantidad
        };
    });

    const ahora = new Date();
    const fechaFormateada = ahora.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });

    const nuevoPedido = {
        id: siguienteNumeroPedido++,
        fecha: fechaFormateada,
        cliente: {
        nombre: datos.nombre.trim(),
        email: datos.email.trim(),
        direccion: datos.modalidad === "envio" ? datos.direccion.trim() : "",
        cp: datos.modalidad === "envio" ? datos.cp.trim() : "",
        observaciones: datos.observaciones.trim()
        },
        modalidad: datos.modalidad,
        lineas: lineasConfirmadas,
        subtotal,
        descuento,
        total
    };

    pedidos.push(nuevoPedido);

    // Limpia carrito, formulario y estados visuales de validación
    carrito.splice(0, carrito.length);
    camposVisitados.clear();
    formPedido.reset();
    actualizarCamposEnvio();
    actualizarContadorObservaciones();

    for (const campo of camposValidables) {
        campo.setCustomValidity("");
        campo.removeAttribute("aria-invalid");
    }
    const idsError = ["#err-nombre", "#err-email", "#err-modalidad", "#err-direccion", "#err-cp", "#err-observaciones", "#err-acepto"];
    for (const selector of idsError) {
        document.querySelector(selector).textContent = "";
    }

    mensajeCarrito.textContent = "";
    estadoPedido.textContent = "Pedido #" + nuevoPedido.id + " confirmado correctamente.";
    estadoPedido.classList.add("exito");

    renderizarCatalogo();
    renderizarCarrito();
    renderizarHistorial();
    });

    // Filtro y despliegue de detalles del historial
    selectFiltroHistorial.addEventListener("change", renderizarHistorial);

    contenedorHistorial.addEventListener("click", evento => {
    if (!(evento.target instanceof Element)) return;
    const boton = evento.target.closest('button[data-accion="toggle-detalle"]');
    if (!boton || !contenedorHistorial.contains(boton)) return;

    const tarjeta = boton.closest(".pedido-item");
    if (!tarjeta) return;

    const detalle = tarjeta.querySelector(".pedido-detalle");
    const ocultoAhora = detalle.classList.toggle("oculto");
    boton.textContent = ocultoAhora ? "Ver detalle" : "Ocultar detalle";
    boton.setAttribute("aria-expanded", String(!ocultoAhora));
    });

    // Exportación del historial en formato JSON
    btnExportar.addEventListener("click", () => {
    textareaJSON.value = JSON.stringify(pedidos, null, 2);
    });

    /* ==========================================================================
    8. INICIALIZACIÓN DE LA APLICACIÓN
    ========================================================================== */

    actualizarCamposEnvio();
    actualizarContadorObservaciones();
    renderizarCatalogo();
    renderizarCarrito();
    renderizarHistorial();