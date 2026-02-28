require("dotenv").config();

// Dependencias base para API, persistencia y archivos estaticos.
const path = require("path");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

// Modelos de MongoDB para productos y pedidos.
const Product = require("./models/Product");
const Order = require("./models/Order");

// Configuracion centralizada de variables de entorno.
const PORT = Number(process.env.PORT || 3000);
const MONGO_URI = process.env.MONGO_URI || "";
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "*";
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || "";
const PUBLIC_FRONTEND_URL = process.env.PUBLIC_FRONTEND_URL || `http://localhost:${PORT}`;

// Inicializacion de app Express.
const app = express();

// Configuracion de CORS para permitir frontend local o dominio productivo.
app.use(
  cors({
    origin: FRONTEND_ORIGIN
  })
);

// Middleware para parsear JSON y usar frontend estatico dentro de /frontend.
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "frontend")));

function toPositiveNumber(value, fallback = 0) {
  // Normaliza montos numericos para evitar NaN y negativos.
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, parsed);
}

function createOrderId() {
  // Genera identificador de pedido consistente para referencia externa.
  const now = new Date();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `FS-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${random}`;
}

function mapMercadoPagoStatus(status) {
  // Mapea estado de Mercado Pago a estado interno de pago/pedido.
  if (status === "approved") {
    return { paymentStatus: "approved", orderStatus: "paid" };
  }
  if (status === "in_process") {
    return { paymentStatus: "in_process", orderStatus: "payment_pending" };
  }
  if (status === "rejected" || status === "cancelled") {
    return { paymentStatus: "rejected", orderStatus: "payment_failed" };
  }
  if (status === "refunded" || status === "charged_back") {
    return { paymentStatus: "refunded", orderStatus: "cancelled" };
  }
  return { paymentStatus: "pending", orderStatus: "payment_pending" };
}

function canUseMercadoPagoBackUrls(baseUrl) {
  // Valida si la URL de retorno es publica para ser aceptada por Mercado Pago.
  try {
    const parsed = new URL(baseUrl);
    const isHttp = parsed.protocol === "http:" || parsed.protocol === "https:";
    const isLocalHost = ["localhost", "127.0.0.1", "::1"].includes(parsed.hostname);
    return isHttp && !isLocalHost;
  } catch (error) {
    return false;
  }
}

async function createMercadoPagoPreference(order) {
  // Crea preferencia de pago en Mercado Pago para devolver init_point al frontend.
  if (!MP_ACCESS_TOKEN) {
    throw new Error("Falta MP_ACCESS_TOKEN para crear cobros con Mercado Pago.");
  }

  const preferencePayload = {
    external_reference: order.orderId,
    items: [
      {
        title: order.item.name,
        description: `SKU: ${order.item.sku}`,
        quantity: order.item.quantity,
        currency_id: "UYU",
        unit_price: order.item.unitPrice
      }
    ],
    payer: {
      name: order.customer.fullName,
      email: order.customer.email
    }
  };

  // Agrega retorno automatico solo cuando hay URL publica valida (no localhost).
  if (canUseMercadoPagoBackUrls(PUBLIC_FRONTEND_URL)) {
    preferencePayload.back_urls = {
      success: `${PUBLIC_FRONTEND_URL}/checkout.html?status=success`,
      failure: `${PUBLIC_FRONTEND_URL}/checkout.html?status=failure`,
      pending: `${PUBLIC_FRONTEND_URL}/checkout.html?status=pending`
    };
    preferencePayload.auto_return = "approved";
  }

  // Agrega item de envio solo cuando el costo es mayor a cero.
  if (order.shipping.cost > 0) {
    preferencePayload.items.push({
      title: "Envio",
      description: "Costo de envio",
      quantity: 1,
      currency_id: "UYU",
      unit_price: order.shipping.cost
    });
  }

  // Llamada API oficial para crear preferencia de Checkout Pro.
  const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(preferencePayload)
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Mercado Pago rechazo la preferencia: ${detail}`);
  }

  return response.json();
}

async function fetchMercadoPagoPayment(paymentId) {
  // Consulta detalle de pago en Mercado Pago para sincronizar estados.
  if (!MP_ACCESS_TOKEN) {
    throw new Error("Falta MP_ACCESS_TOKEN para sincronizar pagos.");
  }

  const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${MP_ACCESS_TOKEN}`
    }
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`No se pudo obtener el pago ${paymentId}: ${detail}`);
  }

  return response.json();
}

// Endpoint de salud para validar que API y DB estan operativas.
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    dbState: mongoose.connection.readyState
  });
});

// Endpoint para listar productos activos del catalogo.
app.get("/api/products", async (req, res) => {
  try {
    const products = await Product.find({ active: true }).sort({ createdAt: -1 });
    return res.json(products);
  } catch (error) {
    return res.status(500).json({
      error: "No se pudieron obtener los productos.",
      detail: error.message
    });
  }
});

// Endpoint para crear productos administrables desde backend.
app.post("/api/products", async (req, res) => {
  try {
    const { name, sku, description, image, price, stock, active } = req.body || {};

    if (!name || !sku) {
      return res.status(400).json({ error: "name y sku son obligatorios." });
    }

    const product = await Product.create({
      name: String(name).trim(),
      sku: String(sku).trim().toUpperCase(),
      description: String(description || "").trim(),
      image: String(image || "").trim(),
      price: toPositiveNumber(price, 0),
      stock: toPositiveNumber(stock, 0),
      active: typeof active === "boolean" ? active : true
    });

    return res.status(201).json(product);
  } catch (error) {
    return res.status(500).json({
      error: "No se pudo crear el producto.",
      detail: error.message
    });
  }
});

