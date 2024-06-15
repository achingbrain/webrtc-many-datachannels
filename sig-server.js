import { WebSocketServer } from 'ws';

const port = process.env.PORT ?? 8080
const peers = new Map()

const wss = new WebSocketServer({ port: port })
const decoder = new TextDecoder()

wss.on('connection', function connection(ws) {
  let name
  ws.on('error', console.error)

  ws.on('message', (data) => {
    const message = JSON.parse(decoder.decode(data))

    if (message.type === 'register') {
      if (!message.name || peers.has(message.name)) {
        return
      }

      name = message.name
      peers.set(message.name, ws)
      console.info(name, 'connected')
    } else if (message.target) {
      peers.get(message.target)?.send(data)
    }
  })

  ws.on('close', () => {
    if (name != null) {
      console.info(name, 'disconnected')
      peers.delete(name)
    }
  })
})

console.log('signaling server has started on:', `http://127.0.0.1:${wss.options.port}`)
