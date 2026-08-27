const http = require("http");
const url = require("url");

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);

  if (parsedUrl.pathname === "/") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });

    res.end(`
      <form action="/search" method="GET">
        <input name="q" placeholder="Nhập từ khóa">
        <button type="submit">Search</button>
      </form>
    `);

    return;
  }

  if (parsedUrl.pathname === "/search") {
    res.writeHead(200, {
      "Content-Type": "text/plain; charset=utf-8"
    });

    const keyword = parsedUrl.query.q;

    if (keyword) {
      res.end(`Keyword: ${keyword}`);
    } else {
      res.end("Missing search keyword");
    }

    return;
  }

  res.writeHead(404);
  res.end("404 Not Found");
});

server.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});