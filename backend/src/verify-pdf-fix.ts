const { PDFParse } = require("pdf-parse");

console.log("---------------------------------------------------");
console.log("PDFParse class availability check");
console.log("Type of PDFParse:", typeof PDFParse);
console.log(
  "Is PDFParse a function (class constructor)?",
  typeof PDFParse === "function",
);

if (typeof PDFParse === "function") {
  console.log("SUCCESS: PDFParse class is correctly imported.");

  // Create a dummy PDF buffer (minimal valid PDF structure)
  // This is a minimal PDF file structure
  const pdfContent =
    "%PDF-1.0\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 3 3]>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000010 00000 n\n0000000060 00000 n\n0000000110 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n149\n%%EOF";
  const dummyBuffer = Buffer.from(pdfContent);

  try {
    console.log("Attempting to instantiate PDFParse...");
    const parser = new PDFParse({ data: dummyBuffer });
    console.log("Parser instantiated successfully.");

    console.log("Checking for getText method:", typeof parser.getText);
    if (typeof parser.getText === "function") {
      console.log("SUCCESS: getText method exists.");
    } else {
      console.error("FAIL: getText method missing.");
    }

    // We won't actually parse the dummy buffer as it might fail deep validation,
    // but we've verified the API structure is correct.
  } catch (e) {
    console.error("Error during instantiation:", e);
  }
} else {
  console.error("FAIL: PDFParse is still not a function/class.");
}
console.log("---------------------------------------------------");
