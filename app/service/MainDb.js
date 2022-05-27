// 備份 mongo DB 連線
const fs = require('fs')
const path = require('path')
const exec = require('child_process').exec
const {MongoClient} = require(`mongodb`) // http://mongodb.github.io/node-mongodb-native/

class MainDb {
  static #userName = 'xxx'
  static #pwd = 'xxx'
  static #authSource = 'xxx'
  static #dbUrl = 'localhost:27017'
  static #connection = null

  static #mainDbName = `caro-back2-${global.NODE_ENV}`
  static #proj1DbName = `caro-back2-proj1-${global.NODE_ENV}`

  static #mainDb = null
  static #proj1Db = null

  static #dbInfoList = []

  static get authDbUri () {
    if (!global.IS_PROD_ENV) return `mongodb://${MainDb.#dbUrl}`
    const pwd = encodeURIComponent(MainDb.#pwd)
    return `mongodb://${MainDb.#userName}:${pwd}@${MainDb.#dbUrl}?authSource=${MainDb.#authSource}`
  }

  static get mainDbName () {
    return this.#mainDbName
  }

  static get mainDb () {
    return MainDb.#mainDb
  }

  static get proj1Db () {
    return MainDb.#proj1Db
  }

  // 轉換原本的 mongodb aggregate
  static #replaceAggregateFn (collection) {
    const originalAggregateFn = collection.aggregate
    collection.aggregate = (...args) => {
      const secondArg = args[1] || {}
      if (_.isPlainObject(secondArg)) _.assign(secondArg, {allowDiskUse: true}) // 預設 allowDiskUse
      args[1] = secondArg
      return originalAggregateFn.apply(collection, args)
    }
  }

  static #restoreDb (dbName, dirPath) {
    if (![MainDb.#mainDbName].includes(dbName)) throw new Error(`dbName ${dbName} not exists`)

    return new Promise(async (resolve, reject) => {
      log.print(`Start import ${dbName}`)
      exec(`mongorestore --host localhost:27017 --db ${dbName} ${dirPath} --drop`, (err) => {
        if (err) return reject(err)
        log.print('Import successful')
        setTimeout(() => {
          resolve()
        }, 2000)
      })
    })
  }

  // 連線到備份 DB
  static async connect () {
    return new Promise((res, rej) => {
      log.print(`Connecting to main-DB`)

      const opt = {
        // authSource: MainDb.#authSource,
        // auth: {user: MainDb.#userName, password: MainDb.#pwd},
        useUnifiedTopology: true, useNewUrlParser: true, connectTimeoutMS: 60000,
      }

      MongoClient.connect(`mongodb://${MainDb.#dbUrl}`, opt, async (e, conn) => {
        if (e) return rej(e)
        log.print(`main-DB is connected`)

        this.#connection = conn

        MainDb.#dbInfoList.push(...[
          {globalSet: 'db0', db: MainDb.#mainDb = conn.db(MainDb.#mainDbName)},
          {globalSet: 'db1', db: MainDb.#mainDb = conn.db(MainDb.#proj1DbName)},
        ])

        // 取得 database 中的所有 collection 並設置到 global 集合
        for (const info of MainDb.#dbInfoList) {
          const globalSetName = info.globalSet
          const db = info.db
          const cursor = db.listCollections({}, {nameOnly: true})
          while (await cursor.hasNext()) {
            const col = await cursor.next()
            const colName = col.name
            // e.g. global.db0.Account = MainDb.mainDb.collection('Account')
            const collection = global[globalSetName][colName] = await db.collection(colName)
            MainDb.#replaceAggregateFn(collection)
          }
        }
        res()
      })
    })
  }

  static async close () {
    return new Promise((res) => {
      if (!MainDb.#connection) return res()
      MainDb.#connection.close(() => {
        log.print(`main-DB is closed`)
        res()
      })
    })
  }

  // 自動搜尋 service, 並設定新的 collection 物件到 global 集合
  static async autoInitCollections () {
    let $initCollectionInfo, c
    for (let s of [ser, ser0, ser1]) {
      for (let className in s) {
        c = s[className]

        $initCollectionInfo = c.$initCollectionInfo
        if (!$initCollectionInfo) continue

        const globalSetName = $initCollectionInfo.globalSet
        const name = className || $initCollectionInfo.name
        const cb = $initCollectionInfo.cb

        const info = _.find(MainDb.#dbInfoList, (info) => info.globalSet === globalSetName)
        if (!info) throw Error(`Global DB set ${globalSetName} 不存在`)

        const collection = global[globalSetName][name] = info.db.collection(name)
        MainDb.#replaceAggregateFn(collection)
        cb && await cb()
      }
    }
  }

  // 從 s3 下載 DB 備份, 並倒入 DB
  static async initDb () {
    const bucketName = 'caro-back2'
    const bucket = new ser.AwsS3(bucketName)
    const lastObj = await bucket.getLastObject('db-prod/')
    const filepath = await bucket.downloadObj(lastObj, TEMP_DIR_PATH)

    await lib.Unzip.expandTarGz({filepath, distDirPath: TEMP_DIR_PATH})
    fs.unlinkSync(filepath)

    const dirPath = path.join(path.dirname(filepath), 'db/bak/caro-back2')
    await MainDb.#restoreDb(MainDb.#mainDbName, dirPath)
  }
}

module.exports = MainDb
