// request user 實作
class ReqUser {
  constructor (account) {
    this.#_id = account._id
    this.#accountName = account.accountName
    this.#name = account.name
    this.#role = account.role
  }

  #_id = null
  #accountName = ''
  #name = ''
  #role = ''

  get _id () {
    return this.#_id
  }

  get accountName () {
    return this.#accountName
  }

  get name () {
    return this.#name
  }

  get role () {
    return this.#role
  }

  // 訪客
  isGuest () {
    return ['guest'].includes(this.role)
  }

  // 一般用戶
  isGeneralUser () {
    return ['general'].includes(this.role)
  }

  // 管理者
  isAdmin () {
    return ['admin'].includes(this.role)
  }
}

module.exports = ReqUser
