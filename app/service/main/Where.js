// 放置 main-DB collection 的 where 建構
class Where {
  // 取得預設 where
  static #getDefWhere (query, defWhere) {
    const {_removeDisabled} = query
    if (_removeDisabled) delete defWhere.disabled
    return defWhere
  }

  static async accountWhere (query = {}, dateRangeWhere) {
    const {accountName, name, role, disabled} = query
    const defWhere = Where.#getDefWhere(query, {})

    return await ser.WhereBuilder.buildWhere(defWhere, async (where) => {
      if (!_.isUndefined(accountName)) where.accountName = ser.WhereBuilder.inArrOrIsRegex(accountName)
      if (!_.isUndefined(name)) where.name = ser.WhereBuilder.inArrOrIsRegex(name)
      if (!_.isUndefined(role)) where.role = ser.WhereBuilder.inArr(role)
      if (!_.isUndefined(disabled)) where.disabled = ser.WhereBuilder.toBool(disabled)
    }, dateRangeWhere)
  }
}

module.exports = Where
