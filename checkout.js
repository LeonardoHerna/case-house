const DEFAULT_WHATSAPP = "59897431589";
const SHIPPING_COSTS = {
  domicilio: 120,
  retiro: 0
};

// Links manuales de pago (sin backend dinamico).
const PAYMENT_LINKS = {
  mercadopago: "https://link.mercadopago.com.uy/fundashop"
};

// Referencias del DOM para producto, formulario y resumen.
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
const paymentMessageElement = document.getElementById("checkout-payment-message");
const payOnlineButton = document.getElementById("checkout-pay-online");
const paymentLinkNotice = document.getElementById("payment-link-notice");
const paymentPanels = {
  mercadopago: document.getElementById("payment-panel-mercadopago"),
  transferencia: document.getElementById("payment-panel-transferencia")
};

const params = new URLSearchParams(window.location.search);
// Producto recibido por query params desde la home.
const product = {
  name: params.get("name") || "Producto Funda Shop",
  sku: params.get("sku") || "SIN-SKU",
  image: params.get("image") || "imagenes/iphone-13.jpeg",
  price: Number(params.get("price") || 0)
};

function formatUYU(value) {
  // Normaliza montos a enteros para mostrar en UI.
  return Math.round(value);
}

function isConfiguredUrl(url) {
  // Valida que exista un link HTTP/HTTPS configurado.
  return /^https?:\/\//.test(url || "");
}

function getShippingValue() {
  // Obtiene costo de envio segun opcion seleccionada.
  const envio = checkoutForm?.elements?.envio?.value || "domicilio";
  return SHIPPING_COSTS[envio] ?? 0;
}

function getSelectedPaymentMethod() {
  // Obtiene metodo de pago activo en el formulario.
  return checkoutForm?.elements?.pago?.value || "mercadopago";
}

function getPaymentMethodLabel(method) {
  // Etiqueta legible para mensajes de estado de pago.
  if (method === "transferencia") return "transferencia bancaria";
  return "Mercado Pago";
}

function buildPaymentUrl(baseUrl, total, reference) {
  // Arma URL final agregando referencia, monto y descripcion.
  if (!isConfiguredUrl(baseUrl)) return "";

  const parsed = new URL(baseUrl);
  parsed.searchParams.set("external_reference", reference);
  parsed.searchParams.set("amount", String(formatUYU(total)));
  parsed.searchParams.set("description", product.name);
  return parsed.toString();
}

function updateMethodPanels() {
  // Muestra panel informativo segun metodo de pago.
  const selected = getSelectedPaymentMethod();

  Object.entries(paymentPanels).forEach(([key, panel]) => {
    if (!panel) return;
    panel.hidden = key !== selected;
  });
}

function updatePaymentLinks(total) {
  // Actualiza mensaje de disponibilidad del metodo online.
  const reference = `PRE-${product.sku}-${Date.now().toString().slice(-6)}`;
  const mercadopagoUrl = buildPaymentUrl(PAYMENT_LINKS.mercadopago, total, reference);

  const selected = getSelectedPaymentMethod();
  if (!paymentLinkNotice) return;

  if (selected === "mercadopago" && !mercadopagoUrl) {
    paymentLinkNotice.textContent = "Para activar este medio online, agrega tu link real de pago en PAYMENT_LINKS dentro de checkout.js.";
    paymentLinkNotice.classList.add("error");
    return;
  }

  if (selected === "transferencia") {
    paymentLinkNotice.textContent = "Verifica los datos de cuenta y envia el comprobante por WhatsApp.";
    paymentLinkNotice.classList.remove("error");
    return;
  }

  paymentLinkNotice.textContent = "Metodo online disponible. Puedes continuar al pago cuando confirmes el pedido.";
  paymentLinkNotice.classList.remove("error");
}

function updateTotals() {
  // Recalcula subtotal, envio y total al cambiar cantidad/envio.
  const quantity = Math.max(1, Math.min(10, Number(cantidadInput.value || 1)));
  cantidadInput.value = String(quantity);

  const subtotal = product.price * quantity;
  const shipping = getShippingValue();
  const total = subtotal + shipping;

  checkoutSubtotal.textContent = String(formatUYU(subtotal));
  checkoutShipping.textContent = shipping === 0 ? "Gratis" : `$${formatUYU(shipping)}`;
  checkoutTotal.textContent = String(formatUYU(total));
  updatePaymentLinks(total);
}

