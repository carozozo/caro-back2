class BaseCtrl extends ser.Ctrl {
  constructor (req) {
    super(req, {skipValidationRouteCodes: ['post_login', 'post_signup', 'post_getMyInfo']})
  }

  async $middle () {
    await this.$validateReqUserRole([
      'post_createOne', 'post_resetPwdById', 'post_deleteOneById',
      'post_getList', 'post_getCount', 'post_getOneById', 'post_getRoleMap',
    ], {includes: ['admin']})
  }

  async getTitleMap (map = {}) {
    return {
      '姓名': 'name',
      '帳號': 'accountName',
      '身份': 'role',
      '建立': 'createdAt',
      '開通': 'validAt',
      '停用': 'disabledAt',
      ...map,
    }
  }

  async getBasicPipe (pipe = []) {
    const param = this.$getParam()
    const where = await ser0.Where.accountWhere(param, param)
    return [
      lib.Query.getMatch(where),
      ...pipe,
    ]
  }

  async getPipe (paginate = true, pipe = []) {
    const pageParam = this.$getPageParam(paginate)
    return lib.Query.getPipeline(await this.getBasicPipe(), pageParam, [
      lib.Query.getAddFields({
        createdAt: {_$toTwTimeStr: true},
        disabled: {_$toChineseBool: true},
      }),
      ...pipe,
    ])
  }

  async getCountPipe () {
    return this.getBasicPipe([lib.Query.getCount()])
  }
}

class AccountCtrl extends BaseCtrl {
  async _logout () {
    await this.$setAccount()
    return this.$res.getClientInfo()
  }

  async _execMethod () {
    const reqUser = this.$req.user
    const param = this.$getParam()
    const method = param.method
    const args = param.args || []
    return reqUser[method].apply(reqUser, args)
  }

  async _updateOneById () {
    const param = this.$getParam()

    const {_id, name, checkPwd, pwd} = param

    if (!name) throw lib.ResWarning.genMsg('請填寫姓名')
    if ((pwd || checkPwd) && pwd !== checkPwd) throw lib.ResWarning.genMsg('密碼和確認密碼不相同')

    const account = await ser0.Account.updateOneById(_id, param)
    return {account}
  }

  // 以下需要 admin 身份

  async _createOne () {
    const param = this.$getParam()
    const {name, accountName} = param

    if (!name) throw lib.ResWarning.genMsg(`姓名必填`)
    if (!accountName) throw lib.ResWarning.genMsg(`帳號必填`)
    if (await db0.Account.countDocuments({accountName}) > 0) throw lib.ResWarning.genMsg(`帳號 ${accountName} 已存在`)

    const account = await ser0.Account.createAccount(param)
    return {account}
  }

  async _getList () {
    const titleMap = await this.getTitleMap()
    const pipe = await this.getPipe()
    const cursor = db0.Account.aggregate(pipe)
    const infos = await lib.Query.cursorMap(cursor, (result) => {
      const {disabled, operationLogs = []} = result

      const validLog = _.findLast(operationLogs, (l) => l.action === 'changeRole' && l.role !== ser0.Account.defRole)
      const validAt = lib.Unit.toTwTimeStr(_.get(validLog, 'actionTime'))

      const disableLog = disabled && _.findLast(operationLogs, (l) => l.action === 'disable')
      const disabledAt = lib.Unit.toTwTimeStr(_.get(disableLog, 'actionTime'))

      return _.assign(result, {validAt, disabledAt})
    })
    return {titleMap, infos}
  }

  async _getCount () {
    const pipe = await this.getCountPipe()
    return (await db0.Account.aggregate(pipe).next() || {count: 0})
  }

  async _getOneById () {
    const param = this.$getParam()
    const _id = lib.Mongo.toObjectId(param._id)
    const account = await db0.Account.findOne({_id})
    if (!account) throw lib.ResWarning.genMsg(`帳號不存在`)
    return {account}
  }

  async _getRoleMap () {
    return {roleMap: ser0.Account.roleMap}
  }

  async _resetPwdById () {
    const {_id} = this.$getParam()
    const account = await ser0.Account.updateOneById(_id, {pwd: true})
    return {account}
  }

  async _deleteOneById () {
    const {account} = await this._getOneById()
    if (_.get(account, 'accountName') === ser0.Account.defAdminName) throw lib.ResWarning.genMsg(`無法刪除 admin`)

    const {_id} = this.$getParam()
    await ser0.Account.deleteAccountById(_id)
    return {account}
  }

  // 以下不需登入

  async _login () {
    const {accountName, pwd} = this.$getParam()

    if (!accountName || !pwd) throw lib.ResWarning.genMsg(`請輸入帳號密碼`)

    const account = await db0.Account.findOne({accountName})
    if (!account) throw lib.ResWarning.genMsg(`帳號 ${accountName} 不存在`)
    if (ser0.Account.isDisabledAccount(account)) throw lib.ResWarning.genMsg(`帳號 ${accountName} 已停用`)

    const isSamePwd = await ser0.Account.checkPwd(pwd, account.pwd)
    if (!isSamePwd) throw lib.ResWarning.genMsg(`密碼不正確`)

    await this.$setAccount(account)
    const pageQueryParam = await this.$req.getPageQueryParam()
    return this.$res.getClientInfo(pageQueryParam)
  }

  async _signup () {
    const {pwd, checkPwd} = this.$getParam()
    if (_.size(pwd) < 5) throw lib.ResWarning.genMsg(`密碼最少五位數`)
    if (checkPwd && pwd !== checkPwd) throw lib.ResWarning.genMsg('密碼和確認密碼不相同')

    const {account} = await this._createOne()
    await this.$setAccount(account)
    const pageQueryParam = await this.$req.getPageQueryParam()
    return this.$res.getClientInfo(pageQueryParam)
  }

  async _getMyInfo () {
    const param = this.$getParam()
    return this.$res.getClientInfo(param)
  }
}

module.exports = AccountCtrl
