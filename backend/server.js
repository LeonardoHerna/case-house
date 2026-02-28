require("dotenv").config();

// Dependencias de API HTTP.
const express = require("express");
const cors = require("cors");

// Inicializacion de app y configuracion general.
const app = express();
const PORT = process.env.PORT || 3000;

// Falla rapida si falta credencial obligatoria de Mercado Pago.
if (!process.env.MP_ACCESS_TOKEN) {
  throw new Error("Falta MP_ACCESS_TOKEN en variables de entorno.");
}

// Middlewares base: CORS y parseo JSON.
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || "*"
  })
);
app.use(express.json());

// Endpoint para crear una preferencia de pago en Mercado Pago.
app.post("/api/mercadopago/preference", async (req, res) => {
  try {
    // Datos de pedido recibidos desde frontend.
    const { orderId, title, sku, quantity, unitPrice, shippingCost, payer } = req.body || {};

    // Normalizacion y limites minimos para evitar montos/cantidades invalidas.
    const safeQuantity = Math.max(1, Number(quantity || 1));
    const safeUnitPrice = Math.max(0, Number(unitPrice || 0));
    const safeShipping = Math.max(0, Number(shippingCost || 0));

    // Items base del checkout (producto + envio opcional).
    const items = [
      {
        title: title || "Producto Funda Shop",
        description: sku ? `SKU: ${sku}` : "Pedido Funda Shop",
        quantity: safeQuantity,
        currency_id: "UYU",
        unit_price: safeUnitPrice
      }
    ];

    if (safeShipping > 0) {
      items.push({
        title: "Envio",
        description: "Costo de envio",
        quantity: 1,
        currency_id: "UYU",
        unit_price: safeShipping
      });
    }

    // URL de retorno luego del flujo de pago.
    const baseUrl = process.env.PUBLIC_FRONTEND_URL || "http://localhost:5500";

    // Payload de preferencia segun Checkout Pro.
    const preference = {
      external_reference: orderId || `FS-${Date.now()}`,
      items,
      payer: {
        name: payer?.name || "",
        email: payer?.email || ""
      },
      back_urls: {
        success: `${baseUrl}/checkout.html?status=success`,
        failure: `${baseUrl}/checkout.html?status=failure`,
        pending: `${baseUrl}/checkout.html?status=pending`
      },
      auto_return: "approved"
    };

    // Llamada HTTP a API oficial de Mercado Pago.
    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(preference)
    });

    if (!response.ok) {
      // Devuelve detalle de rechazo para facilitar debug.
      const detail = await response.text();
      return res.status(response.status).json({
        error: "Mercado Pago rechazo la preferencia",
        detail
      });
    }

    // Respuesta minima para que frontend redirija al init_point.
    const data = await response.json();
    return res.json({
      id: data.id,
      init_point: data.init_point
    });
  } catch (error) {
    // Error inesperado del servidor.
    return res.status(500).json({
      error: "No se pudo crear la preferencia",
      detail: error.message
    });
  }
});

// Inicio del servidor.
app.listen(PORT, () => {
  console.log(`Backend Mercado Pago corriendo en puerto ${PORT}`);
});
