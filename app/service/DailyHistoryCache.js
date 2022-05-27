// 將資料以一天為單位做暫存處理
class DailyHistoryCache {
  static #aliveSeconds = 3600 * 24 * 30 // 預設的暫存保留時間 30 天

  static #getCacheSubKey () {
    return lib.Unit.getTwMoment().format('YYYY-MM-DD')
  }

  // 將資料寫入今日歷史暫存
  static async setTodayHistoryVal (key, val, {aliveSeconds = DailyHistoryCache.#aliveSeconds} = {}) {
    const subKey = DailyHistoryCache.#getCacheSubKey()
    return ser.Cache.catchResult({
      key, subKey, val, aliveSeconds, isKeepVal: true, isOverWrite: true,
    })
  }

  // 取得最後一筆暫存
  static async getLastHistoryVal (key, {skip = 0} = {}) {
    const where = {key} // 找出非當日的暫存
    const opt = {sort: {subKey: -1}, skip} // 由新到舊取一筆
    return _.get(await ser.Cache.getCache(where, opt), 'val', null)
  }
}

module.exports = DailyHistoryCache
