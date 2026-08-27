const http = require("http");

const server = http.createServer((req, res) => {
  if (req.url === "/") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Hello world");
  } else if (req.url === "/profile") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Hoc vien: Sigma Nguyen | Lop: SigmaClass | Muc tieu: Become sigma");
  } else if (req.url === "/nodejs") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("NodeJs la la cai gi?");
  } else if (req.url === "/api/server-info") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      runtime: "Node.js",
      language: "JavaScript",
      type: "server-side"
    }));
  } else if (req.url === "/about") {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end("<h1>About Server-side Development</h1><p>Server-side programming processes logic on the server.</p>");
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("404 Not Found");
  }
});

server.listen(3000, () => {
  console.log("Server is running at http://localhost:3000");
});
