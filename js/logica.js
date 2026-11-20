    "use strict";

    /* ==========================================================================
    FUNCIONES PURAS DE CÁLCULO Y VALIDACIÓN (SIN ACCESO AL DOM)
    Reciben todos sus datos por parámetros y devuelven resultados explícitos.
    ========================================================================== */

    /**
     * Calcula el subtotal numérico del carrito sumando (precio * cantidad) de cada línea.
     * @param {Array<{productoId: number, cantidad: number}>} carrito Colección de líneas del carrito.
     * @param {Array<Producto>} catalogo Instancias de Producto disponibles.
     * @returns {number} Importe subtotal sin descuentos.
     */
    function calcularSubtotal(carrito, catalogo) {
    let subtotal = 0;
    for (const linea of carrito) {
        const producto = catalogo.find(item => item.id === linea.productoId);
        if (producto !== undefined) {
        subtotal += producto.precio * linea.cantidad;
        }
    }
    return subtotal;
    }

    /**
     * Calcula el importe de rebaja aplicando un porcentaje con valor por defecto 0.
     * @param {number} subtotal Importe base del pedido.
     * @param {number} porcentaje Porcentaje de descuento entre 0 y 100 (por defecto 0).
     * @returns {number} Importe exacto a descontar.
     */
    function calcularDescuento(subtotal, porcentaje = 0) {
    if (!Number.isFinite(subtotal) || subtotal < 0) return 0;
    if (!Number.isFinite(porcentaje) || porcentaje < 0 || porcentaje > 100) return 0;
    return subtotal * (porcentaje / 100);
    }

    /**
     * Valida las reglas de negocio de los datos del pedido sin consultar el DOM.
     * @param {object} datos Objeto con nombre, email, modalidad, direccion, cp, observaciones y acepto.
     * @returns {{valido: boolean, errores: object}} Resultado de la validación y mensajes por campo.
     */
    function validarDatosPedido(datos) {
    const errores = {
        nombre: "",
        email: "",
        modalidad: "",
        direccion: "",
        cp: "",
        observaciones: "",
        acepto: ""
    };

    // Nombre obligatorio entre 2 y 60 caracteres sin contar espacios exteriores
    const nombreLimpio = typeof datos.nombre === "string" ? datos.nombre.trim() : "";
    if (nombreLimpio.length < 2 || nombreLimpio.length > 60) {
        errores.nombre = "Escribe entre 2 y 60 caracteres sin contar espacios exteriores.";
    }

    // Formato válido de correo electrónico
    const emailLimpio = typeof datos.email === "string" ? datos.email.trim() : "";
    const patronEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailLimpio === "" || !patronEmail.test(emailLimpio)) {
        errores.email = "Introduce un correo electrónico válido.";
    }

    // Comprueba que la modalidad pertenezca a las opciones admitidas
    if (!["recogida", "envio"].includes(datos.modalidad)) {
        errores.modalidad = "Selecciona una modalidad de entrega válida.";
    }

    // Dirección y código postal solo son obligatorios si se selecciona envío
    if (datos.modalidad === "envio") {
        const direccionLimpia = typeof datos.direccion === "string" ? datos.direccion.trim() : "";
        if (direccionLimpia.length < 5 || direccionLimpia.length > 100) {
        errores.direccion = "La dirección debe tener entre 5 y 100 caracteres.";
        }

        const cpLimpio = typeof datos.cp === "string" ? datos.cp.trim() : "";
        // Expresión regular con agrupación sin captura y alternativas para provincias 01 a 52
        const patronCP = /^(?:0[1-9]|[1-4][0-9]|5[0-2])[0-9]{3}$/;
        if (!patronCP.test(cpLimpio)) {
        errores.cp = "Indica un código postal español válido (01000 a 52999).";
        }
    }

    // Observaciones opcionales de hasta 200 caracteres
    const obsTexto = typeof datos.observaciones === "string" ? datos.observaciones : "";
    if (obsTexto.length > 200) {
        errores.observaciones = "Las observaciones no pueden superar los 200 caracteres.";
    }

    // Casilla de confirmación obligatoria
    if (datos.acepto !== true) {
        errores.acepto = "Debes confirmar que los datos del pedido son correctos.";
    }

    const esValido = Object.values(errores).every(mensaje => mensaje === "");
    return { valido: esValido, errores };
    }

    /**
     * Comprueba antes de confirmar un pedido que el carrito tenga artículos y stock suficiente.
     * @param {Array<{productoId: number, cantidad: number}>} listaCarrito
     * @param {Array<Producto>} listaCatalogo
     * @returns {{valido: boolean, mensaje: string}}
     */
    function comprobarStockCarrito(listaCarrito, listaCatalogo) {
    if (listaCarrito.length === 0) {
        return { valido: false, mensaje: "El carrito está vacío. Añade al menos un producto." };
    }

    for (const linea of listaCarrito) {
        const producto = listaCatalogo.find(item => item.id === linea.productoId);
        if (producto === undefined) {
        return { valido: false, mensaje: "Uno de los productos del carrito ya no existe." };
        }
        if (!producto.tieneStockDisponible(linea.cantidad)) {
        return {
            valido: false,
            mensaje: "Stock insuficiente para '" + producto.nombre + "' (disponible: " + producto.stock + ")."
        };
        }
    }

    return { valido: true, mensaje: "" };
    }

    /**
     * Formatea un valor numérico a moneda con dos decimales para mostrarlo en la interfaz.
     * @param {number} importe
     * @returns {string}
     */
    function formatearEuros(importe) {
    if (!Number.isFinite(importe)) return "0.00 €";
    return importe.toFixed(2) + " €";
    }

    /**
     * Devuelve la etiqueta legible asociada al código interno de categoría.
     * @param {string} categoria
     * @returns {string}
     */
    function obtenerEtiquetaCategoria(categoria) {
    switch (categoria) {
        case "perifericos":
        return "Periféricos";
        case "oficina":
        return "Oficina";
        case "monitores":
        return "Monitores";
        default:
        return categoria;
    }
    }