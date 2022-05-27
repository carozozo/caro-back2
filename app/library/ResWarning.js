// 處理系統警告 for Router response
class ResWarning {
  constructor ({type, msg}) {
    this.#type = type
    this.#msg = msg
  }

  #type = ''
  #msg = ''

  get type () {
    return this.#type
  }

  get msg () {
    return this.#msg
  }

  static isWarning (object) {
    return _.get(object, 'constructor.name') === ResWarning.name
  }

  static genMsg (msg) {
    return new ResWarning({type: 'msg', msg})
  }

  static genReqUserNotExist () {
    return new ResWarning({type: 'reqUserNotExists', msg: '登入逾期或帳號不存在'})
  }

  static genReqUserRoleDenied () {
    return new ResWarning({type: 'reqUserRoleDenied', msg: '帳號身份無法存取'})
  }
}

module.exports = ResWarning