// Simulación de productos
const productos = [
  {
    nombre: "Funda iPhone 13 transparente",
    imagen: "imagenes/iphone-13.jpeg",
    whatsapp: "https://wa.me/598XXXXXXXX?text=Hola,%20quiero%20esta%20funda%20iPhone%2013"
  },
  {
    nombre: "Soporte para auto magnético",
    imagen: "imagenes/soporte-magne.webp",
    whatsapp: "https://wa.me/598XXXXXXXX?text=Hola,%20quiero%20el%20soporte%20magnético"
  },
  {
    nombre: "Funda Samsung S23 silicona",
    imagen: "imagenes/funda-s23.webp",
    whatsapp: "https://wa.me/598XXXXXXXX?text=Hola,%20quiero%20la%20funda%20para%20Samsung%20S23"
  },
  // Agregá más productos según necesites
];

const contenedor = document.querySelector(".productos-grid");

productos.forEach(prod => {
  const card = document.createElement("div");
  card.classList.add("producto-card");

  card.innerHTML = `
    <img src="${prod.imagen}" alt="${prod.nombre}">
    <h3>${prod.nombre}</h3>
    <a href="${prod.whatsapp}" target="_blank"><button>Comprar</button></a>
  `;

  contenedor.appendChild(card);
});


// MENÚ HAMBURGUESA
const toggle = document.getElementById("menu-toggle");
const menu = document.getElementById("mobile-menu");

toggle.addEventListener("click", () => {
  menu.classList.toggle("active");
    toggle.classList.toggle("rotated"); 
});


// MODAL DE COLECCIÓN
const ctaBtn = document.querySelector('.cta');
const overlay = document.getElementById('overlay');
const cerrarModal = document.getElementById('cerrarModal');

ctaBtn.addEventListener('click', (e) => {
  e.preventDefault(); // evitamos que haga scroll
  overlay.classList.add('active');
});

cerrarModal.addEventListener('click', () => {
  overlay.classList.remove('active');
});

// También cerramos al hacer clic fuera de la card
overlay.addEventListener('click', (e) => {
  if (e.target === overlay) {
    overlay.classList.remove('active');
  }
});


// FAQ desplegable
const preguntas = document.querySelectorAll(".faq-question");

preguntas.forEach(pregunta => {
  pregunta.addEventListener("click", () => {
    const activa = pregunta.classList.contains("active");

    // Cierra todas
    preguntas.forEach(p => {
      p.classList.remove("active");
      p.nextElementSibling.style.maxHeight = null;
    });

    // Abre solo si no estaba activa
    if (!activa) {
      pregunta.classList.add("active");
      const respuesta = pregunta.nextElementSibling;
      respuesta.style.maxHeight = respuesta.scrollHeight + "px";
    }
  });
});

// Botón subir arriba
const btnSubir = document.getElementById("btnSubirArriba");

window.addEventListener("scroll", () => {
  if (window.scrollY > 300) {
    btnSubir.style.display = "block";
  } else {
    btnSubir.style.display = "none";
  }
});

btnSubir.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});
