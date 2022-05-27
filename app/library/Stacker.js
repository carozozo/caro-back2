// 堆疊任務執行管理
const EventEmitter = require('events')

class Stacker {
  static #emitter = new EventEmitter()
  static #infoGroups = {}

  // 取得指定群組下的所有任務資訊
  static #getTaskInfos (groupName) {
    return Stacker.#infoGroups[groupName]
  }

  // 取得秒數差
  static #getDiffSeconds (t) {
    return moment().diff(t) / 1000
  }

  // 檢查前置任務是否衝突
  static #validateDependency (param) {
    const {groupName, taskName, parents} = param
    const taskInfos = Stacker.#getTaskInfos(groupName)
    const grandparents = []

    if (_.isEmpty(parents)) return

    _.forEach(parents, (parent) => {
      const parentTaskInfo = _.find(taskInfos, (i) => i.taskName === parent)
      const {parents: parentParents, taskName: parentTaskName} = parentTaskInfo
      if (_.includes(parentParents, taskName)) throw new Error(`任務${taskName}和前置任務${parentTaskName}衝突`)
      grandparents.push(...parentParents)
    })
    Stacker.#validateDependency({groupName, taskName, parents: grandparents})
  }

  // 列印任務執行資訊
  static #logTask (description, {groupName, step, taskName, timeDiff}) {
    let msg = `${description} Stacker ${groupName} ${taskName}`
    if (step) msg = `[${step}] ${msg}`
    if (!_.isNil(timeDiff)) msg += ` (${timeDiff})`
    log.print(msg)
  }

  // 列印任務底下的項目執行資訊
  static #logEntry (description, {groupName, step, taskName, entryName, timeDiff}) {
    let msg = `${description} Stacker ${groupName} ${taskName}-${entryName}`
    if (step) msg = `[${step}] ${msg}`
    if (!_.isNil(timeDiff)) msg += ` (${timeDiff})`
    log.print(msg)
  }

  // 註冊任務
  static regTaskGroups (groupMap) {
    _.forEach(groupMap, (taskInfos, groupName) => {
      Stacker.#infoGroups[groupName] = taskInfos

      _.forEach(taskInfos, (taskInfo) => {
        const {taskName, parents} = taskInfo
        // 檢查相依性
        Stacker.#validateDependency({groupName, taskName, parents})
        // 收集所有每個任務的子任務名稱
        _.assign(taskInfo, {
          children: _.chain(taskInfos).filter((i) => _.includes(i.parents, taskName)).map('taskName').value(),
        })
      })
    })
  }

  // 執行任務底下的項目
  static async #runEntries (param) {
    const {taskInfo, entryName} = param
    const {groupName, taskName} = taskInfo
    let {entries} = taskInfo
    let gotErr = false

    if (entryName) {
      entries = _.pick(entries, [entryName])
      if (_.isEmpty(entries)) log.error(`Stacker 指定任務 ${taskName}-${entryName} 不存在`)
    }

    for (const entryName in entries) {
      const entry = entries[entryName]
      const logParam = _.assign(taskInfo, {entryName})

      Stacker.#logEntry('執行', logParam)

      const startTime = moment()
      try {
        await entry()
      } catch (e) {
        const errMsg = `Got error in stacker ${groupName} ${taskName} ${entryName}`
        await lib.Slacker.sendSysNotice({msg: [errMsg, e.message]})
        log.error(`${errMsg}\r\n`, e)
        gotErr = true
        throw e
      } finally {
        const timeDiff = Stacker.#getDiffSeconds(startTime)
        Stacker.#logEntry(gotErr ? '中斷' : '完畢', {timeDiff, ...logParam})
      }
    }
    return taskInfo
  }

  // 執行指定群組底下的特定任務
  static async #execTask (param) {
    const {taskInfo, entryName, description = '開始'} = param

    Stacker.#logTask(description, taskInfo)

    const startTime = moment()
    let gotErr = false

    try {
      await Stacker.#runEntries({taskInfo, entryName})
    } catch (e) {
      gotErr = true
    }

    const timeDiff = Stacker.#getDiffSeconds(startTime)
    Stacker.#logTask(gotErr ? '跳出' : '結束', _.assign(taskInfo, {timeDiff}))

    return {gotErr}
  }

  // 執行指定群組底下的任務列表
  static async execTasks (param) {
    const {
      groupName,
      taskName, // 只執行指定的任務
      entryName, // 只執行指定任務的子項目
    } = param
    const taskInfos = (() => {
      const infos = Stacker.#getTaskInfos(groupName)
      if (!taskName) return infos

      const taskInfo = _.find(infos, (t) => t.taskName === taskName)

      // 只執行指定的任務時, 將 taskInfo 中的前/後置任務清除
      delete taskInfo.parents
      delete taskInfo.children

      return [taskInfo]
    })()
    const beginTime = moment()
    const taskCount = _.size(taskInfos)
    const isSingleTask = taskCount <= 1

    const succeededTasks = []
    const failedTasks = []
    const skippedTasks = []

    Stacker.#emitter.removeAllListeners()

    log.print(`準備 Stacker ${groupName} 任務共 ${taskCount} 項`)

    const promises = []
    let step = 0
    for (const taskInfo of taskInfos) {
      const {taskName, parents, children} = taskInfo
      let retried = false
      let promise

      const finishTask = ({resolve}) => {
        resolve && resolve()
        // 觸發所有自己的後置任務
        _.forEach(children, (childTaskName) => {
          Stacker.#emitter.emit(childTaskName, {taskInfo})
        })
      }
      const runTask = ({resolve, isSkipped = false, description}) => {
        _.assign(taskInfo, {isSkipped})

        if (isSkipped) {
          skippedTasks.push(taskName)
          finishTask({resolve})
          return
        }

        Stacker.#execTask({taskInfo, entryName, description}).then(({gotErr}) => {
          // 第一次失敗時, 等待30分鐘後重新執行
          if (gotErr && !isSingleTask && !retried) {
            retried = true
            Stacker.#logTask(`等待重新執行`, taskInfo)
            setTimeout(() => {
              runTask({resolve, description: '重新開始'})
            }, 1800000)
            return
          }

          _.assign(taskInfo, {gotErr})

          if (gotErr) failedTasks.push(taskName)
          else succeededTasks.push(taskName)

          finishTask({resolve})
        })
      }

      _.assign(taskInfo, {step: ++step})

      // 無前置任務, 直接執行
      if (_.isEmpty(parents)) {
        promise = new Promise((resolve) => {
          runTask({resolve})
        })
        promises.push(promise)
        continue
      }

      // 等待前置執行結束後觸發
      promise = new Promise((resolve) => {
        Stacker.#emitter.on(taskName, (parentResult) => { // 監聽自己的任務名稱
          const {
            taskInfo: {taskName, step, gotErr: parentGotErr, isSkipped: parentIsSkipped},
          } = parentResult
          if (parentGotErr) {
            Stacker.#logTask(`因前置任務 [${step}] ${taskName} 發生錯誤 -> 跳過`, taskInfo)
            return runTask({resolve, isSkipped: true})
          }
          if (parentIsSkipped) {
            Stacker.#logTask(`因前置任務 [${step}] ${taskName} 跳過 -> 跳過`, taskInfo)
            return runTask({resolve, isSkipped: true})
          }
          const doneParentTasks = _.intersection(succeededTasks, parents)
          if (doneParentTasks.length < parents.length) return
          runTask({resolve}) // 所有前置任務都執行完畢, 才執行本身的任務
        })
      })
      promises.push(promise)
    }
    await Promise.all(promises)

    const succeededTaskCount = _.size(succeededTasks)
    const failedTaskCount = _.size(failedTasks)
    const skippedTaskCount = _.size(skippedTasks)
    const timeDiff = Stacker.#getDiffSeconds(beginTime)
    log.print([
      `完成 Stacker ${groupName} 任務 (${timeDiff})`,
      `總共: ${taskCount} , 成功: ${succeededTaskCount}, 失敗: ${failedTaskCount}, 跳過: ${skippedTaskCount}`,
    ].join('\n '))
  }
}

module.exports = Stacker
