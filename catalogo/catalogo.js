const $ = (id) => document.getElementById(id);

// ===== Sesión: si no hay, vuelve al login =====
function leerJSON(texto, defecto) {
  try { return JSON.parse(texto) ?? defecto; } catch { return defecto; }
}
const sesion = leerJSON(sessionStorage.getItem("bs_sesion"), null);

if (!sesion) window.location.href = "../login/login.html";

// ===== Productos =====
function imagenBase(emoji, color) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200">` +
    `<rect width="300" height="200" fill="${color}"/>` +
    `<text x="150" y="125" font-size="80" text-anchor="middle">${emoji}</text></svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

const PRODUCTOS_BASE = [
  { id: "p1", nombre: "Auriculares inalámbricos", precio: 49.99, imagen: imagenBase("🎧", "#cfe0ff") },
  { id: "p2", nombre: "Teclado mecánico", precio: 69.9, imagen: imagenBase("⌨️", "#ffe7b8") },
  { id: "p3", nombre: "Mouse gamer", precio: 24.5, imagen: imagenBase("🖱️", "#d8f0df") },
  { id: "p4", nombre: "Monitor 24 pulgadas", precio: 159, imagen: imagenBase("🖥️", "#e3d9f7") },
  { id: "p5", nombre: "Mochila para laptop", precio: 35, imagen: imagenBase("🎒", "#ffd9d2") },
  { id: "p6", nombre: "Cámara web HD", precio: 39.99, imagen: imagenBase("📷", "#d6eef2") },
  { id: "p7", nombre: "Disco SSD 1 TB", precio: 89, imagen: imagenBase("💾", "#f1e6c9") },
  { id: "p8", nombre: "Parlante Bluetooth", precio: 29.99, imagen: imagenBase("🔊", "#dfe5ee") }
];

// Los productos que publique el vendedor se guardan en localStorage con la clave "bs_productos"
// con este formato: { id, nombre, precio, imagen }  (imagen = ruta o data URL)
function obtenerProductos() {
  return [...PRODUCTOS_BASE, ...leerJSON(localStorage.getItem("bs_productos"), [])];
}

function dinero(n) { return "$" + n.toFixed(2); }

// ===== Carrito (se guarda por usuario) =====
const CLAVE_CARRITO = "bs_carrito_" + (sesion ? sesion.nick : "");

function leerCarrito() { return leerJSON(localStorage.getItem(CLAVE_CARRITO), []); }
function guardarCarrito(carrito) { localStorage.setItem(CLAVE_CARRITO, JSON.stringify(carrito)); }

function agregarAlCarrito(id) {
  const carrito = leerCarrito();
  const linea = carrito.find(l => l.id === id);
  if (linea) linea.cantidad += 1;
  else carrito.push({ id, cantidad: 1 });
  guardarCarrito(carrito);
  pintarCarrito();
}

function cambiarCantidad(id, delta) {
  let carrito = leerCarrito();
  const linea = carrito.find(l => l.id === id);
  if (!linea) return;
  linea.cantidad += delta;
  if (linea.cantidad <= 0) carrito = carrito.filter(l => l.id !== id);
  guardarCarrito(carrito);
  pintarCarrito();
}

function quitarDelCarrito(id) {
  guardarCarrito(leerCarrito().filter(l => l.id !== id));
  pintarCarrito();
}

// ===== Utilidad para crear elementos sin innerHTML =====
function crear(etiqueta, clase, texto) {
  const e = document.createElement(etiqueta);
  if (clase) e.className = clase;
  if (texto !== undefined) e.textContent = texto;
  return e;
}

let temporizadorAviso;
function avisar(texto, tipo) {
  const p = $("aviso");
  p.textContent = texto;
  p.className = "aviso " + (tipo || "");
  clearTimeout(temporizadorAviso);
  temporizadorAviso = setTimeout(() => (p.textContent = ""), 3500);
}

// ===== Pintar catálogo =====
function pintarCatalogo() {
  const filtro = $("buscador").value.trim().toLowerCase();
  const contenedor = $("catalogo");
  contenedor.replaceChildren();

  const lista = obtenerProductos().filter(p => p.nombre.toLowerCase().includes(filtro));
  $("sinResultados").hidden = lista.length > 0;

  lista.forEach(p => {
    const tarjeta = crear("article", "tarjeta");

    const img = crear("img");
    img.src = p.imagen;
    img.alt = p.nombre;

    const cuerpo = crear("div", "cuerpo");
    cuerpo.append(crear("h2", "", p.nombre), crear("p", "precio", dinero(p.precio)));

    const botones = crear("div", "botones");
    const btnAgregar = crear("button", "boton", "Añadir al carrito");
    btnAgregar.type = "button";
    btnAgregar.addEventListener("click", () => {
      agregarAlCarrito(p.id);
      avisar(`"${p.nombre}" se añadió al carrito.`);
    });

    const btnComprar = crear("button", "boton secundario", "Comprar de inmediato");
    btnComprar.type = "button";
    btnComprar.addEventListener("click", () => {
      // Aquí iría el formulario de pago (procesamiento de compra).
      avisar(`Compra simulada: ${p.nombre} por ${dinero(p.precio)}.`);
    });

    botones.append(btnAgregar, btnComprar);
    cuerpo.append(botones);
    tarjeta.append(img, cuerpo);
    contenedor.append(tarjeta);
  });
}

// ===== Pintar carrito (conteo + desplegable) =====
function pintarCarrito() {
  const productos = obtenerProductos();
  // Descarta líneas de productos que ya no existen
  const carrito = leerCarrito().filter(l => productos.some(p => p.id === l.id));

  const lista = $("listaCarrito");
  lista.replaceChildren();

  let unidades = 0;
  let total = 0;

  carrito.forEach(linea => {
    const p = productos.find(x => x.id === linea.id);
    unidades += linea.cantidad;
    total += p.precio * linea.cantidad;

    const item = crear("li", "item-carrito");
    item.append(crear("span", "nombre", p.nombre));
    item.append(crear("span", "subtotal", dinero(p.precio * linea.cantidad)));

    const cantidad = crear("div", "cantidad");
    const menos = crear("button", "", "−");
    const mas = crear("button", "", "+");
    menos.type = mas.type = "button";
    menos.setAttribute("aria-label", "Quitar una unidad");
    mas.setAttribute("aria-label", "Añadir una unidad");
    menos.addEventListener("click", () => cambiarCantidad(p.id, -1));
    mas.addEventListener("click", () => cambiarCantidad(p.id, 1));
    cantidad.append(menos, crear("span", "", `${linea.cantidad} × ${dinero(p.precio)}`), mas);

    const quitar = crear("button", "enlace quitar", "Quitar");
    quitar.type = "button";
    quitar.addEventListener("click", () => quitarDelCarrito(p.id));

    item.append(cantidad, quitar);
    lista.append(item);
  });

  $("conteo").textContent = unidades;
  $("totalCarrito").textContent = dinero(total);
  $("carritoVacio").hidden = carrito.length > 0;
  $("pieCarrito").hidden = carrito.length === 0;
}

// ===== Inicio =====
function iniciar() {
  $("saludo").textContent = `Hola, ${sesion.nombre} (${sesion.rol})`;

  // Lógica para mostrar enlace al panel si es vendedor o administrador
  const btnPanel = $("btnPanel");
  if (sesion.rol === "vendedor") {
    btnPanel.textContent = "Panel Vendedor";
    btnPanel.href = "../vendedor/vendedor.html";
    btnPanel.hidden = false;
  } else if (sesion.rol === "administrador") {
    btnPanel.textContent = "Panel Admin";
    btnPanel.href = "../admin/admin.html";
    btnPanel.hidden = false;
  } else {
    btnPanel.hidden = true;
  }

  // Abrir / cerrar el desplegable del carrito
  $("btnCarrito").addEventListener("click", (e) => {
    e.stopPropagation();
    const abrir = $("desplegable").hidden;
    $("desplegable").hidden = !abrir;
    $("btnCarrito").setAttribute("aria-expanded", abrir);
  });
  
  document.addEventListener("click", (e) => {
    if (!$("desplegable").contains(e.target)) {
      $("desplegable").hidden = true;
      $("btnCarrito").setAttribute("aria-expanded", false);
    }
  });

  $("btnVaciar").addEventListener("click", () => {
    guardarCarrito([]);
    pintarCarrito();
  });

  $("btnFinalizar").addEventListener("click", () => {
    avisar("Compra simulada: tu pedido fue procesado.");
    guardarCarrito([]);
    pintarCarrito();
    $("desplegable").hidden = true;
  });

  $("btnSalir").addEventListener("click", () => {
    sessionStorage.removeItem("bs_sesion");
    window.location.href = "../index.html"; // Ajusta la ruta a tu login según la estructura
  });

  $("buscador").addEventListener("input", pintarCatalogo);

  pintarCatalogo();
  pintarCarrito();
}

if (sesion) iniciar();
