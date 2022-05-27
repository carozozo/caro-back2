// 處理 DB index
class DbIndex {
  // 建立 main DB 資料 index
  static async createMainDbIndexes () {
    log.print(`Creating main-DB indexes`)

    db0.Account.createIndex({accountName: 1})
    db0.Cache.createIndex({key: 1, subKey: 1})
    db0.Cache.createIndex({isKeepVal: 1})
    db0.Cache.createIndex({createdAt: 1})

    log.print(`main-DB indexes created`)
  }

  // 建立 proj1 DB 資料 index
  static async createProj1DbIndexes () {
    log.print(`Creating proj1-DB indexes`)

    log.print(`proj1-DB indexes created`)
  }

  // 建立資料 index
  static async createIndexes () {
    await this.createMainDbIndexes()
    await this.createProj1DbIndexes()
  }
}

module.exports = DbIndex
