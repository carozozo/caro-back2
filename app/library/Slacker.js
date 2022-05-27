const rp = require(`request-promise`)

// 專案專用 Slack 函式庫
class Slacker {
  static #slackToken = 'xxx'
  static #channel = global.NODE_ENV === 'prod' ? 'notification' : 'notification-test'

  // 轉換非字串的訊息
  static #convertToString (msg) {
    return _.isString(msg) ? msg : JSON.stringify(msg)
  }

  // 解析傳入訊息
  static #parseMsg (msg) {
    if (_.isArray(msg)) {
      msg = _.map(msg, (m) => Slacker.#convertToString(m))
      msg = msg.join('\r\n')
    } else {
      msg = Slacker.#convertToString(msg)
    }
    return `[${global.NODE_ENV}] ${msg}`
  }

  // 取得呼叫 Slack API 的請求設定
  static #genBasicReqObj (param) {
    const {urlPath, qs, opt = {}} = param
    return {
      method: 'POST',
      uri: `https://slack.com/api/${urlPath}`,
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      qs: _.assign(qs, {token: Slacker.#slackToken}),
      ...opt,
    }
  }

  // 發送訊息
  static async #sendMsg ({msg, username = 'bi-bot', channel, attachments} = {}) {
    const qs = {channel, username, text: Slacker.#parseMsg(msg), attachments: JSON.stringify(attachments)}
    const options = Slacker.#genBasicReqObj({urlPath: 'chat.postMessage', qs})
    return rp(options)
  }

  // 發送訊息到通知頻道
  static async sendSysNotice ({msg}) {
    if (!global.IS_PROD_ENV) return // 需測試時可移除
    return Slacker.#sendMsg({msg, channel: Slacker.#channel})
  }
}

module.exports = Slacker
