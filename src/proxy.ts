import * as httpProxy from "http-proxy";
import * as http from "http";
import * as nunjucks from "nunjucks";
import * as fs from "fs";
import { Url } from "url";

nunjucks.configure("./pages", {
    noCache: true,
    watch: true
});

let proxy: httpProxy = httpProxy.createProxyServer();

http.createServer((req, res) => {
    if(req.url === "/proxyserverlog") {
        res.write("no");
        res.end();
        return;
    }
    proxy.web(req, res, { target: "http://localhost:8081" });
}).listen(80);

interface ProxyError extends Error {
    code: string;
    errno: string;
    syscall: string;
    hostname: string;
    host: string;
    port: string;
}
proxy.on("error", (error: ProxyError, req, res, target) => {
    if (typeof target === typeof "") console.error(target);
    else console.error((target as Url).hostname);

    let errorinfo = {
        code: 500,
        message: "Internal Server Error",
        description: "Unknown Server Error",
        solution: {
            visitor: "Try again in a few minutes",
            owner: "Check the error output of the proxy server"
        }
    };
    switch (error.code) {
        case "ENOTFOUND":
            errorinfo.code = 503;
            errorinfo.message = "Service Unavailable";
            errorinfo.description = "The proxied server could not be found";
            errorinfo.solution.owner = `Check the spelling of the proxy entry`;
            break;
        case "ECONNREFUSED":
            errorinfo.code = 503;
            errorinfo.message = "Connection Refused";
            errorinfo.description = "The proxied server refused to connect";
            errorinfo.solution.owner = `Check the status of the proxied server`;
            break;
        default:
            console.error(`UNKNOWN ERROR ${error.code}`);
            break;
    }

    //  Headers
    res.setHeader("Content-Type", "text/html");
    res.writeHead(500);

    let render = nunjucks.render("ErrorPage.njk", {
        errorinfo,
        styles: `<style>${fs.readFileSync("./pages/ErrorPage.css").toString()}</style>`,
        time: new Date(Date.now()).toUTCString(),
        ip: req.connection.remoteAddress.replace("::ffff:", "")
    });

    res.write(render);

    res.end();
});