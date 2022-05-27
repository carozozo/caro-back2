class BaseCtrl extends ser.Ctrl {
  constructor (req) {
    super(req, {skipValidationRouteCodes: true}) // 指定所有路徑都不需經過驗證
  }
}

class NotFoundHandlerCtrl extends BaseCtrl {
  // 當不符合所有 API route 的時候會觸發此項目
  async use_ () {
    await this.$res.resStatus(404) // 設置 http code 為 404
    throw lib.ResWarning.genMsg(`指定路徑並不存在`)
  }
}

module.exports = NotFoundHandlerCtrl
