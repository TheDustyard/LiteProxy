import * as httpProxy from "http-proxy";
import * as http from "http";
import * as nunjucks from "nunjucks";
import * as fs from "fs";

nunjucks.configure("./pages", {
    noCache: true,
    watch: true
});

let proxy: httpProxy = httpProxy.createProxyServer();

http.createServer((req, res) => {
    proxy.web(req, res, { target: "http://localhosst:8080" });
}).listen(10);

interface ProxyError extends Error {
    code: string;
    errno: string;
    syscall: string;
    hostname: string;
    host: string;
    port: string;
}
proxy.on("error", (error: ProxyError, req, res, target) => {
    let errorcode;
    let errordescription;
    switch (error.code) {
        case "ENOTFOUND":
            errorcode = 503; errordescription = "Service Unavailable"; break;
        default:
            errorcode = 500; errordescription = "Internal Server Error"; break;
    }

    //  Headers
    res.setHeader("Content-Type", "text/html");
    res.writeHead(500);

    let render = nunjucks.render("ErrorPage.njk", {
        errorcode,
        errordescription,
        styles: `<style>${fs.readFileSync("./pages/ErrorPage.css").toString()}</style>`
    });

    res.write(render);

    res.end();
});