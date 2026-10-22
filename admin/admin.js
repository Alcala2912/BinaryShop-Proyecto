const $ = (id) => document.getElementById(id);

function leerJSON(texto, defecto) {
  try { return JSON.parse(texto) ?? defecto; } catch { return defecto; }
}

const sesion = leerJSON(sessionStorage.getItem("bs_sesion"), null);

// Verificación de seguridad (exclusivo para el rol administrador)
if (!sesion || sesion.rol !== "administrador") {
  window.location.href = "../login/login.html";
}

function crear(etiqueta, clase, texto) {
  const e = document.createElement(etiqueta);
  if (clase) e.className = clase;
  if (texto !== undefined) e.textContent = texto;
  return e;
}

let temporizadorAviso;
function avisar(texto) {
  const p = $("avisoAdmin");
  p.textContent = texto;
  clearTimeout(temporizadorAviso);
  temporizadorAviso = setTimeout(() => (p.textContent = ""), 3000);
}

// ===== GESTIÓN DE USUARIOS =====
function pintarUsuarios() {
  const contenedor = $("listaUsuarios");
  contenedor.replaceChildren();

  const usuarios = leerJSON(localStorage.getItem("bs_usuarios"), []);
  $("sinUsuarios").hidden = usuarios.length > 0;

  usuarios.forEach(u => {
    const fila = crear("div", "fila-admin");
    const info = crear("div", "info");
    info.append(
      crear("span", "titulo-item", `${u.nombre} ${u.apellido} (@${u.nick})`),
      crear("span", "sub-item", `Roles: ${u.roles.join(", ")}`)
    );

    const btnEliminar = crear("button", "btn-eliminar", "Eliminar");
    btnEliminar.type = "button";
    btnEliminar.addEventListener("click", () => eliminarUsuario(u.nick));

    fila.append(info, btnEliminar);
    contenedor.append(fila);
  });
}

function eliminarUsuario(nick) {
  let usuarios = leerJSON(localStorage.getItem("bs_usuarios"), []);
  usuarios = usuarios.filter(u => u.nick.toLowerCase() !== nick.toLowerCase());
  localStorage.setItem("bs_usuarios", JSON.stringify(usuarios));
  
  // También se remueven los productos asociados al vendedor eliminado
  let productos = leerJSON(localStorage.getItem("bs_productos"), []);
  productos = productos.filter(p => p.vendedor !== nick);
  localStorage.setItem("bs_productos", JSON.stringify(productos));

  avisar(`Se eliminó la cuenta del usuario @${nick}.`);
  pintarUsuarios();
  pintarProductos();
}

// ===== GESTIÓN DE PUBLICACIONES =====
function pintarProductos() {
  const contenedor = $("listaProductos");
  contenedor.replaceChildren();

  const productos = leerJSON(localStorage.getItem("bs_productos"), []);
  $("sinProductos").hidden = productos.length > 0;

  productos.forEach(p => {
    const fila = crear("div", "fila-admin");
    const info = crear("div", "info");
    info.append(
      crear("span", "titulo-item", p.nombre),
      crear("span", "sub-item", `Precio: $${p.precio.toFixed(2)} | Vendedor: @${p.vendedor}`)
    );

    const btnEliminar = crear("button", "btn-eliminar", "Remover");
    btnEliminar.type = "button";
    btnEliminar.addEventListener("click", () => eliminarProducto(p.id));

    fila.append(info, btnEliminar);
    contenedor.append(fila);
  });
}

function eliminarProducto(id) {
  let productos = leerJSON(localStorage.getItem("bs_productos"), []);
  productos = productos.filter(p => p.id !== id);
  localStorage.setItem("bs_productos", JSON.stringify(productos));

  avisar("Se removió la publicación del catálogo.");
  pintarProductos();
}

// ===== INICIO =====
$("saludo").textContent = `Hola, ${sesion.nombre} (Admin)`;
$("btnSalir").addEventListener("click", () => {
  sessionStorage.removeItem("bs_sesion");
  window.location.href = "../index.html";
});

pintarUsuarios();
pintarProductos();