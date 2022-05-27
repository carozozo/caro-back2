// 讀取寫入暫存資料到 main-DB
const EventEmitter = require('events')
const emitter = new EventEmitter()

class Cache {
  static $initCollectionInfo = {
    globalSet: 'db0',
    cb: async () => {
      // 清除過期資料
      await db0.Cache.deleteMany({isKeepVal: false})
      await db0.Cache.deleteMany({deadline: {$lt: moment().toDate()}})
    },
  }

  static #cachingMap = {}

  // 檢查 key 值
  static #validateKey ({key, subKey}) {
    if (!(_.isString(key) && key)) throw new Error(`Key must to be a non-empty string`)
    if (!_.isUndefined(subKey) && !_.isString(subKey)) {
      throw new Error(`SubKey must to be a string`)
    }
  }

  // 檢查 val 值
  static #validateVal (val) {
    if (!(_.isString(val) || _.isNumber(val) || _.isNil(val) || _.isPlainObject(val) || _.isArray(val))) {
      throw new Error(`Val is invalid`)
    }
  }

  // 檢查目前取得的暫存是否有效
  static #ifValidCache (param) {
    const {cacheData, isOverWrite} = param
    if (!cacheData || isOverWrite) return false // 無暫存資料或是要強制寫入新暫存
    return moment().isBefore(cacheData.deadline)
  }

  // 轉換資料為 Cache 格式
  static #genCacheData (param) {
    const {
      key, val, subKey,
      aliveSeconds = 3600, // 暫存存活幾秒
      isKeepVal = false, // 服務啟動時是否保留暫存
    } = param

    return {
      key, val, subKey, isKeepVal,
      deadline: moment().add(aliveSeconds, 's').toDate(),
      createdAt: new Date(),
    }
  }

  // 判斷 key 是否暫存處理中
  static #ifCaching (key) {
    return Cache.#cachingMap[key]
  }

  // 設置 key 為暫存處理中
  static #setCaching (key, bool = true) {
    if (bool === true) return Cache.#cachingMap[key] = true
    delete Cache.#cachingMap[key]
  }

  // 將值寫入暫存
  static async catchResult (param) {
    let {
      key, subKey, // 暫存鍵 {key, subKey} 只會有一組
      val, // 要暫存的值, 為 function 時會執行並取得回傳的值
      aliveSeconds = 3600, // 暫存存活幾秒
      isKeepVal = false, // 服務啟動時是否保留暫存
      isOverWrite = false, // 是否強制覆寫值
    } = param
    const returnRet = (data, isFromCache = false) => {
      Cache.#setCaching(key, false)
      emitter.emit(key)
      return _.assign(data, {isFromCache})
    }
    let cacheData = {val: null}

    Cache.#validateKey({key, subKey, val})

    if (Cache.#ifCaching(key)) {
      return new Promise((res, rej) => {
        emitter.once(key, async () => {
          try {
            const result = await Cache.catchResult(param)
            res(result)
          } catch (e) {
            rej(e)
          }
        })
      })
    }

    Cache.#setCaching(key)

    // 取值
    val = cacheData.val = _.isFunction(val) ? await val() : val

    Cache.#validateVal(val)

    // 嘗試找出舊暫存並回傳
    const oldCacheData = await Cache.getCache({key, subKey})

    if (Cache.#ifValidCache({cacheData: oldCacheData, isOverWrite})) {
      return returnRet(oldCacheData, true) // 暫存資料可使用, 直接回傳
    }

    const rawCache = Cache.#genCacheData({key, val, subKey, aliveSeconds, isKeepVal})

    try {
      await db0.Cache.updateOne({key, subKey}, {$set: rawCache}, {upsert: true})
      cacheData = await Cache.getCache({key, subKey})
    } catch (e) {
      throw e
    } finally {
      emitter.emit(key)
    }
    return returnRet(cacheData)
  }

  // 批次將資料列表寫入暫存
  static async bulkCatchResults (param) {
    let {
      key, // 暫存鍵
      valInfos, // 由 {val, subKey} 組成的資訊, val 為要暫存的值
      isOverWrite = false, // 是否強制覆寫值
      aliveSeconds = 3600, // 暫存存活幾秒
      isKeepVal = false, // 服務啟動時是否保留暫存
    } = param

    if (Cache.#ifCaching(key)) {
      return new Promise((res, rej) => {
        emitter.once(key, async () => {
          try {
            const result = await Cache.bulkCatchResults(param)
            res(result)
          } catch (e) {
            rej(e)
          }
        })
      })
    }

    Cache.#setCaching(key)

    const subKeys = _.map(valInfos, 'subKey')
    const oldCacheDataList = await Cache.getCaches({key, subKey: {$in: subKeys}})
    const oldCacheMap = _.keyBy(oldCacheDataList, 'subKey')

    let bulk = await lib.Mongo.getBulkOpt(db0.Cache)
    let val, subKey

    try {
      for ({val, subKey} of valInfos) {
        Cache.#validateKey({key, subKey})
        Cache.#validateVal(val)

        if (Cache.#ifValidCache({cacheData: oldCacheMap[subKey], isOverWrite})) continue

        const rawCache = Cache.#genCacheData({key, subKey, val, aliveSeconds, isKeepVal})

        bulk.find({key, subKey}).upsert().replaceOne(rawCache)
        bulk = await bulk.autoExecute()
      }
      await bulk.finalExecute()
    } catch (e) {
      throw e
    } finally {
      emitter.emit(key)
      Cache.#setCaching(key, false)
    }
  }

  // 取得指定暫存資料
  static async getCache (where, opt) {
    return db0.Cache.findOne(where, opt)
  }

  // 取得指定暫存資料列表
  static async getCaches (where, opt) {
    return db0.Cache.find(where, opt).toArray()
  }

  // 清空指定暫存資料
  static async clearCache (key, subKey) {
    await db0.Cache.deleteMany({key, subKey})
  }
}

module.exports = Cache