// Endpoint principal para crear pedido, totalizar y generar pago online si aplica.
app.post("/api/orders", async (req, res) => {
  try {
    const { customer, shipping, payment, item, notes } = req.body || {};

    if (!customer || !shipping || !payment || !item) {
      return res.status(400).json({ error: "Faltan bloques obligatorios: customer, shipping, payment o item." });
    }

    // Busca producto real por SKU para usar datos persistidos cuando existan.
    const normalizedSku = String(item.sku || "").trim().toUpperCase();
    const dbProduct = normalizedSku ? await Product.findOne({ sku: normalizedSku, active: true }) : null;

    // Calcula cantidad y precio, priorizando precio guardado en base cuando hay coincidencia por SKU.
    const quantity = Math.max(1, Math.min(10, Number(item.quantity || 1)));
    const unitPrice = dbProduct ? toPositiveNumber(dbProduct.price, 0) : toPositiveNumber(item.unitPrice, 0);
    const shippingCost = shipping.type === "domicilio" ? toPositiveNumber(shipping.cost, 120) : 0;
    const subtotal = unitPrice * quantity;
    const total = subtotal + shippingCost;

    // Construye pedido inicial con estado de pago pendiente.
    const order = await Order.create({
      orderId: createOrderId(),
      item: {
        productId: dbProduct?._id || null,
        sku: dbProduct?.sku || normalizedSku || "SIN-SKU",
        name: dbProduct?.name || String(item.name || "Producto Funda Shop").trim(),
        image: dbProduct?.image || String(item.image || "").trim(),
        quantity,
        unitPrice,
        subtotal
      },
      customer: {
        fullName: String(customer.fullName || "").trim(),
        email: String(customer.email || "").trim().toLowerCase(),
        phone: String(customer.phone || "").trim(),
        department: String(customer.department || "").trim(),
        address: String(customer.address || "").trim()
      },
      notes: String(notes || "").trim(),
      shipping: {
        type: shipping.type === "retiro" ? "retiro" : "domicilio",
        cost: shippingCost
      },
      paymentMethod: payment.method === "transferencia" ? "transferencia" : "mercadopago",
      paymentStatus: "pending",
      orderStatus: "payment_pending",
      totals: {
        subtotal,
        shipping: shippingCost,
        total,
        currency: "UYU"
      }
    });

    // Si el metodo es Mercado Pago, genera preferencia y devuelve URL de pago.
    if (order.paymentMethod === "mercadopago") {
      const preference = await createMercadoPagoPreference(order);
      order.mercadopago.preferenceId = preference.id || "";
      order.mercadopago.paymentUrl = preference.init_point || "";
      await order.save();
    }

    return res.status(201).json({
      orderId: order.orderId,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      total: order.totals.total,
      paymentUrl: order.mercadopago.paymentUrl || ""
    });
  } catch (error) {
    return res.status(500).json({
      error: "No se pudo crear el pedido.",
      detail: error.message
    });
  }
});

// Endpoint para consultar estado de un pedido por orderId.
app.get("/api/orders/:orderId", async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId });
    if (!order) {
      return res.status(404).json({ error: "Pedido no encontrado." });
    }
    return res.json(order);
  } catch (error) {
    return res.status(500).json({
      error: "No se pudo consultar el pedido.",
      detail: error.message
    });
  }
});

// Webhook de Mercado Pago para actualizar estado de pago automaticamente.
app.post("/api/mercadopago/webhook", async (req, res) => {
  try {
    const topic = req.query.type || req.query.topic || req.body?.type || req.body?.topic;
    const paymentId = req.query["data.id"] || req.body?.data?.id || req.body?.id;

    // Responde 200 en eventos que no sean de pago para evitar reintentos innecesarios.
    if (topic !== "payment" || !paymentId) {
      return res.status(200).json({ ok: true, ignored: true });
    }

    // Consulta el pago y toma external_reference para ubicar el pedido interno.
    const paymentData = await fetchMercadoPagoPayment(paymentId);
    const externalReference = String(paymentData.external_reference || "").trim();

    if (!externalReference) {
      return res.status(200).json({ ok: true, ignored: true, reason: "Sin external_reference" });
    }

    const order = await Order.findOne({ orderId: externalReference });
    if (!order) {
      return res.status(200).json({ ok: true, ignored: true, reason: "Pedido no encontrado" });
    }

    // Aplica mapeo de estados y persiste metadata del pago.
    const mapped = mapMercadoPagoStatus(paymentData.status);
    order.paymentStatus = mapped.paymentStatus;
    order.orderStatus = mapped.orderStatus;
    order.mercadopago.paymentId = String(paymentData.id || paymentId);
    order.mercadopago.statusDetail = String(paymentData.status_detail || "");
    await order.save();

    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(500).json({
      error: "No se pudo procesar el webhook.",
      detail: error.message
    });
  }
});

// Ruta principal del sitio para servir index.html desde carpeta frontend.
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "index.html"));
});

async function bootstrap() {
  // Inicializa conexion MongoDB y luego levanta el servidor HTTP.
  if (!MONGO_URI) {
    throw new Error("Falta MONGO_URI en variables de entorno.");
  }

  await mongoose.connect(MONGO_URI);
  app.listen(PORT, () => {
    console.log(`Backend corriendo en puerto ${PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error("Error al iniciar backend:", error.message);
  process.exit(1);
});
