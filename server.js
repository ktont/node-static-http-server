const http = require("http");
const port = process.argv[2] || 8888;

const staticServer = require('./lib/staticServer.js');

http.createServer(staticServer)
.listen(parseInt(port, 10));

console.log("Static file server running at\n  => http://localhost:" + port + "/\nCTRL + C to shutdown");
