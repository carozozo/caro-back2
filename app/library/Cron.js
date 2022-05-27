// 提供 node-cron 客製化操作服務
class Cron {
  static #jobInfos = []

  static #getDiffSeconds (t) {
    return moment().diff(t) / 1000
  }

  static #logItem (param) {
    const {description, jobName, itemName, timeDiff} = param
    let msg = `${description} CronJobItem-${jobName}-${itemName}`
    if (!_.isNil(timeDiff)) msg += ` (${timeDiff})`
    log.print(msg)
  }

  static #logJob (param) {
    const {description, jobName, syntax, timeDiff} = param
    let msg = `${description} CronJob-${jobName} [${syntax}]`
    if (timeDiff) msg += ` (${timeDiff})`
    log.print(msg)
  }

  // 取得排程的排序分數
  static #getSyntaxSortScore (param) {
    const {syntax} = param
    const unitArr = syntax.split(` `)
    while (unitArr.length < 6) unitArr.unshift('0')

    let score = 0
    for (let i = 0; i < unitArr.length; i++) {
      const unit = unitArr[i]
      const num = Number(unit) || 0
      score += num * i * Math.pow(100, i)
    }
    return score
  }

  // 執行 job 中的每個 item, 有 specifiedItemName 時只執行指定的 item
  static async #execItems (param) {
    const {jobInfo, specifiedItemName} = param
    const {jobName, items} = jobInfo
    let gotErr

    for (const itemName in items) {
      if (specifiedItemName && specifiedItemName !== itemName) continue
      if (gotErr) break

      const item = items[itemName]

      Cron.#logItem({description: '執行', itemName, ...jobInfo})

      const startTime = moment()
      try {
        await item()
      } catch (e) {
        const errMsg = `Got error in cron ${jobName} ${itemName}`
        await lib.Slacker.sendSysNotice({msg: [errMsg, e.message]})
        log.error(`${errMsg}\r\n`, e)
        gotErr = e
      }

      const timeDiff = Cron.#getDiffSeconds(startTime)
      Cron.#logItem({description: gotErr ? '中斷' : '完畢', itemName, timeDiff, ...jobInfo})
    }
    return gotErr
  }

  // 執行 job
  static async #execJob (param) {
    const {jobInfo, specifiedItemName} = param

    Cron.#logJob({description: '開始', ...jobInfo})

    const startTime = moment()
    const gotErr = await Cron.#execItems({jobInfo, specifiedItemName})

    const timeDiff = Cron.#getDiffSeconds(startTime)
    Cron.#logJob({description: gotErr ? '跳出' : '結束', timeDiff, ...jobInfo})
  }

  // 把註冊的任務排到 schedule
  static async schedule () {
    const cron = require(`node-cron`)
    const jobInfos = _.sortBy(Cron.#jobInfos, 'score')

    for (const jobInfo of jobInfos) {
      const {jobName, syntax, opt} = jobInfo

      // 重新包裝要執行的 fn
      let isRunning = false
      const newJob = async () => {
        if (isRunning) { // 上個 task 還在執行中
          return Cron.#logJob({description: '跳過', ...jobInfo})
        }

        isRunning = true
        await Cron.#execJob({jobInfo})
        isRunning = false
      }
      log.print('Scheduling Job:', syntax, jobName)
      cron.schedule(syntax, newJob, opt)
    }
    return this
  }

  // 執行指定的 job
  static async execJob (param) {
    const {jobName, specifiedItemName} = param
    const jobInfo = _.find(Cron.#jobInfos, (info) => info.jobName === jobName)
    if (!jobInfo) return log.error('找不到 job:', jobName)
    await Cron.#execJob({jobInfo, specifiedItemName})
  }

  // 註冊 job
  static async regJob (param) {
    const cron = require('node-cron')
    let {
      jobName, // 工作名稱
      syntax, // 排程時間
      items, // 工作中所有的執行項目; e.g. {項目1: async() => {}, 項目2: async() => {}, ....}
      opt = {}, // node-cron 的 options
    } = param

    opt = _.assign({timezone: 'Asia/Taipei'}, opt) // 設置預設時區

    if (!jobName) throw Error(`請輸入 jobName`)
    if (_.find(Cron.#jobInfos, (info) => info.job === jobName)) throw Error(`Cron [${jobName}] 已被註冊`)
    if (!cron.validate(syntax)) throw Error(`時間格式不正確`)

    for (const itemName in items) {
      const fn = items[itemName]
      if (!_.isFunction(fn)) throw Error(`請輸入要執行的 function`)
    }

    const score = Cron.#getSyntaxSortScore({syntax})
    const info = {jobName, syntax, items, opt, score}
    Cron.#jobInfos.push(info)
  }
}

module.exports = Cron
