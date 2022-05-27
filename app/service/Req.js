// 處理 request 相關事務
class Req {
  constructor (req) {
    this.#req = req
    this.#session = req.session
  }

  // 將 account 轉換為 reqUser instance
  static async #generateReqUserInstance (account) {
    if (!account) return
    return new ser.ReqUser(account)
  }

  #req = null
  #session = null
  user = null

  // 設置發出 request 的 account user; 無值代表清空
  async setAccountToReqUser (account) {
    this.user = await Req.#generateReqUserInstance(account)
    this.#session.reqUserId = _.get(account, '_id', '')
  }

  // 設置 query 資訊到 session
  async setPageQueryParam (pageQueryParam) {
    const _pageSubject = pageQueryParam._pageSubject
    const _pageName = pageQueryParam._pageName
    if (!_pageSubject || !_pageName) throw Error('_pageSubject and _pageName are required in queryParam')
    if (await ser.PageSubject.isExcludedPageContent(_pageName)) return // 內容頁在排除名單中 => 跳過
    this.#session.pageQueryParam = pageQueryParam
  }

  // 取得 session 中的 query 資訊
  async getPageQueryParam () {
    return this.#session.pageQueryParam || {}
  }

  // 初始化 request
  async initReq () {
    if (!global.IS_LOGIN_MODE) return
    if (!this.#session) return
    const reqUserId = this.#session.reqUserId
    if (!reqUserId) return
    const account = await db0.Account.findOne({_id: lib.Mongo.toObjectId(reqUserId)})
    this.user = await Req.#generateReqUserInstance(account)
  }
}

module.exports = Req