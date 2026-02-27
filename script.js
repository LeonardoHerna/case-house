const productos = [
  {
    nombre: "Funda iPhone 13 transparente",
    imagen: "imagenes/iphone-13.jpeg",
    precio: 450,
    sku: "FS-IP13-TR",
    whatsapp: "https://wa.me/59897431589?text=Hola,%20quiero%20esta%20funda%20iPhone%2013"
  },
  {
    nombre: "Soporte para auto magnético",
    imagen: "imagenes/soporte-magne.webp",
    precio: 320,
    sku: "FS-SOP-MAG",
    whatsapp: "https://wa.me/59897431589?text=Hola,%20quiero%20el%20soporte%20magn%C3%A9tico"
  },
  {
    nombre: "Funda Samsung S23 silicona",
    imagen: "imagenes/funda-s23.webp",
    precio: 480,
    sku: "FS-S23-SIL",
    whatsapp: "https://wa.me/59897431589?text=Hola,%20quiero%20la%20funda%20para%20Samsung%20S23"
  },
  {
    nombre: "Funda iPhone 13 antigolpes",
    imagen: "imagenes/iphone-13.jpeg",
    precio: 520,
    sku: "FS-IP13-ANT",
    whatsapp: "https://wa.me/59897431589?text=Hola,%20quiero%20la%20funda%20iPhone%2013%20antigolpes"
  },
  {
    nombre: "Soporte magnético premium",
    imagen: "imagenes/soporte-magne.webp",
    precio: 390,
    sku: "FS-SOP-PRM",
    whatsapp: "https://wa.me/59897431589?text=Hola,%20quiero%20el%20soporte%20magn%C3%A9tico%20premium"
  },
  {
    nombre: "Funda Samsung S23 reforzada",
    imagen: "imagenes/funda-s23.webp",
    precio: 560,
    sku: "FS-S23-REF",
    whatsapp: "https://wa.me/59897431589?text=Hola,%20quiero%20la%20funda%20Samsung%20S23%20reforzada"
  },
  {
    nombre: "Funda iPhone 13 mate",
    imagen: "imagenes/iphone-13.jpeg",
    precio: 490,
    sku: "FS-IP13-MAT",
    whatsapp: "https://wa.me/59897431589?text=Hola,%20quiero%20la%20funda%20iPhone%2013%20mate"
  },
  {
    nombre: "Soporte para auto compacto",
    imagen: "imagenes/soporte-magne.webp",
    precio: 290,
    sku: "FS-SOP-CMP",
    whatsapp: "https://wa.me/59897431589?text=Hola,%20quiero%20el%20soporte%20para%20auto%20compacto"
  }
];

const resenas = [
  {
    nombre: "Martina R.",
    modelo: "Funda iPhone 13",
    estrellas: "★★★★★",
    texto: "Me llegó en el día y calzó perfecto. Excelente atención por WhatsApp."
  },
  {
    nombre: "Nicolás G.",
    modelo: "Soporte magnético",
    estrellas: "★★★★★",
    texto: "Quedó firme en el auto y no vibra. Muy buena relación calidad-precio."
  },
  {
    nombre: "Lucía P.",
    modelo: "Funda Samsung S23",
    estrellas: "★★★★★",
    texto: "Material de calidad y buen agarre. Recomendable para uso diario."
  }
];

const contenedorProductos = document.querySelector(".productos-grid");
const btnVerMasProductos = document.getElementById("ver-mas-productos");
const PRODUCTOS_INICIALES = 3;
const PRODUCTOS_POR_CARGA = 3;
const TEXTO_VER_MAS = "Ver más productos";
const TEXTO_VER_MENOS = "Ver menos";
let productosMostrados = 0;

function crearLinkCheckout(prod) {
  const params = new URLSearchParams({
    name: prod.nombre,
    price: String(prod.precio || 0),
    sku: prod.sku || "",
    image: prod.imagen
  });
  return `checkout.html?${params.toString()}`;
}

function crearCardProducto(prod) {
  const card = document.createElement("article");
  card.classList.add("producto-card");

  card.innerHTML = `
    <img src="${prod.imagen}" alt="${prod.nombre}">
    <h3>${prod.nombre}</h3>
    <p class="producto-precio">$${prod.precio}</p>
    <a class="btn-checkout" href="${crearLinkCheckout(prod)}">Comprar</a>
  `;

  return card;
}

