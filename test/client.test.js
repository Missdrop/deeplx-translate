"use strict";

const assert = require("node:assert/strict");
const { createServer } = require("node:http");
const { once } = require("node:events");
const { test } = require("node:test");
const { DlxClient } = require("../src/client");

async function startServer(context, handler) {
    const server = createServer(handler);
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    context.after(() => new Promise((resolve) => server.close(resolve)));
    return `http://127.0.0.1:${server.address().port}/translate`;
}

test("posts DLX JSON and sends the optional Bearer token", async (context) => {
    let received;
    const endpoint = await startServer(context, async (request, response) => {
        let body = "";
        for await (const chunk of request) {
            body += chunk;
        }
        received = [request.method, request.url, request.headers.authorization, JSON.parse(body)];
        response.end(JSON.stringify({ code: 200, data: "你好" }));
    });

    const client = new DlxClient(endpoint, "test-token");
    assert.equal(await client.translate("Hello", undefined, "ZH"), "你好");
    assert.deepEqual(received, ["POST", "/translate", "Bearer test-token", {
        text: "Hello",
        target_lang: "ZH",
    }]);
});

test("reports server errors without including server response contents", async (context) => {
    const endpoint = await startServer(context, (_request, response) => {
        response.writeHead(500);
        response.end("private diagnostic");
    });

    const client = new DlxClient(endpoint);
    await assert.rejects(client.translate("Hello", "EN", "ZH"), /HTTP 500/);
});

test("rejects unexpected successful responses", async (context) => {
    const endpoint = await startServer(context, (_request, response) => {
        response.end(JSON.stringify({ translations: [{ text: "hello" }] }));
    });

    await assert.rejects(new DlxClient(endpoint).translate("Hello", "EN", "ZH"), /unexpected response/);
});

test("rejects insecure remote tokens and URLs with embedded credentials", () => {
    assert.throws(() => new DlxClient("http://example.com/translate", "token"), /require HTTPS/);
    assert.throws(() => new DlxClient("https://example.com/translate?token=secret"), /without credentials/);
});
