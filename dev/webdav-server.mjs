import { v2 as webdav } from "webdav-server";
import http from "http";

const userManager = new webdav.SimpleUserManager();
const user = userManager.addUser("noti", "notidev", false);

const privilegeManager = new webdav.SimplePathPrivilegeManager();
privilegeManager.setRights(user, "/", ["all"]);

const server = new webdav.WebDAVServer({
  httpAuthentication: new webdav.HTTPBasicAuthentication(userManager),
  privilegeManager,
  port: 8080,
  rootFileSystem: new webdav.PhysicalFileSystem("./dev/webdav-data"),
});

// Wrap with CORS middleware
const httpServer = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, PUT, DELETE, MKCOL, PROPFIND, OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Authorization, Content-Type, Depth, Overwrite, Destination"
  );
  res.setHeader(
    "Access-Control-Expose-Headers",
    "Content-Length, Content-Type"
  );

  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Max-Age", "86400");
    res.writeHead(204);
    res.end();
    return;
  }

  server.executeRequest(req, res);
});

// Ensure data directory exists
import { mkdirSync } from "fs";
mkdirSync("./dev/webdav-data", { recursive: true });

httpServer.listen(8080, () => {
  console.log("WebDAV server running on http://localhost:8080");
  console.log("Auth: noti / notidev");
});
