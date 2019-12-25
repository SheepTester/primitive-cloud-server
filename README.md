# primitive-cloud-server
A primitive Node server for Scratch 3.0 cloud variables; it's not made for large-scale projects and can easily be tricked by those pesky JavaScript programmers.

```sh
npm start
```

Makes a WebSocket thing available at ws://localhost:3000/

Uses the Node [ws](https://github.com/websockets/ws) library

## Details

All WebSocket messages are JSON strings; the server may send multiple JSON objects separated by a newline character, but the client may not do that back.

When the client first connects to the server, Scratch sends a "handshake" message, which I think lets the server know which project it is on so the server can then send a series of "set" messages to initialize the client's cloud variables.

```json
// client -> server
{ "method": "handshake", "project_id": "104" }

// server -> client
{ "method": "set", "name": "☁ cool cloud variable", "value": "45643563456" }
{ "method": "set", "name": "☁ epic cloud variable", "value": "10239489031" }
{ "method": "set", "name": "☁ newish variable", "value": "0" }
```

After that the client can send a "set" message to the server, which will broadcast it to the other clients on the project.
