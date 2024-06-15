# WebRTC many datachannels

This repo contains three scripts:

1. `sig-server.js` Starts a WebSocket server that is used for signalling between the sender and recpients
1. `recipient.js` Opens a connection to `sig-server` and listens for incoming WebRTC connections
    - For any incoming datachannel that is opened, accept any data message and write it back into the channel
1. `sender.js` Connects to `recipient.js` via `sig-server`, then in a loop, opens a datachannel on the connection, writes a small message into it, waits for it to be received and closes the channel

## Running

0. Install dependencies

```console
$ npm i
```

1. Start the sig-server

```console
$ node sig-server.js
signaling server has started on: http://127.0.0.1:8080
```

2. Start the recipient

Chrome:

```console
$ npx pw-test ./recipient.js
```

Firefox:

```console
$ npx pw-test --browser firefox ./recipient.js
```

Any browser:

https://codepen.io/achingbrain/pen/yLWpJrB

3. Start the sender

Chrome:

```console
$ npx pw-test ./sender.js
```

Firefox:

```console
$ npx pw-test --browser firefox ./sender.js
```

Any browser

https://codepen.io/achingbrain/pen/dyEJXLz

## Expected behaviour

Many messages should be logged, the channel id should increase:

```
// sender.js
...
Ping channel-5646 took 1ms
Ping channel-5647 took 1ms
Ping channel-5648 took 1ms
Ping channel-5649 took 0ms
Ping channel-5650 took 1ms
...
```

The recipient should log corresponding events for each channel:

```
// recipient.js
...
channel-5646 open
channel-5646 data
channel-5646 close
channel-5647 open
channel-5647 data
channel-5647 close
channel-5648 open
channel-5648 data
channel-5648 close
...
```

## Observed behaviour

| Sender  | Recipient | Result |
| ------- | --------- | ------ |
| Chrome  | Chrome    | ✅     |
| Chrome  | Firefox   | ✅     |
| Firefox | Chrome    | ❌     |
| Firefox | Firefox   | ❌     |

In both cases Firefox as a sender stops sending data after a very small number of iterations:

```
Ping channel-1 took 28ms
Ping channel-2 took 5ms
Did not receive ping response on channel-3 after 5005ms
```
