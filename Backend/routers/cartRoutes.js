const express=require('express');
const cartcontroller =require( "../controller/cartController.js");

const router = express.Router();

router.get("/:userId",cartcontroller. getCart);              // GET /api/cart/:userId
router.post("/",cartcontroller. addToCart);                  // POST /api/cart
router.put("/quantity", cartcontroller.updateCartQuantity);  // PUT /api/cart/quantity
router.delete("/",cartcontroller. removeFromCart);           // DELETE /api/cart

module.exports= router;
