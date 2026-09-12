import { createServer } from "http";
import { readFile } from "fs/promises";
import { extname, join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3005;

const mime = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".xml": "application/xml",
};

createServer(async (req, res) => {
  let path = req.url === "/" ? "/index.html" : req.url;
  try {
    const data = await readFile(join(__dirname, path));
    res.writeHead(200, { "Content-Type": mime[extname(path)] || "text/plain" });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
}).listen(PORT, () => console.log(`Kallang Close Residences running at http://localhost:${PORT}`));
