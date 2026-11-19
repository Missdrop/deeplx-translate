"use strict";

const vscode = require("vscode");
const { DlxClient } = require("./client");

const TOKEN_KEY = "dlxAccessToken";
const DEFAULT_TARGET = "ZH";

/**
 * Maps Comment Translate language codes to the portable DLX language codes.
 * @param {string | undefined} language
 * @returns {string | undefined}
 */
function translateLanguageCode(language) {
    if (!language || language.toLowerCase() === "auto") {
        return undefined;
    }

    const code = language.replaceAll("_", "-").toUpperCase();
    if (code.startsWith("ZH-")) {
        return "ZH";
    }

    return code;
}

/**
 * Registers a translation source with Comment Translate and keeps the token
 * in the local VS Code secret store.
 * @param {import("vscode").ExtensionContext} context
 */
function activate(context) {
    const setToken = vscode.commands.registerCommand("deeplxSource.setToken", async () => {
        const token = await vscode.window.showInputBox({
            title: "DeeplX Access Token",
            password: true,
            ignoreFocusOut: true,
            validateInput: (value) => value.trim() ? undefined : "Enter an access token.",
        });

        if (token) {
            await context.secrets.store(TOKEN_KEY, token.trim());
        }
    });

    const clearToken = vscode.commands.registerCommand("deeplxSource.clearToken", async () => {
        await context.secrets.delete(TOKEN_KEY);
    });

    context.subscriptions.push(setToken, clearToken);

    class DlxTranslation {
        constructor() {
            // Comment Translate uses this limit when splitting long comments.
            this.maxLen = 3000;
        }

        /**
         * Reads the endpoint and token on each request so changes apply immediately.
         * @param {string} text
         * @param {{from?: string, to?: string}} options
         * @returns {Promise<string>}
         */
        async translate(text, { from, to } = {}) {
            const endpoint = vscode.workspace.getConfiguration("deeplxSource").get("endpoint");
            const token = await context.secrets.get(TOKEN_KEY);
            const source = translateLanguageCode(from);
            const target = translateLanguageCode(to) || DEFAULT_TARGET;

            return new DlxClient(endpoint, token).translate(text, source, target);
        }

        /**
         * The provider can forward any source language to DLX.
         * @returns {boolean}
         */
        isSupported() {
            return true;
        }

        /**
         * Self-hosted API endpoints do not provide a translation web page.
         * @returns {string}
         */
        link() {
            return "";
        }
    }

    return {
        extendTranslate(registry) {
            registry("dlx", DlxTranslation);
        },
    };
}

module.exports = { activate };
