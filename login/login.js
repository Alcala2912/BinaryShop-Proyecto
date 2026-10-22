// ===== Usuarios predefinidos (simulan la base de datos) =====
const PREDEFINIDOS = [
  { nick: "comprador1", clave: "1234Abc", nombre: "Ana", apellido: "Pérez", roles: ["comprador"] },
  { nick: "vendedor1", clave: "1234Abc", nombre: "Luis", apellido: "Gómez", roles: ["vendedor"] },
  { nick: "admin", clave: "admin123", nombre: "Admin", apellido: "BinaryShop", roles: ["administrador"] }
];

const $ = (id) => document.getElementById(id);
const CLAVE_USUARIOS = "bs_usuarios"; // usuarios registrados (localStorage)
const CLAVE_SESION = "bs_sesion";     // usuario con sesión activa (sessionStorage)

// ===== Almacenamiento =====
function leerRegistrados() {
  try { return JSON.parse(localStorage.getItem(CLAVE_USUARIOS)) || []; }
  catch { return []; }
}

function buscarUsuario(nick) {
  nick = nick.trim().toLowerCase();
  const registrado = leerRegistrados().find(u => u.nick.toLowerCase() === nick);
  return registrado || PREDEFINIDOS.find(u => u.nick.toLowerCase() === nick) || null;
}

function guardarUsuario(usuario) {
  const lista = leerRegistrados().filter(u => u.nick.toLowerCase() !== usuario.nick.toLowerCase());
  lista.push(usuario);
  localStorage.setItem(CLAVE_USUARIOS, JSON.stringify(lista));
}

// ===== Utilidades de interfaz =====
function marcarError(input, texto) {
  input.closest(".campo").querySelector(".error").textContent = texto || "";
  input.classList.toggle("invalido", Boolean(texto));
  return !texto;
}

function mostrarMensaje(form, texto, tipo) {
  const p = form.querySelector(".mensaje");
  p.textContent = texto;
  p.className = "mensaje " + (tipo || "");
}

function limpiar(form) {
  form.querySelectorAll(".error").forEach(p => (p.textContent = ""));
  form.querySelectorAll("input").forEach(i => i.classList.remove("invalido"));
  mostrarMensaje(form, "", "");
}

// ===== Pestañas =====
function mostrarPestana(cual) {
  const login = cual === "login";
  $("formLogin").hidden = !login;
  $("formRegistro").hidden = login;
  $("tabLogin").classList.toggle("activa", login);
  $("tabRegistro").classList.toggle("activa", !login);
  $("tabLogin").setAttribute("aria-selected", login);
  $("tabRegistro").setAttribute("aria-selected", !login);
}
$("tabLogin").addEventListener("click", () => mostrarPestana("login"));
$("tabRegistro").addEventListener("click", () => mostrarPestana("registro"));

// ===== Formato de tarjeta y vencimiento =====
$("regTarjeta").addEventListener("input", (e) => {
  const digitos = e.target.value.replace(/\D/g, "").slice(0, 16);
  e.target.value = digitos.replace(/(.{4})/g, "$1 ").trim();
});
$("regVence").addEventListener("input", (e) => {
  const d = e.target.value.replace(/\D/g, "").slice(0, 4);
  e.target.value = d.length > 2 ? d.slice(0, 2) + "/" + d.slice(2) : d;
});
$("regCvv").addEventListener("input", (e) => {
  e.target.value = e.target.value.replace(/\D/g, "");
});

