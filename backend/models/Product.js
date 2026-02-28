// Modelo de producto para administrar catalogo y stock en MongoDB.
const mongoose = require("mongoose");

// Esquema de producto con campos base para ecommerce.
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    sku: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      uppercase: true,
      maxlength: 40
    },
    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500
    },
    image: {
      type: String,
      default: ""
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    stock: {
      type: Number,
      default: 0,
      min: 0
    },
    active: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Product", productSchema);
