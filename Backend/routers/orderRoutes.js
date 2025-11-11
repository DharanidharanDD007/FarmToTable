const express=require('express');

const ordercontroller =require( "../controller/orderController.js");
const router = express.Router();

router.get("/",ordercontroller. getOrders);
router.post("/",ordercontroller. addOrder);
router.get("/farmer/:farmerId",ordercontroller. getFarmerOrders);

module.exports=router;
