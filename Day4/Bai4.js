const http = require("http");
const url = require("url");

let products = [
  { id: 1, name: "1", price: 20000000 },
  { id: 2, name: "2", price: 500000 }
];

function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8"
  });
  res.end(JSON.stringify(data));
}

function readBody(req, callback) {
  let body = "";

  req.on("data", chunk => {
    body += chunk;
  });

  req.on("end", () => {
    try {
      callback(JSON.parse(body));
    } catch {
      callback(null);
    }
  });
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathParts = parsedUrl.pathname.split("/").filter(Boolean);
  const id = Number(pathParts[1]);

  if (req.method === "GET" && parsedUrl.pathname === "/") {
    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8"
    });

    res.end(`
      <h2>Product API</h2>

      <input id="id" placeholder="ID">
      <input id="name" placeholder="Name">
      <input id="price" placeholder="Price">

      <br><br>

      <button onclick="getProducts()">GET</button>
      <button onclick="getProduct()">GET ID</button>
      <button onclick="addProduct()">POST</button>
      <button onclick="updateProduct()">PUT</button>
      <button onclick="deleteProduct()">DELETE</button>

      <pre id="result"></pre>

      <script>
        function show(data) {
          document.getElementById("result").textContent =
            JSON.stringify(data, null, 2);
        }

        async function getProducts() {
          const res = await fetch("/products");
          show(await res.json());
        }

        async function getProduct() {
          const id = document.getElementById("id").value;
          const res = await fetch("/products/" + id);
          show(await res.json());
        }

        async function addProduct() {
          const name = document.getElementById("name").value;
          const price = document.getElementById("price").value;

          const res = await fetch("/products", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              name: name,
              price: Number(price)
            })
          });

          show(await res.json());
        }

        async function updateProduct() {
          const id = document.getElementById("id").value;
          const name = document.getElementById("name").value;
          const price = document.getElementById("price").value;

          const res = await fetch("/products/" + id, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              name: name,
              price: Number(price)
            })
          });

          show(await res.json());
        }

        async function deleteProduct() {
          const id = document.getElementById("id").value;

          const res = await fetch("/products/" + id, {
            method: "DELETE"
          });

          show(await res.json());
        }
      </script>
    `);

    return;
  }

  if (req.method === "GET" && parsedUrl.pathname === "/products") {
    sendJSON(res, 200, products);
    return;
  }

  if (req.method === "GET" && pathParts[0] === "products") {
    const product = products.find(p => p.id === id);

    if (product) {
      sendJSON(res, 200, product);
    } else {
      sendJSON(res, 404, {
        message: "Product not found"
      });
    }

    return;
  }

  if (req.method === "POST" && parsedUrl.pathname === "/products") {
    readBody(req, body => {
      if (!body) {
        sendJSON(res, 400, {
          message: "Invalid JSON"
        });
        return;
      }

      const newProduct = {
        id: products.length + 1,
        name: body.name,
        price: body.price
      };

      products.push(newProduct);

      sendJSON(res, 201, newProduct);
    });

    return;
  }

  if (req.method === "PUT" && pathParts[0] === "products") {
    const product = products.find(p => p.id === id);

    if (!product) {
      sendJSON(res, 404, {
        message: "Product not found"
      });
      return;
    }

    readBody(req, body => {
      if (!body) {
        sendJSON(res, 400, {
          message: "Invalid JSON"
        });
        return;
      }

      product.name = body.name;
      product.price = body.price;

      sendJSON(res, 200, product);
    });

    return;
  }

  if (req.method === "DELETE" && pathParts[0] === "products") {
    const index = products.findIndex(p => p.id === id);

    if (index === -1) {
      sendJSON(res, 404, {
        message: "Product not found"
      });
      return;
    }

    const deletedProduct = products.splice(index, 1)[0];

    sendJSON(res, 200, deletedProduct);
    return;
  }

  sendJSON(res, 404, {
    message: "404 Not Found"
  });
});

server.listen(3000, () => {
  console.log("Server is running at http://localhost:3000");
});