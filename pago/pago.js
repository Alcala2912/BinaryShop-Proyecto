const $ = (id) => document.getElementById(id);

function leerJSON(texto, defecto) {
  try { return JSON.parse(texto) ?? defecto; } catch { return defecto; }
}

const sesion = leerJSON(sessionStorage.getItem("bs_sesion"), null);

if (!sesion) {
  window.location.href = "../index.html";
}

const CLAVE_CARRITO = "bs_carrito_" + sesion.nick;

const PRODUCTOS_BASE = [
  { id: "p1", nombre: "Auriculares inalámbricos", precio: 49.99 },
  { id: "p2", nombre: "Teclado mecánico", precio: 69.9 },
  { id: "p3", nombre: "Mouse gamer", precio: 24.5 },
  { id: "p4", nombre: "Monitor 24 pulgadas", precio: 159 },
  { id: "p5", nombre: "Mochila para laptop", precio: 35 },
  { id: "p6", nombre: "Cámara web HD", precio: 39.99 },
  { id: "p7", nombre: "Disco SSD 1 TB", precio: 89 },
  { id: "p8", nombre: "Parlante Bluetooth", precio: 29.99 }
];

function obtenerProductos() {
  const guardados = leerJSON(localStorage.getItem("bs_productos"), []);
  return [...PRODUCTOS_BASE, ...guardados];
}

function marcarError(input, texto) {
  const campo = input.closest(".campo");
  if (campo && campo.querySelector(".error")) {
    campo.querySelector(".error").textContent = texto || "";
  }
  input.classList.toggle("invalido", Boolean(texto));
  return !texto;
}

function mostrarMensaje(texto, tipo) {
  const p = $("mensajePago");
  p.textContent = texto;
  p.className = "mensaje " + (tipo || "");
}

function crear(etiqueta, clase, texto) {
  const e = document.createElement(etiqueta);
  if (clase) e.className = clase;
  if (texto !== undefined) e.textContent = texto;
  return e;
}

function vencimientoValido(texto) {
  const m = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(texto);
  if (!m) return false;
  const hoy = new Date();
  const anio = 2000 + Number(m[2]);
  const mes = Number(m[1]);
  return anio > hoy.getFullYear() || (anio === hoy.getFullYear() && mes >= hoy.getMonth() + 1);
}

// Cargar auto-completado de los datos si están en localStorage desde el registro
function cargarDatosRegistrados() {
  const registrados = leerJSON(localStorage.getItem("bs_usuarios"), []);
  const u = registrados.find(x => x.nick.toLowerCase() === sesion.nick.toLowerCase());
  
  if (u) {
    if (u.nombre && u.apellido) $("pagoTitular").value = `${u.nombre} ${u.apellido}`;
    if (u.direccion) $("pagoDireccion").value = u.direccion;
  }
}

// Formateadores dinámicos de campos de tarjeta
$("pagoTarjeta").addEventListener("input", (e) => {
  const digitos = e.target.value.replace(/\D/g, "").slice(0, 16);
  e.target.value = digitos.replace(/(.{4})/g, "$1 ").trim();
});

$("pagoVence").addEventListener("input", (e) => {
  const d = e.target.value.replace(/\D/g, "").slice(0, 4);
  e.target.value = d.length > 2 ? d.slice(0, 2) + "/" + d.slice(2) : d;
});

$("pagoCvv").addEventListener("input", (e) => {
  e.target.value = e.target.value.replace(/\D/g, "");
});

// Pintar productos a comprar
function pintarResumen() {
  const productos = obtenerProductos();
  const carrito = leerJSON(localStorage.getItem(CLAVE_CARRITO), []);
  const contenedor = $("resumenProductos");
  contenedor.replaceChildren();

  let total = 0;

  if (carrito.length === 0) {
    contenedor.append(crear("p", "vacio", "No hay productos en el carrito."));
    $("btnPagar").disabled = true;
    $("montoTotal").textContent = "$0.00";
    return;
  }

  carrito.forEach(linea => {
    const p = productos.find(x => x.id === linea.id);
    if (!p) return;

    const subtotal = p.precio * linea.cantidad;
    total += subtotal;

    const item = crear("div", "item-resumen");
    item.append(
      crear("span", "nombre", `${p.nombre} (x${linea.cantidad})`),
      crear("span", "subtotal", "$" + subtotal.toFixed(2))
    );
    contenedor.append(item);
  });

  $("montoTotal").textContent = "$" + total.toFixed(2);
}

// Validar y procesar pago
$("formPago").addEventListener("submit", (e) => {
  e.preventDefault();

  const titular = $("pagoTitular");
  const tarjeta = $("pagoTarjeta");
  const vence = $("pagoVence");
  const cvv = $("pagoCvv");
  const direccion = $("pagoDireccion");

  const resultados = [
    marcarError(titular, titular.value.trim().length >= 3 ? "" : "Escribe el nombre del titular."),
    marcarError(tarjeta, tarjeta.value.replace(/\s/g, "").length === 16 ? "" : "Debe tener 16 dígitos."),
    marcarError(vence, vencimientoValido(vence.value) ? "" : "Formato MM/AA y fecha vigente."),
    marcarError(cvv, /^\d{3,4}$/.test(cvv.value) ? "" : "CVV de 3 o 4 dígitos."),
    marcarError(direccion, direccion.value.trim().length >= 8 ? "" : "Escribe la dirección de entrega.")
  ];

  if (resultados.includes(false)) return;

  mostrarMensaje("¡Procesando pago...", "ok");

  setTimeout(() => {
    mostrarMensaje("¡Pago realizado con éxito! Tu pedido ha sido registrado.", "ok");
    localStorage.removeItem(CLAVE_CARRITO); // Vacía el carrito
    
    setTimeout(() => {
      window.location.href = "../catalogo/catalogo.html";
    }, 2000);
  }, 1200);
});

// Inicialización
$("saludo").textContent = `Hola, ${sesion.nombre}`;
$("btnSalir").addEventListener("click", () => {
  sessionStorage.removeItem("bs_sesion");
  window.location.href = "../index.html";
});

cargarDatosRegistrados();
pintarResumen();