function setInitialProductData() {
  // Carga datos de producto al abrir checkout.
  checkoutName.textContent = product.name;
  checkoutSku.textContent = product.sku;
  checkoutPrice.textContent = String(formatUYU(product.price));
  checkoutImage.src = product.image;
  checkoutImage.alt = product.name;

  updateMethodPanels();
  updateTotals();
}

function setStatus(message, type) {
  // Muestra mensajes de validacion y estado del formulario.
  checkoutStatus.textContent = message;
  checkoutStatus.classList.remove("error", "success");
  if (type) checkoutStatus.classList.add(type);
}

function createOrderId() {
  // Genera un identificador simple para seguimiento del pedido.
  const now = new Date();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `FS-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${random}`;
}

function validateForm(data) {
  // Validaciones minimas de campos requeridos.
  if (!/^[A-Za-zÀ-ÿ\s'-]{2,60}$/.test(data.nombre)) return "Ingresa un nombre valido.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email)) return "Ingresa un email valido.";
  if (!/^[\d+\s()-]{8,20}$/.test(data.telefono)) return "Ingresa un telefono valido.";
  if (data.direccion.length < 6) return "Ingresa una direccion mas completa.";
  return "";
}

function buildWhatsAppUrl(order) {
  // Construye mensaje prefabricado para enviar el pedido por WhatsApp.
  const text = [
    "Hola, confirmo este pedido:",
    `Pedido: ${order.orderId}`,
    `Producto: ${order.producto}`,
    `SKU: ${order.sku}`,
    `Cantidad: ${order.cantidad}`,
    `Total: $${order.total}`,
    `Pago: ${order.pago}`,
    `Nombre: ${order.nombre}`,
    `Telefono: ${order.telefono}`
  ].join("\n");

  return `https://wa.me/${DEFAULT_WHATSAPP}?text=${encodeURIComponent(text)}`;
}

function getPaymentUrlForMethod(method, total, orderId) {
  // Devuelve URL de pago solo para metodos online.
  if (method === "transferencia") return "";

  const baseUrl = PAYMENT_LINKS[method] || "";
  return buildPaymentUrl(baseUrl, total, orderId);
}

function renderPaymentMessage(order, paymentUrl) {
  // Ajusta el bloque de confirmacion segun estado/metodo de pago.
  if (!paymentMessageElement || !payOnlineButton) return;

  if (order.pago === "transferencia") {
    paymentMessageElement.textContent = "Estado de pago: pendiente por transferencia. Envia comprobante por WhatsApp.";
    payOnlineButton.hidden = true;
    return;
  }

  if (paymentUrl) {
    paymentMessageElement.textContent = `Estado de pago: pendiente. Completa el pago con ${getPaymentMethodLabel(order.pago)}.`;
    payOnlineButton.href = paymentUrl;
    payOnlineButton.hidden = false;
    return;
  }

  paymentMessageElement.textContent = "Estado de pago: pendiente. Falta configurar el link de pago online en checkout.js.";
  payOnlineButton.hidden = true;
}

if (checkoutForm) {
  // Inicializacion de checkout y listeners de cambios del formulario.
  setInitialProductData();

  cantidadInput.addEventListener("input", updateTotals);

  checkoutForm.querySelectorAll('input[name="envio"]').forEach((radio) => {
    radio.addEventListener("change", updateTotals);
  });

  checkoutForm.querySelectorAll('input[name="pago"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      updateMethodPanels();
      updateTotals();
    });
  });

  checkoutForm.addEventListener("submit", async (event) => {
    // Flujo principal: valida, crea pedido local y prepara accion de pago.
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
      paymentUrl: "",
      paymentStatus: "pending_manual",
      ...payload
    };

    order.paymentUrl = getPaymentUrlForMethod(payload.pago, total, orderId);
    order.paymentStatus = order.paymentUrl ? "pending_online" : "pending_manual";

    const existing = JSON.parse(localStorage.getItem("fundashop_orders") || "[]");
    // Persistencia local temporal del pedido en el navegador.
    existing.push(order);
    localStorage.setItem("fundashop_orders", JSON.stringify(existing));

    orderIdElement.textContent = orderId;
    whatsappLink.href = buildWhatsAppUrl(order);
    renderPaymentMessage(order, order.paymentUrl);
    confirmationBox.hidden = false;

    checkoutForm.reset();
    cantidadInput.value = "1";
    updateMethodPanels();
    updateTotals();

    setStatus("Pedido confirmado. Revisa el detalle de pago y finaliza el proceso.", "success");
  });
}
