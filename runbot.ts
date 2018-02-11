import * as GDAX from 'gdax'
import * as redis from 'redis'

const redisClient = redis.createClient()
const websocket = new GDAX.WebsocketClient(['BTC-USD', 'ETH-USD'])

interface dataObj {
  type: string,
  reason: string
}

websocket.on('message', (data: dataObj) => {
  if (!(data.type === 'done' && data.reason === 'filled'))
         return
  
  let date = new Date()
  let dateString = date.getFullYear() + '-' + date.getMonth() + 1 + '-' + date.getDate() + ' ' + date.getHours() + '_' + date.getMinutes() + '_' + date.getSeconds() + '_' + date.getMilliseconds()
  
  redisClient.hmset(dateString, data, (error: string, result: string) => {
    if (error) {
      console.log(error)
    } else {
      console.dir(result)
    }
  })
})

websocket.on('error', err => {
  /* handle error */
})
websocket.on('close', () => {
  /* ... */
})
