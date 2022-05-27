class BaseCtrl extends ser.Ctrl {
  constructor (req) {
    super(req, {skipValidationRouteCodes: true}) // 指定所有路徑都不需經過驗證
  }
}

class IndexCtrl extends BaseCtrl {
  async get_ () {
    await this.$res.resRender('index')
  }

  async get_page () {
    const param = this.$getParam()
    const _pageSubject = param._pageSubject
    const _pageName = param._pageName
    const path = `${PROJECT_PATH}/public/html/${_pageSubject}/${_pageName}.html`
    await this.$req.setPageQueryParam(param)
    await this.$res.resSendFile(path)
  }

  async get_source_STAR () {
    const path = `${PROJECT_PATH}/public/${this.$params[0]}`
    await this.$res.resSendFile(path)
  }
}

module.exports = IndexCtrl
