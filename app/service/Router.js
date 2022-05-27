// API Router 處理, log request 和 transfer response
class Router {
  constructor (app, baseUrl) {
    const express = require(`express`)
    const path = require(`path`)

    this.#router = express.Router()

    baseUrl = Router.#addSlash(path.join(global.ROUTE_ROOT, baseUrl))
    app.use(baseUrl, this.#router)
  }

  #router = null

  // 在網址前加上斜線
  static #addSlash (url) {
    return url.indexOf(`/`) === 0 ? url : `/${url}`
  }

  // 不顯示密碼
  static #replacePwdOfParam (param) {
    if (param.pwd) param.pwd = '*'
    if (param.checkPwd) param.checkPwd = '*'
    return param
  }

  // 執行 controller fn 並寫入 log
  static async #execAndLog (ctrl, fn) {
    const startTime = moment()
    let msgLevel = 'suc', msgType, result

    const infoForStart = {
      id: ctrl.$id,
      ip: ctrl.$ip,
      reqUser: _.get(ctrl.$reqUser, 'accountName'),
      method: ctrl.$method,
      fullPath: ctrl.$fullPath,
      oriParam: Router.#replacePwdOfParam(ctrl.$oriParam),
      param: Router.#replacePwdOfParam(ctrl.$getParam()),
      pageParam: ctrl.$getPageParam(),
    }
    log.print(JSON.stringify(infoForStart))

    const errorHandler = async (e) => {
      if (lib.ResWarning.isWarning(e)) {
        msgLevel = 'war'
        msgType = e.type
        result = e.msg
      } else {
        msgLevel = 'err'
        result = e.stack || e.message || 'Unknown error'
        log.error(e)
        await lib.Slacker.sendSysNotice({msg: ['Got error in route', e.message]})
      }
    }

    try {
      result = await fn()
      if (_.isArray(result) && _.size(result) > 200) {
        await errorHandler(lib.ResWarning.genMsg(`查詢資料過多`))
      }
    } catch (e) {
      await errorHandler(e)
    }

    // 有 result, log info 並 respond
    const seconds = lib.Unit.getDiffSeconds(startTime)
    const info = {
      id: ctrl.$id,
      msgLevel,
      msgType,
      seconds,
      result: msgLevel === 'suc' ? undefined : result,
    }
    log.print(JSON.stringify(info))

    if (ctrl.$res.isHeadersSent) return
    await ctrl.$res.resSend({[msgLevel]: result, msgType})
  }

  // 回傳要給 route API 觸發的 callback function
  #buildupRouteFn (ctrl, fn) {
    return async () => {
      const middleResult = await ctrl.middle()
      if (ctrl.$res.isHeadersSent) return
      if (!_.isUndefined(middleResult)) return middleResult
      return fn()
    }
  }

  // 解析傳入的 Ctrl 並註冊 api route 行為
  #parseCtrl (Ctrl) {
    // 找出 Ctrl 中 instance-method name 格式為 get_xxx/post_xxx/_xxx 的函式, 轉為 route fn
    // e.g. 'get_index_STAR' => [GET] index/*
    const propertyInfo = lib.Unit.getInstancePropertyInfoOfClass(Ctrl)

    _.forEach(propertyInfo, (property, name) => {
      if (!_.isFunction(property)) return

      const arr = name.split('_')
      const method = arr.shift() || 'post' // 函式名稱 _xxx 相當於 post_xxx

      if (!['use', 'post', 'get'].includes(method)) return

      _.forEach(arr, (subPath, i) => {
        if (subPath === 'STAR') arr[i] = '*'
      })
      const routePath = arr.join('/')

      this.#router[method](Router.#addSlash(routePath), async (req, res) => {
        const ctrl = new Ctrl(req)
        await ctrl.initCtrl(req, res)

        const routeFn = this.#buildupRouteFn(ctrl, async () => {
          return ctrl[name]()
        })
        await Router.#execAndLog(ctrl, routeFn)
      })
    })
  }

  // 解析傳入的 Ctrl Array 並註冊 api route 行為
  parseCtrlArr (CtrlArr) {
    if (!_.isArray(CtrlArr)) CtrlArr = [CtrlArr]
    for (const Ctrl of CtrlArr) {
      this.#parseCtrl(Ctrl)
    }
  }
}

module.exports = Router
