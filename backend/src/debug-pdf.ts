const pdf = require("pdf-parse");

console.log("---------------------------------------------------");
console.log("Type of pdf:", typeof pdf);
console.log("Is pdf a function?", typeof pdf === "function");
console.log("Keys of pdf:", Object.keys(pdf));
console.log("pdf.default:", (pdf as any).default);
console.log("pdf content:", pdf);
console.log("---------------------------------------------------");
