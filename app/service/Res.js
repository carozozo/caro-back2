// 處理 response 相關事務
class Res {
  constructor (res, opt = {}) {
    const {reqUser} = opt
    this.#res = res
    this.#reqUser = reqUser
  }

  #res = null
  #reqUser = null

  // 判斷 response 是否已送出
  get isHeadersSent () {
    return this.#res.headersSent
  }

  // 取得 response http status code
  get statusCode () {
    return this.#res.statusCode
  }

  // 設置 reqUser; 無值代表清空
  async setReqUser (reqUser) {
    this.#reqUser = reqUser
  }

  // 取得 client 需要的相關資訊
  async getClientInfo (pageQueryParam = {}) {
    const pageSubject = await ser.PageSubject.getPageSubjectByReqUser(this.#reqUser)
    const _pageSubject = pageQueryParam._pageSubject
    const _pageName = pageQueryParam._pageName

    for (const groupName in pageSubject) {
      if (_.isEmpty(pageSubject[groupName].menuGroups)) delete pageSubject[groupName]
    }

    if (!pageSubject) throw new Error('pageSubject is empty')

    // 確認頁面主題
    const allGroups = _.keys(pageSubject)
    const confirmedGroup = allGroups.includes(_pageSubject) ? _pageSubject : allGroups[0]
    const menuGroups = pageSubject[confirmedGroup].menuGroups

    // 確認頁面
    const allPagesOfMenu = []
    for (const menuGroup of menuGroups) {
      const {menus} = menuGroup
      allPagesOfMenu.push(..._.keys(menus))
    }
    const confirmedPage = allPagesOfMenu.includes(_pageName) ? _pageName : allPagesOfMenu[0]

    _.assign(pageQueryParam, {_pageSubject: confirmedGroup, _pageName: confirmedPage})

    return {
      account: this.#reqUser ? lib.Unit.classToObject(this.#reqUser) : null, // 帳號資訊
      pageSubject, // 頁面主題資訊
      pageQueryParam,
    }
  }

  // 以下為套用 express.res 的延伸

  // 設置 http status
  async resStatus (...args) {
    return this.#res.status.apply(this.#res, args)
  }

  // 送出 response
  async resSend (...args) {
    this.#res.send.apply(this.#res, args)
  }

  // 建構回傳頁面
  async resRender (...args) {
    this.#res.render.apply(this.#res, args)
  }

  // 建構回傳資料
  async resSendData (data, filename) {
    if (filename) this.#res.attachment(filename)
    this.#res.send(data)
  }

  // 建構回傳頁面檔案
  async resSendFile (...args) {
    return new Promise((resolve, reject) => {
      if (!_.isFunction(_.last(args))) {
        args.push((err) => {
          if (err) return reject(err)
          resolve()
        })
      }
      this.#res.sendFile.apply(this.#res, args)
    })
  }

  // 建構回傳下載檔案
  async resDownload (...args) {
    return new Promise((resolve, reject) => {
      if (!_.isFunction(_.last(args))) {
        args.push((err) => {
          if (err) return reject(err)
          resolve()
        })
      }
      this.#res.download.apply(this.#res, args)
    })
  }
}

module.exports = Res
