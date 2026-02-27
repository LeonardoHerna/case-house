const DEFAULT_WHATSAPP = "59897431589";
const SHIPPING_COSTS = {
  domicilio: 120,
  retiro: 0
};

const checkoutName = document.getElementById("checkout-name");
const checkoutSku = document.getElementById("checkout-sku");
const checkoutPrice = document.getElementById("checkout-price");
const checkoutImage = document.getElementById("checkout-image");
const checkoutSubtotal = document.getElementById("checkout-subtotal");
const checkoutShipping = document.getElementById("checkout-shipping");
const checkoutTotal = document.getElementById("checkout-total");
const cantidadInput = document.getElementById("cantidad");
const checkoutForm = document.getElementById("checkout-form");
const checkoutStatus = document.getElementById("checkout-status");
const confirmationBox = document.getElementById("checkout-confirmacion");
const orderIdElement = document.getElementById("checkout-order-id");
const whatsappLink = document.getElementById("checkout-whatsapp");

const params = new URLSearchParams(window.location.search);
const product = {
  name: params.get("name") || "Producto Funda Shop",
  sku: params.get("sku") || "SIN-SKU",
  image: params.get("image") || "imagenes/iphone-13.jpeg",
  price: Number(params.get("price") || 0)
};

function formatUYU(value) {
  return Math.round(value);
}

function getShippingValue() {
  const envio = checkoutForm?.elements?.envio?.value || "domicilio";
  return SHIPPING_COSTS[envio] ?? 0;
}

function updateTotals() {
  const quantity = Math.max(1, Math.min(10, Number(cantidadInput.value || 1)));
  cantidadInput.value = String(quantity);

  const subtotal = product.price * quantity;
  const shipping = getShippingValue();
  const total = subtotal + shipping;

  checkoutSubtotal.textContent = String(formatUYU(subtotal));
  checkoutShipping.textContent = shipping === 0 ? "Gratis" : `$${formatUYU(shipping)}`;
  checkoutTotal.textContent = String(formatUYU(total));
}

function setInitialProductData() {
  checkoutName.textContent = product.name;
  checkoutSku.textContent = product.sku;
  checkoutPrice.textContent = String(formatUYU(product.price));
  checkoutImage.src = product.image;
  checkoutImage.alt = product.name;
  updateTotals();
}

function setStatus(message, type) {
  checkoutStatus.textContent = message;
  checkoutStatus.classList.remove("error", "success");
  if (type) checkoutStatus.classList.add(type);
}

function createOrderId() {
  const now = new Date();
  return `FS-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`;
}

function validateForm(data) {
  if (!/^[A-Za-zÀ-ÿ\s'-]{2,60}$/.test(data.nombre)) return "Ingresá un nombre válido.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email)) return "Ingresá un email válido.";
  if (!/^[\d+\s()-]{8,20}$/.test(data.telefono)) return "Ingresá un teléfono válido.";
  if (data.direccion.length < 6) return "Ingresá una dirección más completa.";
  return "";
}

function buildWhatsAppUrl(order) {
  const text = [
    "Hola, confirmo este pedido:",
    `Pedido: ${order.orderId}`,
    `Producto: ${order.producto}`,
    `SKU: ${order.sku}`,
    `Cantidad: ${order.cantidad}`,
    `Total: $${order.total}`,
    `Pago: ${order.pago}`,
    `Envío: ${order.envio}`,
    `Nombre: ${order.nombre}`,
    `Teléfono: ${order.telefono}`
  ].join("\n");
  return `https://wa.me/${DEFAULT_WHATSAPP}?text=${encodeURIComponent(text)}`;
}

if (checkoutForm) {
  setInitialProductData();

  cantidadInput.addEventListener("input", updateTotals);
  checkoutForm.querySelectorAll('input[name="envio"]').forEach((radio) => {
    radio.addEventListener("change", updateTotals);
  });

  checkoutForm.addEventListener("submit", (event) => {
    event.preventDefault();
    setStatus("", null);

    const formData = new FormData(checkoutForm);
    const payload = {
      nombre: String(formData.get("nombre") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      telefono: String(formData.get("telefono") || "").trim(),
      departamento: String(formData.get("departamento") || "").trim(),
      direccion: String(formData.get("direccion") || "").trim(),
      envio: String(formData.get("envio") || "domicilio"),
      pago: String(formData.get("pago") || "mercadopago"),
      notas: String(formData.get("notas") || "").trim()
    };

    const validationError = validateForm(payload);
    if (validationError) {
      setStatus(validationError, "error");
      return;
    }

    const quantity = Number(cantidadInput.value || 1);
    const subtotal = product.price * quantity;
    const shipping = SHIPPING_COSTS[payload.envio] ?? 0;
    const total = subtotal + shipping;
    const orderId = createOrderId();

    const order = {
      orderId,
      fecha: new Date().toISOString(),
      producto: product.name,
      sku: product.sku,
      precioUnitario: product.price,
      cantidad: quantity,
      subtotal,
      shipping,
      total,
      ...payload
    };

    const existing = JSON.parse(localStorage.getItem("fundashop_orders") || "[]");
    existing.push(order);
    localStorage.setItem("fundashop_orders", JSON.stringify(existing));

    orderIdElement.textContent = orderId;
    whatsappLink.href = buildWhatsAppUrl(order);
    confirmationBox.hidden = false;
    checkoutForm.reset();
    cantidadInput.value = "1";
    updateTotals();
    setStatus("Compra confirmada. Revisá el detalle final.", "success");
  });
}
