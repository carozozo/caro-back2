// 放置一些未分類的函式
class Unit {
  static #randomPoolArr = (() => {
    const arr = [
      'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
      'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'z', 'y', 'z',
    ]
    arr.push(..._.map(arr, (v) => v.toUpperCase()))
    for (let i = 0; i < 10; i++) {
      arr.push(i.toString())
    }
    return arr
  })()

  // 取得台灣時區的 moment
  static getTwMoment (time, {inputFormat = '', isTwInput = false} = {}) {
    let momentInstance
    if (time) {
      if (inputFormat) momentInstance = moment(time, inputFormat)
      else momentInstance = moment(new Date(time))
    } else {
      momentInstance = moment()
    }
    return momentInstance.utcOffset(480, isTwInput)
  }

  // 轉換為台灣時區時間字串
  static toTwTimeStr (time, format = `dateTime`) {
    if (!time) return ``

    if (format === `dateTime`) format = `YYYY-MM-DD HH:mm:ss`
    else if (format === `date`) format = `YYYY-MM-DD`
    else if (format === `time`) format = `HH:mm:ss`

    return Unit.getTwMoment(time).format(format)
  }

  // 字串轉陣列
  static strToArr (str) {
    return str.split(/\r\n|[\s\r\n,;]/)
  }

  // 轉換為陣列
  static convertToArr (arg) {
    return _.isArray(arg) ? arg : [arg]
  }

  // 轉換資料中的 array 為 string
  static transArrToStrOfData (data, settings) {
    if (settings === true) settings = _.keys(data)

    let input = '', output = '', outputStrArr = '', headOutputStr, tailOutputStr
    for (const setting of settings) {
      // e.g. setting 的格式為 'xxx' 或是 {in: 'xxx', out: 'yyy'}
      if (_.isString(setting)) {
        input = output = setting
      } else {
        input = setting.in
        output = setting.out
      }

      const arr = _.get(data, input) || []

      _.set(data, output, arr.join('\n'))

      // e.g. output = '_community.tags' => '_community.htmlTags'
      outputStrArr = output.split('.')
      tailOutputStr = outputStrArr.pop()
      headOutputStr = outputStrArr.join('.')
      if (outputStrArr.length > 0) headOutputStr += '.'
      _.set(data, `${headOutputStr}html${_.upperFirst(tailOutputStr)}`, arr.join('<br/>'))
    }
    return data
  }

  // 將布林值轉為中文
  static booleanToChinese (bool) {
    if (_.isString(bool)) bool = bool.toLowerCase() === 'true'
    return bool ? '是' : '否'
  }

  // 取得字串的 binary 大小
  static getBinarySize (str, encoding = 'utf8') {
    return Buffer.byteLength(str, encoding)
  }

  // 數字相除
  static divide (numerator, denominator, toFix = 3) {
    return (_.isNumber(denominator) && denominator !== 0 && numerator) ? (numerator / denominator).toFixed(toFix) : 0
  }

  // 計算取得百分比
  static getPercentage (numerator, denominator) {
    return Math.round((lib.Unit.divide(numerator, denominator) * 100))
  }

  // 產生隨機字串
  static randomStr (length = 8) {
    const ret = []
    for (let i = 0; i < length; i++) {
      ret.push(_.sample(Unit.#randomPoolArr))
    }
    return ret.join('')
  }

  // 取得秒數差
  static getDiffSeconds (t) {
    return moment().diff(t) / 1000
  }

  // 取得全形數字字串
  static getFullWidthNumericString (text = '') {
    const base = '０１２３４５６７８９'
    return text.replace(/[0-9]/g, s => base[s])
  }

  // 將 Class 轉為一般物件
  static classToObject (theClass) {
    const originalClass = theClass || {}
    const keys = Object.getOwnPropertyNames(Object.getPrototypeOf(originalClass))
    return keys.reduce((classAsObj, key) => {
      classAsObj[key] = originalClass[key]
      return classAsObj
    }, {})
  }

  // 執行等待 for 測試
  static sleep (ms = 1000) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve()
      }, ms)
    })
  }

  // 判斷是否為 async function
  static ifAsyncFn (fn) {
    return _.get(fn, 'constructor.name') === 'AsyncFunction'
  }

  // 取得物件內的數據, 比較並設置差值
  static setCompareValInObj (obj, obj2 = {}, opt = {}) {
    const {
      skipFields = [], // 要略過的欄位
      percentFields = [], // 要設置百分比符號的欄位
      combineField = true, // 是否要將差值直接設置到原本的欄位中
    } = opt

    let isPercentField, v2, diffVal
    _.forEach(obj, (v, k) => {
      if (_.includes(skipFields, k)) return
      if (!_.isNumber(v)) return

      isPercentField = _.includes(percentFields, k)
      v2 = obj2[k] || 0

      // 計算差值
      diffVal = v - v2
      if (diffVal > 0) diffVal = `+${diffVal}` // 正數前面加上 +

      // 加上百分比
      if (isPercentField) v += `%`
      if (isPercentField) diffVal += `%`

      if (combineField) obj[k] = `${v} (${diffVal})`
      else obj[`${k}Diff`] = diffVal
    })
  }

  // 扁平化物件中的 key 值
  static flattenObjKeys (obj, parentKey) {
    // e.g. {a: 1, b: {c: 1}} => {a: 1, 'b.c': 1}
    return _.reduce(obj, (r, v, k) => {
      const newK = `${parentKey ? parentKey + '.' : ''}${k}`
      if (_.isObject(v)) _.assign(r, Unit.flattenObjKeys(v, newK))
      else r[newK] = v
      return r
    }, {})
  }

  // 轉換值為字串
  static valToString (val) {
    return _.chain(val).toString().trim().value()
  }

  // 轉換特殊符號 for regex
  static escapeRegEx (s) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
  }

  // 取得 Class 中所有 instance-property 名稱
  static getInstancePropertyNamesOfClass (Class, arr = []) {
    if (!Class.prototype) return _.uniq(arr)
    arr.push(...Object.getOwnPropertyNames(Class.prototype))
    return Unit.getInstancePropertyNamesOfClass(Object.getPrototypeOf(Class), arr)
  }

  // 取得 Class 中所有 instance-property 資訊
  static getInstancePropertyInfoOfClass (Class, info = {}) {
    if (!Class.prototype) return info
    _.reduce(Object.getOwnPropertyDescriptors(Class.prototype), (r, v, k) => {
      if (!r[k]) r[k] = v.get || v.set || v.value
      return r
    }, info)
    return Unit.getInstancePropertyInfoOfClass(Object.getPrototypeOf(Class), info)
  }
}

module.exports = Unit
