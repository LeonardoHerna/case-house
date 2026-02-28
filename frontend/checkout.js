// Configuracion base del frontend para comunicarse con backend y WhatsApp.
const API_BASE_URL = "http://localhost:3000";
const DEFAULT_WHATSAPP = "59897431589";
const SHIPPING_COSTS = {
  domicilio: 120,
  retiro: 0
};

// Referencias del DOM para producto, formulario, estado y confirmacion final.
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
const paymentPanels = {
  mercadopago: document.getElementById("payment-panel-mercadopago"),
  transferencia: document.getElementById("payment-panel-transferencia")
};

// Producto recibido por query params desde la home.
const params = new URLSearchParams(window.location.search);
const product = {
  name: params.get("name") || "Producto Funda Shop",
  sku: params.get("sku") || "SIN-SKU",
  image: params.get("image") || "imagenes/iphone-13.jpeg",
  price: Number(params.get("price") || 0)
};

function formatUYU(value) {
  // Normaliza montos a entero para mostrar en UI.
  return Math.round(Number(value || 0));
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

function updateMethodPanels() {
  // Muestra solo el panel informativo del metodo elegido por el cliente.
  const selected = getSelectedPaymentMethod();
  Object.entries(paymentPanels).forEach(([key, panel]) => {
    if (!panel) return;
    panel.hidden = key !== selected;
  });
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

function renderPaymentMessage(order, paymentUrl) {
  // Ajusta confirmacion para mostrar boton Pagar ahora solo cuando aplica.
  if (!paymentMessageElement || !payOnlineButton) return;

  if (order.pago === "transferencia") {
    paymentMessageElement.textContent = "Estado de pago: pendiente por transferencia. Envia comprobante por WhatsApp.";
    payOnlineButton.hidden = true;
    return;
  }

  if (paymentUrl) {
    paymentMessageElement.textContent = "Estado de pago: pendiente. Completa el pago con el boton Pagar ahora.";
    payOnlineButton.href = paymentUrl;
    payOnlineButton.hidden = false;
    return;
  }

  paymentMessageElement.textContent = "Estado de pago: pendiente. No se pudo generar el link de Mercado Pago.";
  payOnlineButton.hidden = true;
}

function showMercadoPagoReturnStatus() {
  // Muestra resultado de retorno cuando Mercado Pago redirige de vuelta al checkout.
  const status = params.get("status");
  if (!status) return;

  if (status === "success") {
    setStatus("Pago aprobado por Mercado Pago.", "success");
    return;
  }
  if (status === "pending") {
    setStatus("Pago pendiente de confirmacion en Mercado Pago.", "success");
    return;
  }
  if (status === "failure") {
    setStatus("El pago fue rechazado o cancelado. Puedes intentarlo nuevamente.", "error");
  }
}

if (checkoutForm) {
  // Inicializacion de checkout y listeners de cambios del formulario.
  setInitialProductData();
  showMercadoPagoReturnStatus();

  cantidadInput.addEventListener("input", updateTotals);

  checkoutForm.querySelectorAll('input[name="envio"]').forEach((radio) => {
    radio.addEventListener("change", updateTotals);
  });

  checkoutForm.querySelectorAll('input[name="pago"]').forEach((radio) => {
    radio.addEventListener("change", updateMethodPanels);
  });

  checkoutForm.addEventListener("submit", async (event) => {
    // Flujo principal: valida, crea pedido en backend y renderiza confirmacion.
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
    const shippingCost = SHIPPING_COSTS[payload.envio] ?? 0;

    // Payload que backend usa para crear orden en MongoDB y preferencia MP.
    const orderRequest = {
      customer: {
        fullName: payload.nombre,
        email: payload.email,
        phone: payload.telefono,
        department: payload.departamento,
        address: payload.direccion
      },
      shipping: {
        type: payload.envio,
        cost: shippingCost
      },
      payment: {
        method: payload.pago
      },
      item: {
        name: product.name,
        sku: product.sku,
        image: product.image,
        quantity,
        unitPrice: product.price
      },
      notes: payload.notas
    };

    try {
      // Crea pedido real en backend y obtiene estado + URL de pago online.
      const response = await fetch(`${API_BASE_URL}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(orderRequest)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || data?.error || "No se pudo crear el pedido.");
      }

      // Estructura local para confirmacion visual y mensaje por WhatsApp.
      const order = {
        orderId: data.orderId,
        producto: product.name,
        sku: product.sku,
        cantidad: quantity,
        total: formatUYU(data.total),
        pago: payload.pago === "transferencia" ? "Transferencia bancaria" : "Mercado Pago",
        nombre: payload.nombre,
        telefono: payload.telefono
      };

      orderIdElement.textContent = order.orderId;
      whatsappLink.href = buildWhatsAppUrl(order);
      renderPaymentMessage(order, data.paymentUrl || "");
      confirmationBox.hidden = false;

      checkoutForm.reset();
      cantidadInput.value = "1";
      updateMethodPanels();
      updateTotals();

      setStatus("Pedido confirmado. Revisa el detalle y continua con el pago si corresponde.", "success");
    } catch (error) {
      setStatus(error.message || "No se pudo confirmar el pedido.", "error");
    }
  });
}