// ===== LOGIN =====
$("formLogin").addEventListener("submit", (e) => {
  e.preventDefault();
  const form = e.target;
  limpiar(form);

  const nick = $("loginNick"), clave = $("loginClave"), rol = $("loginRol").value;
  const okNick = marcarError(nick, nick.value.trim() ? "" : "Escribe tu nickname.");
  const okClave = marcarError(clave, clave.value ? "" : "Escribe tu contraseña.");
  if (!okNick || !okClave) return;

  const usuario = buscarUsuario(nick.value);
  if (!usuario || usuario.clave !== clave.value) {
    return mostrarMensaje(form, "Nickname o contraseña incorrectos.", "mal");
  }
  if (!usuario.roles.includes(rol)) {
    return mostrarMensaje(form, `Tu cuenta no tiene el rol de ${rol}.`, "mal");
  }

  sessionStorage.setItem(CLAVE_SESION, JSON.stringify({ nick: usuario.nick, nombre: usuario.nombre, rol }));
  mostrarMensaje(form, `Bienvenido, ${usuario.nombre}. Entraste como ${rol}.`, "ok");

  // Redirección según el rol (cuando existan las otras páginas, agrega sus rutas aquí)
  const destinos = {
    comprador: "/catalogo/catalogo.html"
    // vendedor: "../vendedor/vendedor.html",
    // administrador: "../admin/admin.html"
  };
  if (destinos[rol]) setTimeout(() => (window.location.href = destinos[rol]), 800);
});

// ===== REGISTRO =====
$("formRegistro").addEventListener("submit", (e) => {
  e.preventDefault();
  const form = e.target;
  limpiar(form);

  const nombre = $("regNombre"), apellido = $("regApellido"), direccion = $("regDireccion");
  const nick = $("regNick"), clave = $("regClave");
  const tarjeta = $("regTarjeta"), vence = $("regVence"), cvv = $("regCvv");
  const rol = form.querySelector('input[name="regRol"]:checked').value;

  const resultados = [
    marcarError(nombre, nombre.value.trim().length >= 2 ? "" : "Escribe tu nombre."),
    marcarError(apellido, apellido.value.trim().length >= 2 ? "" : "Escribe tu apellido."),
    marcarError(direccion, direccion.value.trim().length >= 8 ? "" : "Escribe tu dirección completa."),
    marcarError(nick, /^[A-Za-z0-9_]{3,20}$/.test(nick.value.trim()) ? "" : "Usa 3 a 20 letras, números o guion bajo."),
    marcarError(clave, clave.value.length >= 6 ? "" : "Mínimo 6 caracteres."),
    marcarError(tarjeta, tarjeta.value.replace(/\s/g, "").length === 16 ? "" : "Debe tener 16 dígitos."),
    marcarError(vence, vencimientoValido(vence.value) ? "" : "Usa el formato MM/AA y una fecha vigente."),
    marcarError(cvv, /^\d{3,4}$/.test(cvv.value) ? "" : "Debe tener 3 o 4 dígitos.")
  ];
  if (resultados.includes(false)) return;

  const existente = buscarUsuario(nick.value);

  if (existente) {
    // Caso: comprador existente que quiere habilitar la venta
    if (existente.clave !== clave.value) {
      return mostrarMensaje(form, "Ese nickname ya está en uso.", "mal");
    }
    if (existente.roles.includes(rol)) {
      return mostrarMensaje(form, "Ya tienes una cuenta con ese rol. Inicia sesión.", "mal");
    }
    existente.roles.push(rol);
    guardarUsuario(existente);
    mostrarMensaje(form, `Listo: se habilitó el rol de ${rol} en tu cuenta.`, "ok");
  } else {
    guardarUsuario({
      nick: nick.value.trim(),
      clave: clave.value,
      nombre: nombre.value.trim(),
      apellido: apellido.value.trim(),
      direccion: direccion.value.trim(),
      roles: [rol],
      tarjeta: "**** " + tarjeta.value.replace(/\s/g, "").slice(-4) // nunca se guarda el número completo ni el CVV
    });
    mostrarMensaje(form, "Cuenta creada. Ya puedes iniciar sesión.", "ok");
  }

  const nickRegistrado = nick.value.trim();
  setTimeout(() => {
    form.reset();
    $("loginNick").value = nickRegistrado;
    $("loginRol").value = rol;
    mostrarPestana("login");
  }, 1400);
});

function vencimientoValido(texto) {
  const m = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(texto);
  if (!m) return false;
  const hoy = new Date();
  const anio = 2000 + Number(m[2]);
  const mes = Number(m[1]);
  return anio > hoy.getFullYear() || (anio === hoy.getFullYear() && mes >= hoy.getMonth() + 1);
}
