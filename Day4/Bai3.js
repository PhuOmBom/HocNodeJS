const http = require("http");
const url = require("url");

let users = [
  { id: 1, name: "1", age: 20 },
  { id: 2, name: "2", age: 22 }
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
  const parts = parsedUrl.pathname.split("/").filter(Boolean);
  const id = Number(parts[1]);

  if (req.method === "GET" && parsedUrl.pathname === "/") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`
      <h2>User API</h2>

      <input id="id" placeholder="ID">
      <input id="name" placeholder="Name">
      <input id="age" placeholder="Age">

      <br><br>

      <button onclick="getUsers()">GET</button>
      <button onclick="getUser()">GET ID</button>
      <button onclick="addUser()">POST</button>
      <button onclick="updateUser()">PUT</button>
      <button onclick="deleteUser()">DELETE</button>

      <pre id="result"></pre>

      <script>
        function show(data) {
          document.getElementById("result").textContent =
            JSON.stringify(data, null, 2);
        }

        async function getUsers() {
          const res = await fetch("/users");
          show(await res.json());
        }

        async function getUser() {
          const id = document.getElementById("id").value;
          const res = await fetch("/users/" + id);
          show(await res.json());
        }

        async function addUser() {
          const name = document.getElementById("name").value;
          const age = document.getElementById("age").value;

          const res = await fetch("/users", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              name: name,
              age: Number(age)
            })
          });

          show(await res.json());
        }

        async function updateUser() {
          const id = document.getElementById("id").value;
          const name = document.getElementById("name").value;
          const age = document.getElementById("age").value;

          const res = await fetch("/users/" + id, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              name: name,
              age: Number(age)
            })
          });

          show(await res.json());
        }

        async function deleteUser() {
          const id = document.getElementById("id").value;

          const res = await fetch("/users/" + id, {
            method: "DELETE"
          });

          show(await res.json());
        }
      </script>
    `);
    return;
  }

  if (req.method === "GET" && parsedUrl.pathname === "/users") {
    sendJSON(res, 200, users);
    return;
  }

  if (req.method === "GET" && parts[0] === "users") {
    const user = users.find(u => u.id === id);

    if (user) {
      sendJSON(res, 200, user);
    } else {
      sendJSON(res, 404, { message: "User not found" });
    }

    return;
  }

  if (req.method === "POST" && parsedUrl.pathname === "/users") {
    readBody(req, body => {
      if (!body) {
        sendJSON(res, 400, { message: "Invalid JSON" });
        return;
      }

      const newUser = {
        id: users.length + 1,
        name: body.name,
        age: body.age
      };

      users.push(newUser);
      sendJSON(res, 201, newUser);
    });

    return;
  }

  if (req.method === "PUT" && parts[0] === "users") {
    const user = users.find(u => u.id === id);

    if (!user) {
      sendJSON(res, 404, { message: "User not found" });
      return;
    }

    readBody(req, body => {
      if (!body) {
        sendJSON(res, 400, { message: "Invalid JSON" });
        return;
      }

      user.name = body.name;
      user.age = body.age;

      sendJSON(res, 200, user);
    });

    return;
  }

  if (req.method === "DELETE" && parts[0] === "users") {
    const index = users.findIndex(u => u.id === id);

    if (index === -1) {
      sendJSON(res, 404, { message: "User not found" });
      return;
    }

    const deletedUser = users.splice(index, 1)[0];
    sendJSON(res, 200, deletedUser);
    return;
  }

  sendJSON(res, 404, { message: "404 Not Found" });
});

server.listen(3000, () => {
  console.log("Server is running at http://localhost:3000");
});