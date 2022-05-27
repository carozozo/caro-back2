// 轉換規格設定專用函式 for pipeline
class SpecTransformer {
  // 檢查是否為支持的 specType
  static #validateSupportSpecType (fnName, supportTypes, specType) {
    if (_.isString(supportTypes)) supportTypes = [supportTypes]
    if (!_.includes(supportTypes, specType)) throw Error(`${fnName} does not support  ${specType}`)
  }

  // 遞迴轉換 spec
  static #recursiveTrans (opt) {
    const {
      spec,
      specType,
      field,
      arg,
    } = opt

    if (!(_.isPlainObject(arg) || _.isArray(arg))) return spec

    let newSpec
    _.forEach(arg, (pa, fi) => {
      if (!_.isFunction(SpecTransformer[fi])) {
        spec[field] = SpecTransformer.#recursiveTrans({spec: arg, specType, field: fi, arg: pa})
        return
      }

      // 特殊參數轉換
      if (_.includes(['_$project', '_$mapProj'], fi)) {
        // 如果傳入的參數物件沒有 _$spec => 轉換參數給函式使用
        if (_.isPlainObject(pa) && !pa._$spec) pa = {_$spec: pa}
      }

      // 通用參數轉換
      if (_.isString(pa)) pa = {input: pa} // 字串 => 輸入值為呼叫方指定
      else if (pa === true) pa = {input: `$${field}`} // true => 輸入值為欄位值
      else if (!_.isPlainObject(pa)) throw Error('Not valid spec-arg type')

      pa = _.assign({input: `$${field}`}, pa, {spec, specType, field})

      newSpec = SpecTransformer[fi](pa)
      if (!newSpec) return false

      _.forEach(newSpec, (p, f) => {
        SpecTransformer.#recursiveTrans({spec: newSpec, specType, field: f, arg: p})
      })
      spec[field] = newSpec
    })
    return spec
  }

  // 轉換物件內容
  static _$project (arg) {
    let {
      specType,
      input,
      _$spec,
      simpleProject = true, // 是否為簡化輸入規格
      isTrim = true, // 是否只取得指定的欄位 for $addFields
    } = arg

    SpecTransformer.#validateSupportSpecType('_$project', 'addFields', specType)

    _$spec = _.reduce(_$spec, (r, v, k) => {
      if (simpleProject && v === 1) v = `${input}.${k}`
      _.set(r, k, v)
      return r
    }, {})

    if (!isTrim) return _$spec

    // 利用 $arrayElemAt 重新取得一個全新的 object, 而不是將新欄位覆蓋到原本的 object 上
    return {$cond: [input, {$arrayElemAt: [[_$spec], 0]}, null]}
  }

  // 轉換陣列內容
  static _$mapProj (arg) {
    let {input} = arg

    return {
      $map: {
        input,
        as: 'f',
        in: SpecTransformer._$project(_.assign(arg, {input: '$$f'})),
      },
    }
  }

  // 轉為台灣時區時間字串
  static _$toTwTimeStr (arg) {
    let {input, format = 'dateTime'} = arg

    if (format === `dateTime`) format = `%Y-%m-%d %H:%M:%S`
    else if (format === `date`) format = `%Y-%m-%d`
    else if (format === `time`) format = `%H:%M:%S`
    else if (format === `year`) format = `%Y`
    else if (format === `month`) format = `%m`
    else if (format === `day`) format = `%d`

    return {$dateToString: {format, date: input, timezone: '+08', onNull: ''}}
  }

  // 轉為中文的布林值
  static _$toChineseBool (arg) {
    const {input} = arg
    return {$cond: [input, '是', '否']}
  }

  // 轉為中文的有無
  static _$toChineseHave (arg) {
    const {input} = arg
    return {$cond: [input, '有', '無']}
  }

  // 空值轉為布林值
  static _$emptyToBool (arg) {
    const {input, emptyValues = ['', 'null', null]} = arg
    return {$cond: [{$in: [{$toString: input}, emptyValues]}, false, true]}
  }

  // 將是空值的欄位一律轉為 null
  static _$emptyToNull (arg) {
    const {input, emptyValues = ['', 'null', null]} = arg
    return {$cond: [{$in: [{$toString: input}, emptyValues]}, null, input]}
  }

  // 將是空值的欄位一律轉為空字串
  static _$emptyToStr (arg) {
    const {input, emptyValues = ['', 'null', null]} = arg
    return {$cond: [{$in: [{$toString: input}, emptyValues]}, '', input]}
  }

  // 陣列組成字串
  static _$arrToStr (arg) {
    const {input, joiner = ','} = arg
    return {
      $reduce: {
        input,
        initialValue: '',
        in: {
          $concat: ['$$value', {$cond: [{$eq: ['$$value', '']}, '', joiner]}, {$toString: '$$this'}],
        },
      },
    }
  }

  // 取得陣列第一筆資料
  static _$first (arg) {
    const {input} = arg
    return {
      $arrayElemAt: [input, 0],
    }
  }

  // 輸出陣列組成字串資訊
  static _$outputArrToStr (arg) {
    const {spec, field, input} = arg
    _.assign(spec, {
      [field]: input,
      [`${field}_str`]: SpecTransformer._$arrToStr({input, joiner: '\n'}),
      [`${field}_html`]: SpecTransformer._$arrToStr({input, joiner: '<br/>'}),
    })
  }

  // 根據配對表轉換內容
  static _$mappingVal (arg) {
    const {input, mapping, defVal = ''} = arg
    return {
      $switch: {
        branches: _.reduce(mapping, (r, v, k) => {
          r.push({case: {$eq: [input, k]}, then: v})
          return r
        }, []),
        default: defVal,
      },
    }
  }

  // 根據配對表轉換陣列內容
  static _$mappingValArr (arg) {
    const {input} = arg
    return {
      $map: {
        input,
        as: 'f',
        in: SpecTransformer._$mappingVal(_.assign(arg, {input: '$$f'})),
      },
    }
  }

  // 透過 $eq 過濾陣列
  static _$filterByEq (arg) {
    const {input, path, val} = arg
    const value = path ? `$$f.${path}` : '$$f'
    return {$filter: {input, as: 'f', cond: {$eq: [value, val]}}}
  }

  // 透過 $ne 過濾陣列
  static _$filterByNe (arg) {
    const {input, path, val} = arg
    const value = path ? `$$f.${path}` : '$$f'
    return {$filter: {input, as: 'f', cond: {$ne: [value, val]}}}
  }

  // 過濾出是 true 的項目
  static _$filterTrue (arg) {
    return SpecTransformer._$filterByEq(_.assign(arg, {val: true}))
  }

  // 過濾出是 false 的項目
  static _$filterFalse (arg) {
    return SpecTransformer._$filterByEq(_.assign(arg, {val: false}))
  }

  // 過濾出是空值的項目
  static _$filterEmpty (arg) {
    const {input, path, emptyValues = ['', 'null', null]} = arg
    const val = path ? `$$f.${path}` : '$$f'
    return {
      $filter: {
        input,
        as: 'f',
        cond: {
          $or: _.map(emptyValues, (v) => {
            return {$eq: [{$toString: val}, v]}
          }),
        },
      },
    }
  }

  // 過濾出不是空值的項目
  static _$filterNoEmpty (arg) {
    const {input, path, emptyValues = ['', 'null', null]} = arg
    const val = path ? `$$f.${path}` : '$$f'
    return {
      $filter: {
        input,
        as: 'f',
        cond: {
          $and: _.map(emptyValues, (v) => {
            return {$ne: [{$toString: val}, v]}
          }),
        },
      },
    }
  }

  // 過濾出陣列中符合日期區間的資料
  static _$filterInTimeRange (arg) {
    const {input, path, startMoment, startExMoment, endMoment, endExMoment} = arg

    if (!(startMoment || startExMoment || endMoment || endExMoment)) return 1 // 完全無指定日期, 回傳原本欄位

    return {
      $filter: {
        input,
        as: 'f',
        cond: {
          $and: (() => {
            const val = path ? `$$f.${path}` : '$$f'
            const $and = []
            if (startMoment) {
              $and.push({$gte: [val, moment(startMoment).utc().toDate()]})
            } else if (startExMoment) {
              $and.push({$gt: [val, moment(startExMoment).utc().toDate()]})
            }
            if (endMoment) {
              $and.push({$lte: [val, moment(endMoment).utc().toDate()]})
            } else if (endExMoment) {
              $and.push({$lt: [val, moment(endExMoment).utc().toDate()]})
            }
            return $and
          })(),
        },
      },
    }
  }

  // 串接每個陣列值
  static _$concatArrays (arg) {
    const {input} = arg
    // Note. mongodb $concatArrays 有 bug, 需透過 $reduce 處理才會正常
    return {$reduce: {input, initialValue: [], in: {$concatArrays: ['$$this', '$$value']}}}
  }

  // 串接每個陣列值之後過濾唯一值
  static _$concatUnion (arg) {
    return {$setUnion: SpecTransformer._$concatArrays(arg)}
  }

  // 取得陣列中不是空值的數量
  static _$notEmptySize (arg) {
    return {$size: SpecTransformer._$filterNoEmpty(arg)}
  }

  // 取得陣列唯一值數量
  static _$unionSize (arg) {
    const {input} = arg
    return {$size: {$setUnion: input}}
  }

  // 取得陣列中不是空值的唯一值數量
  static _$notEmptyUnionSize (arg) {
    return {$size: {$setUnion: SpecTransformer._$filterNoEmpty(arg)}}
  }

  // 串接每個陣列值之後取得唯一值數量
  static _$concatUnionSize (arg) {
    return {$size: SpecTransformer._$concatUnion(arg)}
  }

  // 取出陣列中第一個不是空值的值
  static _$pickNoEmpty (arg) {
    const {input} = arg
    return {$arrayElemAt: [SpecTransformer._$filterNoEmpty({input}), 0]}
  }

  // 計算百分比
  static _$percent (arg) {
    let {numerator, place = 0} = arg
    numerator = {$multiply: [numerator, 100]}
    return SpecTransformer._$divide(_.assign(arg, {numerator, place}))
  }

  // 數字相除
  static _$divide (arg) {
    const {numerator, denominator, place = 3} = arg
    return {
      $cond: [
        denominator,  // Note. 當分母不為 0 時 才計算, 否則一律為 0
        {
          $round: [
            {
              $divide: [
                numerator,
                denominator,
              ],
            },
            place,
          ],
        },
        0,
      ],
    }
  }

  // 轉換規格設定
  static transSpec (spec, specType) {
    if (!_.isPlainObject(spec)) return spec
    _.forEach(spec, (arg, field) => {
      SpecTransformer.#recursiveTrans({spec, specType, field, arg})
    })
    return spec
  }
}