function actualizarBotonVerMas() {
  if (!btnVerMasProductos) return;

  const hayMasProductos = productosMostrados < productos.length;
  const puedeVerMenos = productos.length > PRODUCTOS_INICIALES;

  if (hayMasProductos) {
    btnVerMasProductos.style.display = "inline-block";
    btnVerMasProductos.textContent = TEXTO_VER_MAS;
    btnVerMasProductos.dataset.mode = "more";
    return;
  }

  if (puedeVerMenos) {
    btnVerMasProductos.style.display = "inline-block";
    btnVerMasProductos.textContent = TEXTO_VER_MENOS;
    btnVerMasProductos.dataset.mode = "less";
    return;
  }

  btnVerMasProductos.style.display = "none";
}

function renderizarMasProductos(cantidad) {
  if (!contenedorProductos) return;

  const siguientes = productos.slice(productosMostrados, productosMostrados + cantidad);
  siguientes.forEach((prod) => {
    const card = crearCardProducto(prod);
    contenedorProductos.appendChild(card);
  });

  productosMostrados += siguientes.length;
  actualizarBotonVerMas();
}

if (contenedorProductos) {
  renderizarMasProductos(PRODUCTOS_INICIALES);
}

if (btnVerMasProductos) {
  btnVerMasProductos.addEventListener("click", () => {
    if (btnVerMasProductos.dataset.mode === "less") {
      contenedorProductos.innerHTML = "";
      productosMostrados = 0;
      renderizarMasProductos(PRODUCTOS_INICIALES);
      return;
    }

    renderizarMasProductos(PRODUCTOS_POR_CARGA);
  });
}

const contenedorResenas = document.getElementById("resenas-grid");

if (contenedorResenas) {
  resenas.forEach((item) => {
    const card = document.createElement("article");
    card.classList.add("resena-card");

    card.innerHTML = `
      <div class="resena-header">
        <span class="resena-nombre">${item.nombre}</span>
        <span class="resena-stars" aria-label="5 de 5 estrellas">${item.estrellas}</span>
      </div>
      <p class="resena-modelo">${item.modelo}</p>
      <p class="resena-texto">${item.texto}</p>
    `;

    contenedorResenas.appendChild(card);
  });
}

const toggle = document.getElementById("menu-toggle");
const menu = document.getElementById("mobile-menu");

if (toggle && menu) {
  toggle.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("active");
    toggle.classList.toggle("rotated");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });
}

const ctaBtn = document.querySelector(".cta");
const overlay = document.getElementById("overlay");
const cerrarModal = document.getElementById("cerrarModal");
const btnVerMasModal = document.getElementById("ver-mas-modal");
const productosExtraModal = document.querySelectorAll(".producto-modal-extra");

function resetearProductosModal() {
  if (!btnVerMasModal) return;
  productosExtraModal.forEach((item) => item.classList.remove("is-visible"));
  btnVerMasModal.textContent = "Ver mas productos";
  btnVerMasModal.dataset.mode = "more";
  btnVerMasModal.setAttribute("aria-expanded", "false");
}

if (btnVerMasModal && productosExtraModal.length) {
  resetearProductosModal();

  btnVerMasModal.addEventListener("click", () => {
    const mostrarMas = btnVerMasModal.dataset.mode !== "less";
    productosExtraModal.forEach((item) => {
      item.classList.toggle("is-visible", mostrarMas);
    });

    btnVerMasModal.textContent = mostrarMas ? "Ver menos" : "Ver mas productos";
    btnVerMasModal.dataset.mode = mostrarMas ? "less" : "more";
    btnVerMasModal.setAttribute("aria-expanded", String(mostrarMas));
  });
}

if (ctaBtn && overlay && cerrarModal) {
  ctaBtn.addEventListener("click", (e) => {
    e.preventDefault();
    overlay.classList.add("active");
    overlay.setAttribute("aria-hidden", "false");
  });

  cerrarModal.addEventListener("click", () => {
    overlay.classList.remove("active");
    overlay.setAttribute("aria-hidden", "true");
    resetearProductosModal();
  });

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      overlay.classList.remove("active");
      overlay.setAttribute("aria-hidden", "true");
      resetearProductosModal();
    }
  });
}

const preguntas = document.querySelectorAll(".faq-question");

