const peerName = 'recipient'
const targetPeer = 'sender'
const ws = new WebSocket('http://127.0.0.1:8080')
const decoder = new TextDecoder()

async function main() {
  const rtcConnection = new RTCPeerConnection()
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
  })

  ws.addEventListener('message', (event) => {
    Promise.resolve().then(async () => {
      const message = await readMessage(event)

      if (message.type === 'icecandidate') {
        rtcConnection.addIceCandidate(message.candidate)
      }

      if (message.type === 'offer') {
        rtcConnection.setRemoteDescription(message.offer)

        const localAnswer = await rtcConnection.createAnswer()
        await rtcConnection.setLocalDescription(localAnswer)

        ws.send(JSON.stringify({
          target: targetPeer,
          type: 'answer',
          offer: localAnswer
        }))

        rtcConnection.addEventListener('icecandidate', (event) => {
          ws.send(JSON.stringify({
            target: targetPeer,
            type: 'icecandidate',
            candidate: event.candidate
          }))
        })
      }
    })
  })

  await connected

  console.info('recipient connected')

  rtcConnection.addEventListener('datachannel', (event) => {
    const datachannel = event.channel

    datachannel.addEventListener('error', (event) => {
      console.error(channel.label, 'error', event)
    })

    datachannel.addEventListener('open', () => {
      console.info(datachannel.label, 'open')
    })

    datachannel.addEventListener('close', () => {
      console.info(datachannel.label, 'close')
    })

    // echo data back to sender
    datachannel.addEventListener('message', (event) => {
      console.info(datachannel.label, 'data')
      datachannel.send(event.data)
    })
  })
}

async function readMessage (event) {
  let string = ''

  if (event.data instanceof Blob) {
    const array = new Uint8Array(await event.data.arrayBuffer())
    string = decoder.decode(array)
  } else if (event.data instanceof ArrayBuffer) {
    const array = new Uint8Array(array)
    string = decoder.decode(array)
  } else if (event.data instanceof Uint8Array) {
    string = decoder.decode(event.data)
  } else {
    string = event.data.toString()
  }

  return JSON.parse(string)
}

main()
