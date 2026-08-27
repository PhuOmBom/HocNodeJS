const http = require("http");
const OScheck = require("./OScheck");

const server = http.createServer((req, res) => {
  if (req.url === "/") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.write(`${OScheck.getCPUinfo()}`);
  }
});

server.listen(3000, () => {
  console.log("Server is running on port 3000");
});