preguntas.forEach((pregunta) => {
  pregunta.addEventListener("click", () => {
    const activa = pregunta.classList.contains("active");

    preguntas.forEach((p) => {
      p.classList.remove("active");
      p.setAttribute("aria-expanded", "false");
      p.nextElementSibling.style.maxHeight = null;
    });

    if (!activa) {
      pregunta.classList.add("active");
      pregunta.setAttribute("aria-expanded", "true");
      const respuesta = pregunta.nextElementSibling;
      respuesta.style.maxHeight = respuesta.scrollHeight + "px";
    }
  });
});

const btnSubir = document.getElementById("btnSubirArriba");

if (btnSubir) {
  window.addEventListener("scroll", () => {
    if (window.scrollY > 300) {
      btnSubir.style.display = "flex";
    } else {
      btnSubir.style.display = "none";
    }
  });

  btnSubir.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

const seccionesScroll = document.querySelectorAll("main section:not(.hero)");

seccionesScroll.forEach((seccion, index) => {
  seccion.classList.add("scroll-reveal");
  seccion.style.setProperty("--reveal-delay", `${Math.min(index * 70, 300)}ms`);
});

if ("IntersectionObserver" in window) {
  const observerSecciones = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.16,
      rootMargin: "0px 0px -12% 0px"
    }
  );

  seccionesScroll.forEach((seccion) => observerSecciones.observe(seccion));
} else {
  seccionesScroll.forEach((seccion) => seccion.classList.add("is-visible"));
}

const contactoForm = document.getElementById("contacto-form");
const formStatus = document.getElementById("form-status");
const startedAtInput = document.getElementById("form-started-at");

if (contactoForm && formStatus && startedAtInput) {
  startedAtInput.value = String(Date.now());

  const nombreInput = contactoForm.elements.nombre;
  const emailInput = contactoForm.elements.email;
  const mensajeInput = contactoForm.elements.mensaje;
  const gotchaInput = contactoForm.elements._gotcha;
  const submitBtn = contactoForm.querySelector('button[type="submit"]');

  const setStatus = (msg, type) => {
    formStatus.textContent = msg;
    formStatus.classList.remove("error", "success");
    if (type) formStatus.classList.add(type);
  };

  const marcarError = (input) => {
    if (input) input.classList.add("input-error");
  };

  const limpiarErrores = () => {
    contactoForm.querySelectorAll(".input-error").forEach((el) => el.classList.remove("input-error"));
  };

  contactoForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    limpiarErrores();
    setStatus("", null);

    const nombre = nombreInput.value.trim();
    const email = emailInput.value.trim();
    const mensaje = mensajeInput.value.trim();
    const elapsedMs = Date.now() - Number(startedAtInput.value || Date.now());

    if (gotchaInput.value.trim() !== "") {
      setStatus("No se pudo enviar el formulario.", "error");
      return;
    }

    if (elapsedMs < 2500) {
      setStatus("Esperá unos segundos y volvé a intentar.", "error");
      return;
    }

    if (!/^[A-Za-zÀ-ÿ\s'-]{2,60}$/.test(nombre)) {
      marcarError(nombreInput);
      setStatus("Ingresá un nombre válido (solo letras y espacios).", "error");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      marcarError(emailInput);
      setStatus("Ingresá un correo válido.", "error");
      return;
    }

    if (mensaje.length < 10 || mensaje.length > 700) {
      marcarError(mensajeInput);
      setStatus("El mensaje debe tener entre 10 y 700 caracteres.", "error");
      return;
    }

    if (/(https?:\/\/|<script|<\/script>)/i.test(mensaje)) {
      marcarError(mensajeInput);
      setStatus("El mensaje contiene contenido no permitido.", "error");
      return;
    }

    if (!submitBtn) return;

    submitBtn.disabled = true;
    submitBtn.textContent = "Enviando...";

    try {
      const formData = new FormData(contactoForm);
      const response = await fetch(contactoForm.action, {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json"
        }
      });

      if (!response.ok) {
        throw new Error("Error en el envío");
      }

      contactoForm.reset();
      startedAtInput.value = String(Date.now());
      setStatus("Mensaje enviado. Te respondemos a la brevedad.", "success");
    } catch (error) {
      setStatus("No se pudo enviar. Probá de nuevo en unos minutos.", "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Enviar";
    }
  });
}