// MongoDb aggregate, pipe 相關的函式
class Query {
  // 取得 aggregate 用到的 pipeline
  static getPipeline (pipeline = [], {sort, skip, limit} = {}, tailPipeline = []) {
    // Note. 要先 sort，再 skip and limit
    if (sort) pipeline.push(Query.getSort(sort))
    if (skip) pipeline.push(Query.getSkip(skip))
    if (limit) pipeline.push(Query.getLimit(limit))
    pipeline.push(...tailPipeline)
    return pipeline
  }

  // pipeline cursor each
  static async cursorEach (cursor, cb, {batchSize = 50000} = {}) {
    if (batchSize) await cursor.batchSize(batchSize)
    while (await cursor.hasNext()) {
      const result = await cursor.next()
      if (await cb(result) === false) break
    }
    await cursor.close()
  }

  static async cursorMap (cursor, cb, {batchSize} = {}) {
    const arr = []
    await Query.cursorEach(cursor, async (result) => {
      arr.push(await cb(result))
    }, {batchSize})
    return arr
  }

  /* 以下為 Pipeline Stages */

  static getProject ($project) {
    SpecTransformer.transSpec($project, 'project')
    return {$project}
  }

  static getAddFields ($addFields) {
    SpecTransformer.transSpec($addFields, 'addFields')
    return {$addFields}
  }

