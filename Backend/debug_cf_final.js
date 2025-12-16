const { Cashfree } = require("cashfree-pg");

console.log("Static PGCreateOrder exists?", typeof Cashfree.PGCreateOrder);
console.log("Static pgCreateOrder exists?", typeof Cashfree.pgCreateOrder);

try {
    const instance = new Cashfree();
    console.log("Instance PGCreateOrder exists?", typeof instance.PGCreateOrder);
    console.log("Instance pgCreateOrder exists?", typeof instance.pgCreateOrder);
} catch (e) {
    console.log("Instantiation failed:", e.message);
}
