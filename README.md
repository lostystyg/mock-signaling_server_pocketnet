## Signaling server protocol overview

- Signaling server accept websocket connections.
- Signaling server uses json as a data protocol
- All messages have property "type" which should be one of the following:
  - "protocol". This means that this message is part of webrtc protocol and should be redirected.
  - "list". Answer on this message will be the list of registered client's IP addresses.
  - "registerme". Signaling server will register connection as waiting for webrtc's offer.
- Nodes are connecting to signaling server and send "registerme" request.
- Clients are connecting to signaling server, sending "list" request and starting webrtc protocol with choosen registered node.

### Request details:
#### "registerme" request:
```json
{"type": "registerme"}
```
  - Will register node as waiting for connections. No answer provided **(yet to discuss, there is no problem to send answer)**

#### "list" request
```json
{"type": "list"}
```
- Signaling server answers with array of registered node's IP addresses, e.x.:
```json
["123.111.231.23", "12.12.12.12"]
```
#### "protocol" request
```json
{"type": "protocol", "ip": "12.213.1.31", "message": {"...protocol message here..."}
```
- Sends a webrtc protocol message to specified ip address. Signaling server just redirects the whole message (not only webrtc protocol's part) to specified ip and change specified ip (that was destination ip) to sender's ip (so the receiver will know ip of the sender)
