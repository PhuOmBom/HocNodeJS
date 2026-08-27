const http = require("http");
const url = require("url");
const querystring = require("querystring");

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url);

  if (parsedUrl.pathname === "/search") {
    const query = querystring.parse(parsedUrl.query);

    const keyword = query.keyword;
    var page = query.page;

    if (!page) {
      page = "1";
    }

    res.writeHead(200, {
      "Content-Type": "text/plain; charset=utf-8"
    });

    res.write("Keyword: " + keyword + "\n");
    res.write("Page: " + page);
    res.end();

    return;
  }

  res.writeHead(404, {
    "Content-Type": "text/plain; charset=utf-8"
  });
  res.end("404 Not Found");
});

server.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
