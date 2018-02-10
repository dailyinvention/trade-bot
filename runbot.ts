import * as GDAX from 'gdax'
const websocket = new GDAX.WebsocketClient(['BTC-USD', 'ETH-USD'])

interface dataObj {
  type: string,
  reason: string
}

websocket.on('message', (data: dataObj) => {
  if (!(data.type === 'done' && data.reason === 'filled'))
         return
  
  console.dir(data)
})

websocket.on('error', err => {
  /* handle error */
})
websocket.on('close', () => {
  /* ... */
})


