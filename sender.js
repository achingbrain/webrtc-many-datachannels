const peerName = 'sender'
const targetPeer = 'recipient'
const ws = new WebSocket('http://127.0.0.1:8080')
const decoder = new TextDecoder()

async function main() {
  const rtcConnection = new RTCPeerConnection()
  const dataChannel = rtcConnection.createDataChannel('')
  const connected = new Promise((resolve) => {
    rtcConnection.addEventListener('connectionstatechange', () => {
      if (rtcConnection.connectionState === 'connected') {
        resolve()
      }
    })
  })

  ws.addEventListener('open', () => {
    // register with server
    ws.send(JSON.stringify({
      type: 'register',
      name: peerName
    }))

    // sender initiates connection
    Promise.resolve().then(async () => {
      const localOffer = await rtcConnection.createOffer()
      await rtcConnection.setLocalDescription(localOffer)

      ws.send(JSON.stringify({
        target: targetPeer,
        type: 'offer',
        offer: localOffer
      }))

      rtcConnection.addEventListener('icecandidate', (event) => {
        ws.send(JSON.stringify({
          target: targetPeer,
          type: 'icecandidate',
          candidate: event.candidate
        }))
      })
    })
  })

  ws.addEventListener('message', (event) => {
    Promise.resolve().then(async () => {
      const message = await readMessage(event)

      if (message.type === 'icecandidate') {
        rtcConnection.addIceCandidate(message.candidate)
      }

      if (message.type === 'answer') {
        rtcConnection.setRemoteDescription(message.offer)
      }
    })
  })

  await connected

  console.info('sender connected')

  let index = 0
  const encoder = new TextEncoder()

  // send pings
  while (true) {
    await new Promise(resolve => {
      let timeout
      let start = Date.now()
      const message = `${Date.now()}`

      // create channel
      const channel = rtcConnection.createDataChannel(`channel-${++index}`)

      channel.addEventListener('error', (event) => {
        console.error(channel.label, 'error', event)
      })

      channel.addEventListener('close', () => {
        resolve()
      })

      // close channel when response is received
      channel.addEventListener('message', (event) => {
        Promise.resolve().then(async () => {
          const response = await readMessage(event)

          if (response.message !== message) {
            console.error('incorrect response', response.message, '!==', message)
          }

          channel.close()
          console.info(`Ping ${channel.label} took ${Date.now() - start}ms`)
          clearTimeout(timeout)
        })
      })

      // send ping message after opening
      channel.addEventListener('open', () => {
        channel.send(encoder.encode(JSON.stringify({
          seq: index,
          message
        })))

        timeout = setTimeout(() => {
          console.info(`Did not receive ping response on ${channel.label} after ${Date.now() - start}ms`)
        }, 5000)
      })
    })
  }
}

async function readMessage (event) {
  let string = ''

  if (event.data instanceof Blob) {
    const array = new Uint8Array(await event.data.arrayBuffer())
    string = decoder.decode(array)
  } else if (event.data instanceof ArrayBuffer) {
    const array = new Uint8Array(event.data)
    string = decoder.decode(array)
  } else if (event.data instanceof Uint8Array) {
    string = decoder.decode(event.data)
  } else {
    string = event.data.toString()
  }

  return JSON.parse(string)
}

main()
