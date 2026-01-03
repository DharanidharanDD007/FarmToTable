const mongoose=require("mongoose");

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    stock: { type: Number, required: true },
    unit: { type: String, required: true },
    image: { type: String },
    farmerId: { type: String, required: true },
    farmerName: { type: String, required: true },
    farmerLocation: { type: String }
}, { timestamps: true });

// Add indexes for better query performance
productSchema.index({ farmerId: 1 }); // For filtering products by farmer
productSchema.index({ name: 1 }); // For product search
productSchema.index({ farmerLocation: 1 }); // For location-based filtering

const Product= mongoose.model("Product", productSchema);
module.exports=Product;
