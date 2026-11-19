# DLX Translation Source

Use a self-hosted [DLX / DeepLX](https://github.com/OwO-Network/DLX) server as a translation source in [Comment Translate](https://marketplace.visualstudio.com/items?itemName=intellsmi.comment-translate).

## Features

- Translate comments and selected text through Comment Translate.
- Connect to your own DLX server with optional Bearer authentication.

## Requirements

- VS Code and the Comment Translate extension.
- A running DLX or DeepLX server with a `POST /translate` endpoint.

## Use

1. Set **DLX Translation Source: Endpoint** in VS Code user settings. The default is `http://127.0.0.1:1188/translate`.
2. If your server requires authentication, run **DLX: Set Access Token**. Set the token separately on each machine.
3. In the Command Palette, run Comment Translate’s **Change Translation Source** command and select **DLX (self-hosted)**.
4. Use Comment Translate to translate a comment or selection. Set the desired target language in Comment Translate.

## Extension Settings

- `deeplxSource.endpoint` — Full URL to the server’s `/translate` endpoint. Use HTTPS when sending a token to a server outside your machine.
- **DLX: Set Access Token** and **DLX: Clear Access Token** — Manage the token in VS Code Secret Storage.

## Troubleshooting

Check that the server returns HTTP 200 with a DLX response containing `code: 200` and a string `data` field. This extension uses DLX’s `/translate` response format. If the server returns HTTP 500, check its logs for the underlying translation error.

## Development

Run the local HTTP tests with `npm test` on Node.js 22 or later. Open this folder in VS Code and use **Debug: Start Debugging** with an **Extension Development Host** launch configuration to try it with Comment Translate.

## Publishing

Set `publisher` in `package.json` to the Marketplace publisher ID. In the publisher’s Trusted Publishing settings, create a policy for the GitHub repository and the workflow file `publish.yml`. Leave Environment blank. The workflow uses OIDC, so it needs no Marketplace token secret.

Push a version tag matching `package.json` (for example, `v0.1.0` for version `0.1.0`). GitHub Actions checks the tag, runs the tests, packages the extension, and publishes that VSIX to the Marketplace.

See the [VS Code publishing documentation](https://code.visualstudio.com/api/working-with-extensions/publishing-extension#publish-with-github-actions-and-trusted-publishing).
