// Router Controller, 處理 req 參數轉換和通用 router 函式
// Note. $ 開頭代表要讓繼承的 class 使用的變數和函式
class Ctrl {
  constructor (req, {
    skipValidationRouteCodes = [],
  } = {}) {
    const oriParam = _.assign({}, req.query, req.body) // 原本的 request param
    const param = _.clone(oriParam) // 轉換後的 param
    const {skip = 0, limit = 50, sortKeys} = param
    const pageParam = {} // 分頁專用 param

    // 抽換 skip, limit, sortKeys 到 pageParam
    pageParam.skip = parseInt(skip, 10)
    delete param.skip

    pageParam.limit = parseInt(_.min([limit, 200]), 10) // 最多 200 筆, 避免 client 列表載入過重
    delete param.limit

    if (sortKeys) {
      const sortKeys = oriParam.sortKeys.split(' ')
      pageParam.sort = _.reduce(sortKeys, (result, val) => {
        const sort = val.indexOf('-') === 0 ? -1 : 1
        const key = sort === 1 ? val : val.substring(1)
        result[key] = sort
        return result
      }, {})
      delete param.sortKeys
    }

    _.forEach(param, (val, key) => {
      if (!_.isString(val)) return
      val = _.trim(val)
      const lowerVal = val.toLocaleLowerCase()
      if (!val) {
        delete param[key]
      } else if ([`null`].includes(lowerVal)) {
        param[key] = null
      } else if ([`true`, `false`].includes(lowerVal)) {
        param[key] = lowerVal === `true` // 轉換 Boolean
      } else if (!isNaN(parseFloat(val)) && isFinite(val) && val.indexOf(`0`) !== 0) {
        param[key] = parseFloat(val) // 轉換 Number
      } else {
        param[key] = val
      }
    })

    this.#skipValidationRouteCodes = skipValidationRouteCodes

    this.#method = req.method
    this.#oriUrl = req.originalUrl
    this.#baseUrl = req.baseUrl
    this.#path = req.path
    this.#params = req.params
    this.#files = _.get(req, 'files')

    this.#fullPath = `${req.baseUrl}${req.path}`
    this.#oriParam = oriParam
    this.#file = _.get(req, 'files[0]')
    this.#param = param
    this.#pageParam = pageParam

    // 寫入目前的 route 代碼; e.g. post_getList
    this.#routeCode = `${this.#method.toLowerCase()}${this.#path.replace(/\//g, '_')}`

    // 取得 client ip, 原始格式可能為 "xxx, yyy" or "::1" or "::ffff:xxx" (目標為 xxx)
    this.#ip = ((req.headers['x-forwarded-for'] || req.ip ||
      req.connection.remoteAddress || req.socket.remoteAddress ||
      '').split(',')[0] || '').split(':').pop()

    // 用來辨識這次 request 的專用編號
    this.#id = _.map(new Array(10), () => {
      return _.random(9)
    }).join('')
  }

  // 以下為 constructor 參數
  #skipValidationRouteCodes = [] // 不需要觸發 middleware 的 routeCode 名稱
  #routeCode = '' // e.g. post_getList

  // 以下為基本屬性
  #outerPropertyNames = [] // 要給外部使用的 property
  #id = ''
  #ip = ''
  #req = null
  #res = null

  // 以下為提供給繼承 Ctrl 的 routes 使用的 req properties
  #method = ''
  #oriUrl = ''
  #baseUrl = ''
  #path = ''
  #params = ''
  #files = []

  // 以下為提供給繼承 Ctrl 的 routes 使用的 req extent properties
  #fullPath = ''
  #file = null
  #oriParam = {}
  #param = {}
  #pageParam = {}
  #reqUser = null

  get $routeCode () {
    return this.#routeCode
  }

  get $req () {
    return this.#req
  }

  /* Ctrl properties for children START */

  get $res () {
    return this.#res
  }

  get $reqUser () {
    return this.#reqUser
  }

  get $id () {
    return this.#id
  }

  get $ip () {
    return this.#ip
  }

  get $method () {
    return this.#method
  }

  get $oriUrl () {
    return this.#oriUrl
  }

  get $baseUrl () {
    return this.#baseUrl
  }

  get $path () {
    return this.#path
  }

  get $params () {
    return this.#params
  }

  get $files () {
    return this.#files
  }

  get $fullPath () {
    return this.#fullPath
  }

  get $file () {
    return this.#file
  }

  get $oriParam () {
    return _.clone(this.#oriParam)
  }

  // 判斷目前的 routCode 是否在指定的名單中, 名單為 true 代表一律符合
  async #matchRouteCode (routeCodes) {
    return _.isArray(routeCodes) ? _.some(routeCodes, (routeCode) => routeCode === this.#routeCode) : true
  }

  // 檢查 $req.user 是否存在
  async #validateReqUserExists () {
    if (!global.IS_LOGIN_MODE) return
    if (await this.#matchRouteCode(this.#skipValidationRouteCodes)) return // 在忽略名單中, 跳出
    if (!this.$reqUser) throw lib.ResWarning.genReqUserNotExist()
  }

  // 取得搜尋參數
  $getParam () {
    return _.clone(this.#param)
  }

  // 取得分頁搜尋參數
  $getPageParam (paginate = true) {
    if (paginate) return _.clone(this.#pageParam)
    return _.pick(this.#pageParam, ['sort'])
  }

  // 新增搜尋參數
  $addParam (param = {}) {
    _.assign(this.#param, param)
  }

  // 移除搜尋參數
  $removeParamByKeys (keys = []) {
    for (const key of keys) {
      delete this.#param[key]
    }
  }

  // 變更搜尋參數的名稱
  $renameParam (mapping) {
    _.forEach(mapping, (newKey, oldKey) => {
      this.#param[newKey] = this.#param[oldKey]
      delete this.#param[oldKey]
    })
  }

  // 檢查 #req.user 身份
  async $validateReqUserRole (routeCodes, {
    includes, // 允許的 reqUser role
    excludes, // 不允許的 reqUser role
  } = {}) {
    const doesCodeMatch = await this.#matchRouteCode(routeCodes)
    if (!doesCodeMatch) return

    if (!this.#reqUser) throw lib.ResWarning.genReqUserNotExist()
    if (this.#reqUser.isAdmin()) return

    if (includes) {
      includes.push('admin')
      if (!includes.includes(this.#req.user.role)) throw lib.ResWarning.genReqUserRoleDenied()
      return
    }
    if (excludes) {
      if (excludes.includes(this.#req.user.role)) throw lib.ResWarning.genReqUserRoleDenied()
    }
  }

  // 設置 account 到 ctrl 內
  async $setAccount (account) {
    await this.#req.setAccountToReqUser(account)
    await this.#res.setReqUser(this.#req.user)
  }

  /* Ctrl properties for children END */

  // 初始化 ctrl, 由 ser.Router 觸發
  async initCtrl (req, res) {
    this.#req = new ser.Req(req)

    await this.#req.initReq()

    this.#reqUser = this.#req.user
    this.#res = new ser.Res(res, {reqUser: this.#reqUser})
  }

  // 基本 route middleware 由 ser.Router 觸發
  async middle () {
    await this.#validateReqUserExists()
    // 繼承的 class 有宣告 $middle 時執行
    if (this.$middle) return this.$middle()
  }
}

module.exports = Ctrl
