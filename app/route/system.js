class BaseCtrl extends ser.Ctrl {
  constructor (req) {
    super(req, {skipValidationRouteCodes: true}) // 指定所有路徑都不需經過驗證
  }
}

class SystemCtrl extends BaseCtrl {
  // 取得系統資訊
  async _getSystemInfo () {
    return {};
  }
}

module.exports = SystemCtrl
