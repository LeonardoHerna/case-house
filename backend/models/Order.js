// Modelo de pedido para persistir compras y estados de pago/envio.
const mongoose = require("mongoose");

// Esquema de item comprado dentro del pedido.
const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null
    },
    sku: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: 40
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    image: {
      type: String,
      default: ""
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      max: 50
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0
    }
  },
  { _id: false }
);

// Esquema de datos de cliente para contacto y entrega.
const customerSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 120
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 30
    },
    department: {
      type: String,
      required: true,
      trim: true,
      maxlength: 40
    },
    address: {
      type: String,
      required: true,
      trim: true,
      maxlength: 180
    }
  },
  { _id: false }
);

// Esquema principal de pedido con estados de negocio.
const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    item: {
      type: orderItemSchema,
      required: true
    },
    customer: {
      type: customerSchema,
      required: true
    },
    notes: {
      type: String,
      default: "",
      maxlength: 300
    },
    shipping: {
      type: {
        type: String,
        enum: ["domicilio", "retiro"],
        required: true
      },
      cost: {
        type: Number,
        default: 0,
        min: 0
      }
    },
    paymentMethod: {
      type: String,
      enum: ["mercadopago", "transferencia"],
      required: true
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "in_process", "approved", "rejected", "cancelled", "refunded"],
      default: "pending"
    },
    orderStatus: {
      type: String,
      enum: ["created", "payment_pending", "paid", "payment_failed", "preparing", "shipped", "delivered", "cancelled"],
      default: "created"
    },
    totals: {
      subtotal: {
        type: Number,
        required: true,
        min: 0
      },
      shipping: {
        type: Number,
        required: true,
        min: 0
      },
      total: {
        type: Number,
        required: true,
        min: 0
      },
      currency: {
        type: String,
        default: "UYU"
      }
    },
    mercadopago: {
      preferenceId: {
        type: String,
        default: ""
      },
      paymentId: {
        type: String,
        default: ""
      },
      paymentUrl: {
        type: String,
        default: ""
      },
      statusDetail: {
        type: String,
        default: ""
      }
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Order", orderSchema);
