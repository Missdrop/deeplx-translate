"use strict";

const REQUEST_TIMEOUT_MS = 10000;

/**
 * Sends translation requests to a self-hosted DLX /translate endpoint.
 */
class DlxClient {
    /**
     * @param {string} endpoint
     * @param {string | undefined} token
     */
    constructor(endpoint, token) {
        this.endpoint = this.parseEndpoint(endpoint);
        this.token = token;

        // Keep access tokens off unencrypted network connections.
        const isLoopback = ["localhost", "127.0.0.1", "[::1]"].includes(this.endpoint.hostname);
        if (token && this.endpoint.protocol === "http:" && !isLoopback) {
            throw new Error("DLX access tokens require HTTPS or a loopback endpoint.");
        }
    }

    /**
     * @param {string} value
     * @returns {URL}
     */
    parseEndpoint(value) {
        let endpoint;
        try {
            endpoint = new URL(value);
        } catch {
            throw new Error("Set a valid URL in deeplxSource.endpoint.");
        }

        if (!["https:", "http:"].includes(endpoint.protocol)
            || endpoint.username || endpoint.password || endpoint.search || endpoint.hash) {
            throw new Error("Use an HTTP or HTTPS DLX URL without credentials, query parameters, or a fragment.");
        }

        return endpoint;
    }

    /**
     * @param {string} text
     * @param {string | undefined} source
     * @param {string} target
     * @returns {Promise<string>}
     */
    async translate(text, source, target) {
        const headers = { "Content-Type": "application/json" };
        if (this.token) {
            headers.Authorization = `Bearer ${this.token}`;
        }

        // Omitting source_lang lets the server detect the input language.
        const body = JSON.stringify({ text, source_lang: source, target_lang: target });
        let response;
        try {
            response = await fetch(this.endpoint, {
                method: "POST",
                headers,
                body,
                redirect: "error",
                signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
            });
        } catch (error) {
            const reason = error.name === "TimeoutError" ? "timed out" : "could not be reached";
            throw new Error(`The DLX endpoint ${reason}. Check the endpoint and server status.`);
        }

        if (!response.ok) {
            await response.body?.cancel();
            throw new Error(`DLX returned HTTP ${response.status}. Check the endpoint, access token, or server logs.`);
        }

        let result;
        try {
            result = await response.json();
        } catch {
            throw new Error("DLX did not return a readable JSON response.");
        }

        if (result?.code !== 200 || typeof result.data !== "string") {
            throw new Error("DLX returned an unexpected response. Use the /translate endpoint.");
        }

        return result.data;
    }
}

module.exports = { DlxClient };
