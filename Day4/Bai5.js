const http = require("http");
const url = require("url");

let todos = [
  { id: 1, title: "1", completed: false },
  { id: 2, title: "2", completed: true }
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
      <h2>Todo API</h2>

      <input id="id" placeholder="ID">
      <input id="title" placeholder="Title">
      <label>
        <input id="completed" type="checkbox"> Completed
      </label>

      <br><br>

      <button onclick="getTodos()">GET</button>
      <button onclick="getTodo()">GET ID</button>
      <button onclick="addTodo()">POST</button>
      <button onclick="updateTodo()">PUT</button>
      <button onclick="deleteTodo()">DELETE</button>

      <pre id="result"></pre>

      <script>
        function show(data) {
          document.getElementById("result").textContent =
            JSON.stringify(data, null, 2);
        }

        async function getTodos() {
          const res = await fetch("/todos");
          show(await res.json());
        }

        async function getTodo() {
          const id = document.getElementById("id").value;
          const res = await fetch("/todos/" + id);
          show(await res.json());
        }

        async function addTodo() {
          const title = document.getElementById("title").value;
          const completed = document.getElementById("completed").checked;

          const res = await fetch("/todos", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              title: title,
              completed: completed
            })
          });

          show(await res.json());
        }

        async function updateTodo() {
          const id = document.getElementById("id").value;
          const title = document.getElementById("title").value;
          const completed = document.getElementById("completed").checked;

          const res = await fetch("/todos/" + id, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              title: title,
              completed: completed
            })
          });

          show(await res.json());
        }

        async function deleteTodo() {
          const id = document.getElementById("id").value;

          const res = await fetch("/todos/" + id, {
            method: "DELETE"
          });

          show(await res.json());
        }
      </script>
    `);

    return;
  }

  if (req.method === "GET" && parsedUrl.pathname === "/todos") {
    sendJSON(res, 200, todos);
    return;
  }

  if (req.method === "GET" && pathParts[0] === "todos") {
    const todo = todos.find(t => t.id === id);

    if (todo) {
      sendJSON(res, 200, todo);
    } else {
      sendJSON(res, 404, {
        message: "Todo not found"
      });
    }

    return;
  }

  if (req.method === "POST" && parsedUrl.pathname === "/todos") {
    readBody(req, body => {
      if (!body) {
        sendJSON(res, 400, {
          message: "Invalid JSON"
        });
        return;
      }

      const newTodo = {
        id: todos.length + 1,
        title: body.title,
        completed: body.completed
      };

      todos.push(newTodo);

      sendJSON(res, 201, newTodo);
    });

    return;
  }

  if (req.method === "PUT" && pathParts[0] === "todos") {
    const todo = todos.find(t => t.id === id);

    if (!todo) {
      sendJSON(res, 404, {
        message: "Todo not found"
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

      todo.title = body.title;
      todo.completed = body.completed;

      sendJSON(res, 200, todo);
    });

    return;
  }

  if (req.method === "DELETE" && pathParts[0] === "todos") {
    const index = todos.findIndex(t => t.id === id);

    if (index === -1) {
      sendJSON(res, 404, {
        message: "Todo not found"
      });
      return;
    }

    const deletedTodo = todos.splice(index, 1)[0];

    sendJSON(res, 200, deletedTodo);
    return;
  }

  sendJSON(res, 404, {
    message: "404 Not Found"
  });
});

server.listen(3000, () => {
  console.log("Server is running at http://localhost:3000");
});