  static getGroup ($group, opt = {}) {
    const {simpleGroup = true} = opt
    SpecTransformer.transSpec($group, 'group')
    _.forEach($group, (v, k) => {
      if (simpleGroup) {
        if (v === 1) v = {$first: `$${k}`}
        else if (v === -1) v = {$last: `$${k}`}
      }
      $group[k] = v
    })
    return {$group}
  }

  static getMatch ($match) {
    return {$match}
  }

  static getSort ($sort) {
    return {$sort}
  }

  static getSkip ($skip) {
    return {$skip: Number($skip)}
  }

  static getLimit ($limit) {
    return {$limit: Number($limit)}
  }

  static getUnset ($unset) {
    if (_.isPlainObject($unset)) {
      $unset = _.reduce($unset, (r, v, k) => {
        r.push(k)
        return r
      }, [])
    }
    return {$unset}
  }

  static getReplaceRoot (newRoot) {
    if (_.isString(newRoot)) newRoot = `$${newRoot}`
    return {$replaceRoot: {newRoot}}
  }

  static getUnwind (path, preserveNullAndEmptyArrays = true) {
    return {
      $unwind: {
        path: `$${path}`,
        preserveNullAndEmptyArrays,
      },
    }
  }

  static getCount ($count = 'count') {
    return {$count}
  }

