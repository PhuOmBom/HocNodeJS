const http = require("http");

const products = [
  { id: 1, name: "Laptop", price: 20000000 },
  { id: 2, name: "Mouse", price: 500000 },
  { id: 3, name: "Keyboard", price: 1000000 }
];

const server = http.createServer((req, res) => {
  const pathname = req.url;

  if (pathname === "/") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(
      "<h1>Trang chủ</h1><p>Electronic Shop Shit or somethin.</p> \n<p>Products: <a href='/products'>Products</a></p> \n<p>Product API: <a href='/api/products'>API Products</a></p>");
  } 
  else if (pathname === "/products") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    let html = "<h1>Products</h1><ul>";
    products.forEach((product) => {
      html += `<li>${product.name} - ${product.price}</li>`;
    });
    html += "</ul>";
    res.end(html);
  } 
  else if (pathname === "/api/products") {
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify(products));
  } 
  else {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("404 Not Found");
  }
});

server.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
