// 定義 global 變數
const fs = require('fs')
const path = require('path')
const _ = require('lodash')
const moment = require(`moment`)
const projectPath = path.join(__dirname, '../../')

// 讀取資料夾中的檔案
const readDir = (fileOrDir, cb, {maxLevel = 0, _levelCount = 0} = {}) => {
  fileOrDir = path.relative(`./`, fileOrDir)
  if (!fs.existsSync(fileOrDir)) return

  const stat = fs.statSync(fileOrDir)
  if (stat.isFile() && fileOrDir.endsWith(`.js`)) {
    cb(fileOrDir)
  }
  if (stat.isDirectory()) {
    if (maxLevel > 0 && ++_levelCount > maxLevel) return
    const fileArr = fs.readdirSync(fileOrDir)
    _.forEach(fileArr, (file) => {
      const filePath = path.join(fileOrDir, file)
      readDir(filePath, cb, {maxLevel, _levelCount})
    })
  }
}
// 取得路徑檔名
const getFilenameFromPath = (filePath, {folderLayer = 0, includeExtname = false} = {}) => {
  const arr = []
  if (folderLayer > 0) {
    const dirPath = path.dirname(filePath)
    const dirArr = dirPath.split('/')
    arr.push(dirArr.slice(-folderLayer))
  }

  const ext = includeExtname ? '' : path.extname(filePath)
  const filename = path.basename(filePath, ext)
  arr.push(filename)
  return arr.join('/')
}
// 移除 DB 連線
const disconnectDb = async () => {
  await ser.MainDb.close()
}

module.exports = async () => {
  global._ = _
  global.moment = moment
  global.lib = {} // library 函式庫
  global.ser = {} // common 服務函式
  global.ser0 = {} // main 服務函式
  global.ser1 = {} // proj1 服務函式
  global.db0 = {} // main DB
  global.db1 = {} // proj1 DB
  global.log = {
    _getNowStr: () => {
      const STACK_REGEX = /at\s+(.*)\s+\((.*):(\d*):(\d*)\)/i
      const STACK_REGEX2 = /at\s+()(.*):(\d*):(\d*)/i
      const stackList = (new Error()).stack.split('\n').slice(3)
      const s = stackList[0]
      const sp = STACK_REGEX.exec(s) || STACK_REGEX2.exec(s)

      const filePath = sp[2] // 觸發的檔案路徑
      const codeLine = sp[3]
      const codePosition = sp[4]
      const filename = filePath.replace(global.PROJECT_PATH, '')
      return `<${moment().utcOffset('+0800').format(`YYYY-MM-DD HH:mm:ss.SSSZ`)}> ${filename}:${codeLine}:${codePosition}\n`
    },
    print: (...args) => {
      const now = global.log._getNowStr()
      args.unshift(now)
      console.log.apply(null, args)
    },
    json: (...args) => {
      _.forEach(args, (arg, i) => {
        if (!_.isPlainObject(arg) && !_.isArray(arg)) return
        args[i] = JSON.stringify(arg, null, 2)
      })
      const now = global.log._getNowStr()
      args.unshift(now)
      console.log.apply(null, args)
    },
    error: (...args) => {
      const now = global.log._getNowStr()
      args.unshift(now)
      console.error.apply(null, args)
    },
    // 方便 debug 用, 可用在迴圈中指定最多要列印幾次
    once: (maxCount, ...args) => {
      let lockCount = this.lockCount || 0
      this.lockCount = ++lockCount
      if (lockCount > maxCount) return
      args.unshift(`(${lockCount})\n`)
      global.log.print.apply(global.log, args)
    },
  }
  global.PROJECT_PATH = projectPath
  global.TEMP_DIR_PATH = `${projectPath}/temp`
  global.readDir = readDir
  global.getFilenameFromPath = getFilenameFromPath
  global.disconnectDb = disconnectDb

  // 以下由 ecosystem.config.js 傳入
  global.NODE_ENV = process.env.NODE_ENV
  global.APP_PORT = process.env.APP_PORT
  global.ROUTE_ROOT = process.env.ROUTE_ROOT
  global.USE_APP_SCHEDULER = process.env.USE_APP_SCHEDULER === 'true'
  global.IS_LOGIN_MODE = process.env.IS_LOGIN_MODE === 'true'
  global.IS_PROD_ENV = process.env.NODE_ENV === 'prod'

  // 以下由 package.json 代入 for cron job
  global.JOB_NAME = process.env.JOB_NAME
  global.ITEM_NAME = process.env.ITEM_NAME

  // 以下由 package.json 代入 for stacker task
  global.GROUP_NAME = process.env.GROUP_NAME
  global.TASK_NAME = process.env.TASK_NAME
  global.ENTRY_NAME = process.env.ENTRY_NAME

  // load library
  readDir(`app/library`, (file) => {
    const fileName = getFilenameFromPath(file)
    lib[fileName] = require(file)
  })

  // load common service
  readDir(`app/service`, (file) => {
    const fileName = getFilenameFromPath(file)
    ser[fileName] = require(file)
  }, {maxLevel: 1})
  // load main service
  readDir(`app/service/main`, (file) => {
    const fileName = getFilenameFromPath(file)
    ser0[fileName] = require(file)
  })
  // load proj1 service
  readDir(`app/service/proj1`, (file) => {
    const fileName = getFilenameFromPath(file)
    ser1[fileName] = require(file)
  })
}
