const $ = (id) => document.getElementById(id);

function leerJSON(texto, defecto) {
  try { return JSON.parse(texto) ?? defecto; } catch { return defecto; }
}

const sesion = leerJSON(sessionStorage.getItem("bs_sesion"), null);

// Verificación de seguridad (rol vendedor o admin)
if (!sesion || (sesion.rol !== "vendedor" && sesion.rol !== "administrador")) {
  window.location.href = "../login/login.html";
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
  const p = $("mensajeProd");
  p.textContent = texto;
  p.className = "mensaje " + (tipo || "");
}

function crear(etiqueta, clase, texto) {
  const e = document.createElement(etiqueta);
  if (clase) e.className = clase;
  if (texto !== undefined) e.textContent = texto;
  return e;
}

function leerProductosGuardados() {
  return leerJSON(localStorage.getItem("bs_productos"), []);
}

function guardarProductos(lista) {
  localStorage.setItem("bs_productos", JSON.stringify(lista));
}

// Pintar la lista de productos publicados por este vendedor
function pintarMisProductos() {
  const contenedor = $("listaMisProductos");
  contenedor.replaceChildren();

  const todos = leerProductosGuardados();
  // Filtra los productos creados por este vendedor en específico
  const misProds = todos.filter(p => p.vendedor === sesion.nick);

  $("sinMisProductos").hidden = misProds.length > 0;

  misProds.forEach(p => {
    const item = crear("div", "item-mi-prod");
    const img = crear("img");
    img.src = p.imagen;
    img.alt = p.nombre;

    const info = crear("div", "info");
    info.append(
      crear("span", "nombre", p.nombre),
      crear("span", "precio", "$" + p.precio.toFixed(2))
    );

    item.append(img, info);
    contenedor.append(item);
  });
}

// Convertir archivo de imagen local a Data URL (base64)
function archivoABase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
}

$("formProducto").addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const nombre = $("nombreProd");
  const precio = $("precioProd");
  const fileInput = $("imagenFile");
  const urlInput = $("imagenUrl");

  const okNombre = marcarError(nombre, nombre.value.trim().length >= 3 ? "" : "Escribe un nombre válido (mín. 3 letras).");
  const valPrecio = parseFloat(precio.value);
  const okPrecio = marcarError(precio, (!isNaN(valPrecio) && valPrecio > 0) ? "" : "Ingresa un precio mayor a 0.");

  let imagenFinal = "";
  if (fileInput.files && fileInput.files[0]) {
    imagenFinal = await archivoABase64(fileInput.files[0]);
  } else if (urlInput.value.trim().length > 0) {
    imagenFinal = urlInput.value.trim();
  }

  const okImg = marcarError(urlInput, imagenFinal ? "" : "Selecciona un archivo de imagen o ingresa una URL.");

  if (!okNombre || !okPrecio || !okImg) return;

  const nuevoProducto = {
    id: "p_" + Date.now(),
    nombre: nombre.value.trim(),
    precio: valPrecio,
    imagen: imagenFinal,
    vendedor: sesion.nick
  };

  const listaActual = leerProductosGuardados();
  listaActual.push(nuevoProducto);
  guardarProductos(listaActual);

  mostrarMensaje("¡Producto publicado exitosamente!", "ok");
  $("formProducto").reset();
  pintarMisProductos();
});

$("saludo").textContent = `Hola, ${sesion.nombre}`;
$("btnSalir").addEventListener("click", () => {
  sessionStorage.removeItem("bs_sesion");
  window.location.href = "../index.html";
});

pintarMisProductos();