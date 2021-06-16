# Changelog

## 2021-06-15

- The cloud server will not stop if there is an error from the WebSocket server.
- `--per-message-deflate` option to match Scratch's cloud server; disabled by default.

## 2021-03-16

- The web server now serves files from the static/ folder. static/404.html is used as the 404 page.
- Automatically determines your public and private IP (and fancy colours in the console!).
- No longer clears a corrupt JSON file of cloud variables.
- **DEPRECATED**: index.html in the project folder. You should move this to static/index.html (feel free to overwrite the placeholder file there).

## 2020-12-31

- The cloud server is now also a web server that serves index.html.

## 2019-12-25

- Cloud server functionality
