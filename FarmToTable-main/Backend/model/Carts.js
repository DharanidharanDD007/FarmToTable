const mongoose=require("mongoose");

const cartSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    items: [
      {
        productId: { type: String, required: true },
        name: String,
        price: Number,
        quantity: Number,
        image: String,
        unit: String,
        farmerId: String,      
        farmerName: String
      }
    ]
  },
  { timestamps: true }
);

// Add index for better query performance
cartSchema.index({ userId: 1 }); // For fetching user cart (unique would be better, but allowing multiple carts for now)

const Cart= mongoose.model("Cart", cartSchema);
module.exports=Cart;
