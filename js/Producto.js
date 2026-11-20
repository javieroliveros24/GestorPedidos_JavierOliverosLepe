    "use strict";

    /* ==========================================================================
    CLASE PRODUCTO Y DATOS INICIALES DEL CATÁLOGO
    ========================================================================== */

    class Producto {
    /**
     * Inicializa una instancia de Producto comprobando la validez de sus datos.
     * @param {number} id Identificador entero positivo único.
     * @param {string} nombre Nombre descriptivo del producto.
     * @param {string} categoria Categoría a la que pertenece.
     * @param {number} precio Precio unitario finito mayor que cero.
     * @param {number} stock Existencias enteras no negativas.
     */
    constructor(id, nombre, categoria, precio, stock) {
        const idValido = Number.isInteger(id) && id > 0;
        const nombreValido = typeof nombre === "string" && nombre.trim() !== "";
        const categoriaValida = typeof categoria === "string" && categoria.trim() !== "";
        const precioValido = Number.isFinite(precio) && precio > 0;
        const stockValido = Number.isInteger(stock) && stock >= 0;

        if (!idValido || !nombreValido || !categoriaValida || !precioValido || !stockValido) {
        throw new TypeError("Datos de producto no válidos");
        }

        this.id = id;
        this.nombre = nombre.trim();
        this.categoria = categoria.trim();
        this.precio = precio;
        this.stock = stock;
    }

    /**
     * Comprueba mediante 'this' si hay existencias suficientes para cubrir la cantidad solicitada.
     * @param {number} cantidad Unidades solicitadas.
     * @returns {boolean} true si la cantidad es entera positiva y no supera el stock.
     */
    tieneStockDisponible(cantidad) {
        return Number.isInteger(cantidad) && cantidad > 0 && this.stock >= cantidad;
    }

    /**
     * Descuenta las unidades compradas del stock actual usando 'this'.
     * @param {number} cantidad Unidades a descontar.
     * @returns {boolean} true si el descuento se realizó; false si no había stock suficiente.
     */
    descontarStock(cantidad) {
        if (!this.tieneStockDisponible(cantidad)) {
        return false;
        }
        this.stock -= cantidad;
        return true;
    }
    }

    // Datos base del catálogo: al menos 6 productos de 3 categorías, con uno agotado y opciones >= 100 €
    const datosProductosIniciales = [
    { id: 101, nombre: "Ratón óptico USB", categoria: "perifericos", precio: 12.50, stock: 8 },
    { id: 102, nombre: "Teclado mecánico", categoria: "perifericos", precio: 45.90, stock: 0 },
    { id: 103, nombre: "Paquete 500 folios A4", categoria: "oficina", precio: 6.25, stock: 25 },
    { id: 104, nombre: "Silla ergonómica básica", categoria: "oficina", precio: 89.00, stock: 3 },
    { id: 105, nombre: "Monitor IPS 24 pulgadas", categoria: "monitores", precio: 135.00, stock: 4 },
    { id: 106, nombre: "Monitor curvo 27 pulgadas", categoria: "monitores", precio: 210.50, stock: 2 }
    ];