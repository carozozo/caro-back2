// 放置 proj1-DB collection 的 where 建構
class Where {
  // 取得預設 where
  static #getDefWhere (query, defWhere) {
    const {_removeDisabled} = query
    if (_removeDisabled) delete defWhere.disabled
    return defWhere
  }

  static async userWhere (query = {}, dateRangeWhere) {
    const {name} = query
    const defWhere = Where.#getDefWhere(query, {disabled: false})

    return await ser.WhereBuilder.buildWhere(defWhere, async (where) => {
      if (!_.isUndefined(name)) where.name = ser.WhereBuilder.inArrOrIsRegex(name)
    }, dateRangeWhere)
  }
}

module.exports = Where
