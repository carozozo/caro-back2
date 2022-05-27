// MongoDb 建構 Where 相關的函式
class WhereBuilder {
  // 判斷 arg 是否為基本的 query 參數
  static #isBasicArg (arg) {
    return _.isPlainObject(arg) || _.isNull(arg)
  }

  static toInt (arg) {
    if (WhereBuilder.#isBasicArg(arg) || _.isInteger(arg)) return arg
    return _.toInteger(arg)
  }

  static toNum (arg) {
    if (WhereBuilder.#isBasicArg(arg) || _.isNumber(arg)) return arg
    return _.toNumber(arg)
  }

  static toStr (arg) {
    if (WhereBuilder.#isBasicArg(arg) || _.isString(arg)) return arg
    return _.toString(arg)
  }

  static toBool (arg) {
    if (WhereBuilder.#isBasicArg(arg) || _.isBoolean(arg)) return arg
    if (_.isString(arg) && (arg = arg.toLowerCase())) {
      if (['true', 'false'].includes(arg)) return arg === 'true'
    }
    return false
  }

  static isRegex (arg) {
    if (WhereBuilder.#isBasicArg(arg)) return arg
    return {$regex: lib.Unit.escapeRegEx(_.toString(arg))}
  }

  static inArr (arg) {
    if (WhereBuilder.#isBasicArg(arg)) return arg
    if (!_.isArray(arg)) arg = [arg]
    return {$in: arg}
  }

  static notInArr (arg) {
    if (WhereBuilder.#isBasicArg(arg)) return arg
    if (!_.isArray(arg)) arg = [arg]
    return {$nin: arg}
  }

  static inIds (arg) {
    if (WhereBuilder.#isBasicArg(arg)) return arg
    return {$in: lib.Mongo.toObjectIdArr(arg)}
  }

  static inArrOrIsRegex (arg) {
    if (WhereBuilder.#isBasicArg(arg)) return arg
    if (_.isArray(arg)) return WhereBuilder.inArr(arg)

    const arr = lib.Unit.strToArr(_.toString(arg))
    if (arr.length > 1) return WhereBuilder.inArr(arr) // e.g. 'name1, name2' => 搜尋 {$in: ['name1', 'name2']}
    return WhereBuilder.isRegex(arg) // e.g. 'name' => 搜尋 {$regex: 'name'}
  }

  static isExists (arg) {
    if (WhereBuilder.#isBasicArg(arg)) return arg
    return {[arg ? '$nin' : '$in']: [null, '']}
  }

  static isLess (arg, includeEqual) {
    const key = includeEqual ? '$lte' : '$lt'
    return {[key]: arg}
  }

  static isGreater (arg, includeEqual) {
    const key = includeEqual ? '$gte' : '$gt'
    return {[key]: arg}
  }

  static doesOrNotInArr (bool, arr) {
    return bool ? {$in: arr} : {$nin: arr}
  }

  // 設置日期區間範圍到 where
  static setDateRangeToWhere (where = {}, opt = {}) {
    const {key = 'createdAt', startMoment, startExMoment, endMoment, endExMoment} = opt

    if (!startMoment && !startExMoment && !endMoment && !endExMoment) return where

    where[key] = where[key] || {}
    if (startMoment) {
      where[key].$gte = moment(startMoment).utc().toDate()
    } else if (startExMoment) {
      where[key].$gt = moment(startMoment).utc().toDate()
    }
    if (endMoment) {
      where[key].$lte = moment(endMoment).utc().toDate()
    } else if (endExMoment) {
      where[key].$lt = moment(endExMoment).utc().toDate()
    }
    return where
  }

  // 建構 where 條件 for 日期包含/不包含指定時間
  static setDateIncludeSpecTimeToWhere (where, {
    specTime = Date.now(), // 要判斷的指定時間
    isInclude = true, // 是否包含指定時間
    fieldOfStart, // where 的起始時間欄位
    fieldOfEnd, // where 的結束時間欄位
    isStartNull = true, // 是否判斷起始時間欄位不存在 for isInclude = true
    isEndNull = true, // 是否判斷結束時間欄位不存在 for isInclude = true
  }) {
    if (!fieldOfStart && !fieldOfEnd) throw new Error(`fieldOfStart or fieldOfEnd is required`)
    let $or = []

    // 處理 [時間區間包含指定的時間]
    if (isInclude) {
      const $and = []

      if (fieldOfStart) {
        $or = [{[fieldOfStart]: {$lte: specTime}}]
        if (isStartNull) $or.push({[fieldOfStart]: null})
        $and.push({$or})
      }
      if (fieldOfEnd) {
        $or = [{[fieldOfEnd]: {$gte: specTime}}]
        if (isEndNull) $or.push({[fieldOfEnd]: null})
        $and.push({$or})
      }

      if (where.$and) where.$and.push(...$and)
      else where.$and = $and
      return where
    }

    // 處理 [時間區間不包含指定的時間]
    if (fieldOfStart) $or.push({[fieldOfStart]: {$gt: specTime}}) // 指定時間之後才開始
    if (fieldOfEnd) $or.push({[fieldOfEnd]: {$lt: specTime}}) // 指定時間之前就結束

    if (where.$or) {
      where.$and = [
        {$or: where.$or},
        {$or},
      ]
      delete where.$or
    } else where.$or = $or
    return where
  }

  // 建構 where for ser1.Where and ser2.Where
  static async buildWhere (defWhere, cb, dateRangeWhere = {}) {
    let where = {}

    await cb(where)

    where = _.assign(defWhere, where)

    _.forEach(where, (val, key) => {
      if (_.isString(val)) where[key] = _.trim(val)
    })

    // Note. dateRangeWhere 為動態參數, examples:
    // {createdAt_$start: 'xxx'} => where.createdAt = {$gte: date('xxx')}
    // {createdAt_$startEx: 'xxx'} => where.createdAt = {$gt: date('xxx')}
    // {createdAt_$end: 'xxx'} => where.createdAt = {$lte: date('xxx')}
    // {createdAt_$endEx: 'xxx'} => where.createdAt = {$lt: date('xxx')}
    _.forEach(dateRangeWhere, (val, key) => {
      if (!val) return

      const mainKeys = ['_$startEx', '_$start', '_$endEx', '_$end'] // Note. 注意值的順序, 避免下面 replace 發生錯置
      if (!_.some(mainKeys, (k) => key.endsWith(k))) return

      const rangeField = _.reduce(mainKeys, (result, k) => {
        return result.replace(k, '')
      }, key)

      const momentKey = key.replace(`${rangeField}_$`, '')
      WhereBuilder.setDateRangeToWhere(where, {
        key: rangeField,
        [`${momentKey}Moment`]: val,
      })
    })
    return where
  }

  // 設置座標點距離內的搜尋 for query
  static setSearchNearSphereLocByGps (where, {lng, lat, locPathOfWhere = `loc`, geometryType = `Point`, maxKm, minKm}) {
    lng = Number(lng)
    lat = Number(lat)

    where[locPathOfWhere] = {
      $nearSphere: {
        $geometry: {
          type: geometryType,
          coordinates: [lng, lat],
        },
      },
    }
    if (maxKm) where[locPathOfWhere].$nearSphere.$maxDistance = Number(maxKm) * 1000
    if (minKm) where[locPathOfWhere].$nearSphere.$minDistance = Number(minKm) * 1000
    return where
  }
}

module.exports = WhereBuilder