  // 設置座標點距離內的搜尋 for pipeline-query
  static getGeoNearSphereByGps (arg) {
    const {where = {}, lng, lat, locPathOfWhere = `loc`, geometryType = `Point`, maxKm, minKm} = arg
    const $geoNear = {
      near: {type: geometryType, coordinates: [lng, lat]},
      key: locPathOfWhere,
      distanceField: '_calculated', // 把計算出來的距離放到指定的欄位中
      spherical: true, // 用 2dsphere 搜尋
    }
    if (where) $geoNear.query = where
    if (maxKm) $geoNear.maxDistance = Number(maxKm) * 1000
    if (minKm) $geoNear.minDistance = Number(minKm) * 1000

    return {$geoNear}
  }

  // 一般版本的 $lookup 搜尋, 沒有 pipeline 需求時, 使用此 function 效能較佳
  static getLookup ({from, localField, foreignField, as}) {
    return {
      $lookup: {
        from,
        localField,
        foreignField,
        as,
      },
    }
  }

  // 進階 $lookup 搜尋
  // Note. 目前 mongodb v3.6.3 時常不會使用索引, 待完全支援時就可完全取代 lib.Query.getLookup
  static getLookupWithPipe (arg) {
    let {
      from, // 要查詢的 collection name
      conditions, // localField 和 foreignField 的條件式設定
      localField, // 當下的欄位名稱
      foreignField, // 要查詢的對應 collection 欄位名稱
      as, // 查詢出來的資料的要放置的欄位
      match = {}, // 額外要符合的條件
      project, // 查詢出來的資料要執行的 $project
      pipeline, // 查詢出來的資料要執行的 pipeline
    } = arg

    // e.g. conditions = [{localField: 'aa', foreignField: 'bb', operator: '$eq', reverse: false}]
    // 裡面的參數 operator, reverse 為選填
    if (_.isEmpty(conditions)) conditions = [{localField, foreignField}]

    return {
      $lookup: {
        from,
        let: _.chain(conditions).mapKeys((setting, i) => `arg${i}`).mapValues((setting) => `$${setting.localField}`).value(),
        pipeline: (() => {
          const pipe = [
            {
              $match: _.assign({
                $expr: {
                  $and: _.map(conditions, (setting, i) => {
                    let {localField, foreignField, operator = '$eq', reverse} = setting

                    foreignField = foreignField || localField // 沒有設置對應欄位時, 預設和當下欄位名稱相同

                    localField = `$$arg${i}`
                    foreignField = `$${foreignField}`

                    let conditions = [localField, foreignField]
                    if (reverse) conditions = _.reverse(conditions)
                    return {[operator]: conditions}
                  }),
                },
              }, match),
            },
          ]
          if (project) pipe.push({$project: SpecTransformer.transSpec(project, 'project')})
          if (pipeline) pipe.push(...pipeline)
          return pipe
        })(),
        as,
      },
    }
  }
}

module.exports = Query
