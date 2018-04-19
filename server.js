const http = require("http");
const url = require("url");
const path = require("path");
const fs = require("fs");
const port = process.argv[2] || 8888;

const mimeTypes = {
  "htm": "text/html",
  "html": "text/html",
  "jpeg": "image/jpeg",
  "jpg": "image/jpeg",
  "png": "image/png",
  "gif": "image/gif",
  "js": "text/javascript",
  "map": "text/javascript",
  "css": "text/css",
};

const virtualDirectories = {
  //"images": "../images/"
};

const rootWWW = __dirname/* + '/../assets'*/;

function isDirectory(fname) {
  return new Promise((resolve, reject) => {
    fs.stat(fname, function(err, stats) {
      if(err) return reject(err);
      resolve(stats.isDirectory());
    });
  })
}

function findFile(fname) {
  return new Promise((resolve, reject) => {
    fs.exists(fname, function(exists) {
      if(!exists) return reject(new Error('404 not found'));
      resolve();
    });
  })
  .then(() => {
    return isDirectory(fname);
  })
  .then(ret => {
    if(!ret) return fname;
    var indexName = path.join(fname, 'index.html');
    return new Promise((resolve, reject) => {
      fs.exists(indexName, function(exists) {
        if(!exists) return reject(new Error('404 Not Found'));
        resolve(indexName);
      });
    });
  })
}

function fsRead(fname) {
  return new Promise((resolve, reject) => {
    fs.readFile(fname, "binary", function(err, buff) {
      if(err) return reject(err);
      resolve(buff);
    });
  })
}

async function __runrun(req, res) {
  var uri = url.parse(req.url).pathname;
  var root = uri.split("/")[1];
  var virtualDirectory = virtualDirectories[root];

  var fname;

  if(virtualDirectory){
    uri = uri.slice(root.length + 1, uri.length);
    fname = path.join(virtualDirectory ,uri);
  } else {
    fname = path.join(rootWWW, uri);
  }
  
  try {
    fname = await findFile(fname);
  } catch(err) {
    res.writeHead(404, {"Content-Type": "text/plain"});
    res.write(err.message+"\n");
    res.end();
    console.error(err);
    return;
  }

  var extname = path.extname(fname).split(".")[1];
  var mimeType = mimeTypes[extname];
  var buff;

  try {
    buff = await fsRead(fname);
  } catch(err) {
    res.writeHead(500, {"Content-Type": "text/plain"});
    var msg = err.toString().replace(rootWWW, '')+'\n';
    res.write(msg);
    res.end();
    console.error(`500: ${req.url}`);
    return;
  }

  if(mimeType) {
    res.writeHead(200, {"Content-Type": mimeType});
  }
  res.write(buff, "binary");
  res.end();
  console.log(`200: ${fname} ext ${extname} as ${mimeType}`);
}

function _run(req, res) {
  __runrun(req, res)
  .catch(err => {
    res.writeHead(500, {"Content-Type": "text/plain"});
    res.write('Server Error');
    res.end();
    console.error(err);
    return;
  });
}

http.createServer(_run).listen(parseInt(port, 10));

console.log("Static file server running at\n  => http://localhost:" + port + "/\nCTRL + C to shutdown");
