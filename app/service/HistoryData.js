// 將資料以月份為單位做備份處理
class HistoryData {
  static #aliveSeconds = 3600 * 24 * 30 // 歷史數據暫存保留時間 30 天

  // 將指 model 中的所有資料寫到 historyModel 中
  static async #insertHistory ({model, historyModel, historyIndexVal, resultCb}) {
    let bulk = await lib.Mongo.getBulkOpt(historyModel)

    const catchKey = `HistoryData-${historyModel.collectionName}`
    const now = lib.Unit.getTwMoment()
    const dateStr = now.format('YYYYMMDD')
    const createdAt = now.toDate()
    const cursor = model.find({})
    let count = 0

    // 移除當日歷史數據暫存
    await ser.Cache.clearCache(catchKey, {$regex: dateStr})

    const valInfos = []
    await lib.Query.cursorEach(cursor, async (result) => {
      _.assign(result, {
        _historyIndex: historyIndexVal, // primary key 用來判斷是哪份歷史資料
        createdAt, // for debug
      })

      delete result._id

      if (resultCb) result = await resultCb(result)

      bulk.insert(result)
      bulk = await bulk.autoExecute()

      valInfos.push({
        val: result,
        subKey: dateStr + `-${++count}`,
      })
    })
    await bulk.finalExecute()

    // 額外將歷史數據暫存一份, 以防發生問題時可以回溯
    await ser.Cache.bulkCatchResults({
      key: catchKey, valInfos,
      aliveSeconds: HistoryData.#aliveSeconds,
      isKeepVal: true,
      isOverWrite: true,
    })
  }

  // 將指定的 collection 中的所有資料寫入 history collection
  static async insertHistoryData (param) {
    const {model, historyModel, historyIndexVal, resultCb} = param

    // 先更新前一次歷史資料為暫存
    const originalSetting = {_historyIndex: historyIndexVal}
    const tempSetting = {_historyIndex: `-${historyIndexVal}`}
    await historyModel.updateMany(originalSetting, {$set: tempSetting})

    try {
      await HistoryData.#insertHistory({model, historyModel, historyIndexVal, resultCb})
      await historyModel.deleteMany(tempSetting) // 成功更新, 移除暫存
    } catch (e) {
      await historyModel.updateMany(tempSetting, {$set: originalSetting}) // 回復暫存資料
      throw Error(e)
    }
  }
}

module.exports = HistoryData
