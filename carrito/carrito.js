const $ = (id) => document.getElementById(id);

function avisar(texto) { $("aviso").textContent = texto; }

// Muestra a qué tarjeta se cobraría (solo si el usuario se registró con una)
function textoPago() {
  const usuario = leerJSON(localStorage.getItem("bs_usuarios"), []).find(u => u.nick === sesion.nick);
  return usuario && usuario.tarjeta
    ? `Se cobrará a la tarjeta ${usuario.tarjeta}.`
    : "Pago simulado (sin base de datos real).";
}

function pintar() {
  const { lineas, unidades, total } = resumenCarrito();
  const lista = $("lista");
  lista.replaceChildren();

  lineas.forEach(({ producto: p, cantidad }) => {
    const fila = crear("li", "fila-producto");

    const img = crear("img");
    img.src = p.imagen;
    img.alt = p.nombre;

    const info = crear("div", "info");
    info.append(crear("h2", "", p.nombre), crear("p", "unitario", dinero(p.precio) + " c/u"));

    const cant = crear("div", "cantidad");
    const menos = crear("button", "", "−");
    const mas = crear("button", "", "+");
    menos.type = mas.type = "button";
    menos.setAttribute("aria-label", "Quitar una unidad");
    mas.setAttribute("aria-label", "Añadir una unidad");
    menos.addEventListener("click", () => { cambiarCantidad(p.id, -1); pintar(); });
    mas.addEventListener("click", () => { cambiarCantidad(p.id, 1); pintar(); });
    cant.append(menos, crear("span", "", String(cantidad)), mas);

    const subtotal = crear("p", "subtotal", dinero(p.precio * cantidad));

    const quitar = crear("button", "enlace", "Quitar");
    quitar.type = "button";
    quitar.addEventListener("click", () => { quitarDelCarrito(p.id); pintar(); });

    fila.append(img, info, cant, subtotal, quitar);
    lista.append(fila);
  });

  const hayProductos = lineas.length > 0;
  $("contenido").hidden = !hayProductos;
  $("vacio").hidden = hayProductos;
  $("unidades").textContent = unidades;
  $("total").textContent = dinero(total);
}

function iniciar() {
  $("saludo").textContent = `Hola, ${sesion.nombre} (${sesion.rol})`;
  $("pago").textContent = textoPago();

  $("btnVaciar").addEventListener("click", () => {
    vaciarCarrito();
    avisar("");
    pintar();
  });

  $("btnFinalizar").addEventListener("click", () => {
    const { unidades, total } = resumenCarrito();
    if (unidades === 0) return;
    vaciarCarrito();
    pintar();
    avisar(`Compra simulada: ${unidades} artículo(s) por ${dinero(total)}. ¡Gracias por tu compra!`);
  });

  $("btnSalir").addEventListener("click", () => {
    sessionStorage.removeItem("bs_sesion");
    window.location.href = "../login/login.html";
  });

  pintar();
}

if (exigirSesion()) iniciar();