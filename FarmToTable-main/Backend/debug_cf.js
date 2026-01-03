const { Cashfree } = require("cashfree-pg");

console.log("Type of Cashfree:", typeof Cashfree);
console.log("Exports of Cashfree:", Object.keys(Cashfree));
console.log("Prototype methods:", Object.getOwnPropertyNames(Cashfree.prototype || {}));
try {
    console.log("Is PGCreateOrder available?", typeof Cashfree.PGCreateOrder);
} catch (e) {
    console.log("Error checking PGCreateOrder:", e.message);
}
