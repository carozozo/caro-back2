// 讀取寫入暫存資料到記憶體
class MemoryCache {
  static #cacheMap = {}

  // 取得存在記憶體的快取值
  static async getCacheVal (param) {
    let {
      key, val,
      liveSeconds = 86400, // 暫存秒數, 預設 24 小時
    } = param

    let cacheData = this.#cacheMap[key]
    let expirationTime

    if (!_.isEmpty(cacheData)) {
      expirationTime = cacheData.expirationTime
      if (moment().isBefore(expirationTime)) return cacheData.val // 有資料而且沒過期, 直接回傳暫存值
    }

    val = _.isFunction(val) ? await val() : val

    expirationTime = moment().add(liveSeconds, 's')
    this.#cacheMap[key] = {val, expirationTime}
    return val
  }
}

module.exports = MemoryCache
