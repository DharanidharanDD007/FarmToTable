const { Cashfree } = require("cashfree-pg");

console.log("Own Property Names:", Object.getOwnPropertyNames(Cashfree));
console.log("Prototype Property Names:", Object.getOwnPropertyNames(Cashfree.prototype || {}));
try {
    const instance = new Cashfree();
    console.log("Instance Property Names:", Object.getOwnPropertyNames(instance));
    console.log("Instance Prototype Names:", Object.getOwnPropertyNames(Object.getPrototypeOf(instance)));
} catch (e) {
    console.log("Cannot instantiate Cashfree:", e.message);
}
