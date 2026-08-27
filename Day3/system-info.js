var os = require("os");

console.log("Ten he dieu hanh: " + os.type());
console.log("Platform: " + os.platform());
console.log("Tong RAM: " + os.totalmem() + " bytes");
console.log("RAM con trong: " + os.freemem() + " bytes");
console.log("So CPU cores: " + os.cpus().length);
