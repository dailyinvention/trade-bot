import * as GDAX from 'gdax'
import * as redis from 'redis'
import * as mongodb from 'mongodb'

const MongoClient = mongodb.MongoClient
const mongoURL = 'mongodb://localhost:27017'
const dbName = 'tradebot_data'
const redisClient = redis.createClient()
const websocket = new GDAX.WebsocketClient(['BTC-USD', 'ETH-USD'])

interface dataObj {
  type: string,
  reason: string
}

interface redisObj {
  product_id: string
  side: string,
  time: string
}

interface mongoObj {
  id: number,
  type: string,
  items: mongoItemsObj
}

interface mongoItemsObj {
  starttime: Date,
  endtime: Date,
  buys: number,
  sells: number
}

// Handles getting index of object in array by property value.
let findIndexOfProp = (array: Array<any>, attr: string, value: string) => {
  for(var i = 0; i < array.length; i += 1) {
      if(array[i][attr] === value) {
          return i
      }
  }
  return -1
}

// Builds Mongo object.  Stores buy and sell information from redis output.
let buildMongoObj = () => {
  let redisOutput = []
  let mongoOutput: Array<any> = []
  let starttime, endtime, buys: number = 0, sells: number = 0

  // Load all the Redis key-value pairs keys
  redisClient.keys('*', (err: any, keys: any) => {
    // Loop through each key 
    keys.forEach((key: redisObj, idx: number) => {
      // Get the key value pairs by key
      redisClient.hgetall(keys[idx], function(err, obj) {
        if (findIndexOfProp(mongoOutput, 'type', obj.product_id) === -1) {
          // If type doesn't exist, add new type object to mongo array.
          // Set the start date
          let startDate = new Date(obj.time).getTime()
          let newArray: mongoObj = {
            type: obj.product_id,
            items: {
              starttime: startDate,
              endtime: '',
              buys: 0,
              sells: 0
            }
          }
          // Include object in array
          mongoOutput.push(newArray)
        } else {
          // Else iterate the buys and sells
          let objIdx = findIndexOfProp(mongoOutput, 'type', obj.product_id)
          // Changes the object time.  When loop ends, should be the end time for each type
          mongoOutput[objIdx].items.endtime = obj.time
          if (obj.side === 'buy') {
            mongoOutput[objIdx].items.buys++
          } else {
            mongoOutput[objIdx].items.sells++
          }

        }
        console.log(JSON.stringify(mongoOutput))
      })
    })
  })
  return mongoOutput
}

let getBuySell = (mongoOutput) => {
  
}

let insertDocuments = function(db, callback) {
  // Get the documents collection
  let collection = db.collection('brainpoststats');
  // Insert some documents
  collection.insertMany(sorted.reverse(), function(err, result) {
        assert.equal(err, null);
        console.log("Inserted objects")
        callback(result);
  });  
 }

websocket.on('message', (data: dataObj) => {
  if (!(data.type === 'done' && data.reason === 'filled'))
         return
  
  buildMongoObj()
  let date = new Date()
  let month = (date.getMonth().toString().length < 2) ? '0' + (Math.floor(date.getMonth()) + 1).toString() : (Math.floor(date.getMonth()) + 1).toString()
  let dateString = date.getFullYear() + '-' + month + '-' + date.getDate() + ' ' + date.getHours() + '_' + date.getMinutes() + '_' + date.getSeconds() + '.' + date.getMilliseconds()


  redisClient.hmset(dateString, data, (error: string, result: string) => {
    if (error) {
      console.log(error)
    } else {
      //console.dir(result)
    }
  })
})

websocket.on('error', err => {
  /* handle error */
})
websocket.on('close', () => {
  /* ... */
})
