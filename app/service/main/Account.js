// 處理此專案的用戶 in main-DB
const bcrypt = require('bcrypt')

class Account {
  static $initCollectionInfo = {
    globalSet: 'db0',
    cb: async () => {
      // 初始化管理者
      const {defAdminName} = Account
      const query = {accountName: defAdminName, role: 'admin'}
      if (await db0.Account.countDocuments(query) > 0) return
      await Account.createAccount({...query, pwd: 'xxx123'})
    },
  }

  // 預設建立的管理者名稱
  static get defAdminName () {
    return 'admin'
  }

  // 預設身份配對表
  static get defRoleMap () {
    return {guest: '訪客'}
  }

  // 預設身份
  static get defRole () {
    return _.keys(Account.defRoleMap)[0]
  }

  // 身份配對列表
  static get roleMap () {
    return {
      ...Account.defRoleMap,
      general: '一般用戶',
      admin: '管理者',
    }
  }

  // 身份列表
  static get roles () {
    return _.keys(Account.roleMap)
  }

  // 取得加密後的密碼
  static #getSaltedPwd (pwd) {
    const originalPwd = pwd || lib.Unit.randomStr()
    const salt = bcrypt.genSaltSync(1)
    return {
      originalPwd,
      saltedPwd: bcrypt.hashSync(originalPwd, salt),
    }
  }

  // 建立帳號
  static async createAccount (param) {
    let {accountName, pwd, name, role = Account.defRole} = param

    accountName = lib.Unit.valToString(accountName)
    pwd = lib.Unit.valToString(pwd)
    name = lib.Unit.valToString(name)
    role = lib.Unit.valToString(role)

    if (!accountName) throw Error(`accountName is required`)
    if (await db0.Account.countDocuments({accountName}) > 0) throw Error(`account ${accountName} exists`)
    if (!Account.roles.includes(role)) throw Error(`role muse be ${Account.roles}`)

    const operationLogs = []
    const createdAt = new Date()
    const disabled = false
    const {originalPwd, saltedPwd} = Account.#getSaltedPwd(pwd)

    name = name || accountName

    const result = await db0.Account.insertOne({
      accountName, pwd: saltedPwd, name, role, operationLogs, createdAt, disabled,
    })
    const account = result.ops[0]
    account.pwd = originalPwd
    return account
  }

  // 更新帳號
  static async updateOneById (_id, param) {
    if (!_id) throw Error(`_id is required`)
    _id = lib.Mongo.toObjectId(_id)

    let {pwd, role, name, disabled} = param

    pwd = pwd === true ? pwd : lib.Unit.valToString(pwd)
    role = lib.Unit.valToString(role)
    name = lib.Unit.valToString(name)

    const $set = {}
    let operationLog
    let originalPwd = ''

    const account = await db0.Account.findOne({_id})
    const originalRole = account.role

    if (pwd) {
      if (pwd === true) pwd = undefined // 當 pwd 是 true => 重置密碼
      const {originalPwd: oriPwd, saltedPwd} = Account.#getSaltedPwd(pwd)
      _.assign($set, {pwd: saltedPwd})
      originalPwd = oriPwd
    }

    if (name && name !== account.name) {
      _.assign($set, {name})
    }

    // 設置操作紀錄
    if (_.isBoolean(disabled) && disabled !== account.disabled) { // 設置停用/啟用紀錄
      const action = disabled ? 'disable' : 'enable'
      _.assign($set, {disabled})

      operationLog = {
        action,
        actionTime: new Date(),
      }
    } else if (role && role !== account.role) { // 設置身份轉換紀錄
      if (!Account.roles.includes(role)) throw Error(`role muse be ${Account.roles}`)
      _.assign($set, {role})

      operationLog = {
        action: 'changeRole',
        actionTime: new Date(),
        originalRole,
        role,
      }
    }

    if (_.isEmpty($set)) throw Error(`$set is empty while updating account: ${_id}`)

    const update = {$set}
    if (operationLog) _.assign(update, {$push: {operationLogs: operationLog}})

    const result = await db0.Account.findOneAndUpdate({_id}, update, {returnOriginal: false})
    return _.assign(result.value, {pwd: originalPwd})
  }

  // 移除帳號
  static async deleteAccountById (_id) {
    if (!_id) throw  Error(`_id is required`)
    _id = lib.Mongo.toObjectId(_id)
    return db0.Account.deleteOne({_id})
  }

  // 檢查密碼
  static async checkPwd (pwd, sailedPwd) {
    pwd = lib.Unit.valToString(pwd)
    return bcrypt.compareSync(pwd, sailedPwd)
  }

  // 帳號是否停用
  static isDisabledAccount (account) {
    if (!account) throw  Error(`account is empty`)
    return account.disabled
  }

  // 取得身份中文名稱
  static getRoleChineseName (role) {
    return Account.roleMap[role]
  }
}

module.exports = Account
