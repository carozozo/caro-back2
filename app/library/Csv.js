// 客製的 Csv 函式庫
class Csv {
  // 轉換編碼
  static #encodeData (param) {
    let {
      data,
      encode = 'utf-8', // 要輸出的編碼
      encoding, // data 的編碼
    } = param

    if (!encode) return data
    encode = encode.toLowerCase()
    data = Buffer.from(data)

    if (!encoding) { // 沒特別指定來源的編碼
      const encodingInfo = require('jschardet').detect(data)
      encoding = (encodingInfo.encoding || 'big5').toLowerCase()
    }

    if (encoding === encode) return data
    const Iconv = require('iconv').Iconv
    const iconv = new Iconv(encoding, `${encode}//TRANSLIT//IGNORE`)
    return iconv.convert(data)
  }

  // 讀取檔案, 輸出為 csv-list
  static readData (param) {
    const fs = require('fs')
    const parse = require('csv-parse')

    const {path, titleMap} = param
    delete param.path
    delete param.titleMap

    const data = Csv.#encodeData({data: fs.readFileSync(path)})

    // 轉換 title
    if (titleMap) {_.assign(param, {on_record: (record) => _.mapKeys(record, (v, k) => titleMap[k] || k)})}

    return new Promise((resolve, reject) => {
      parse(data, param, (err, data) => {
        if (err) return reject(err)
        resolve(data)
      })
    })
  }

  // 轉換 object-array 為 csv-list
  static coverToCsv (param) {
    const {Parser} = require('json2csv')
    const {
      titleMap, list, encode = 'utf-8',
      extendTitleMap = {}, // 延伸欄位
    } = param

    // 如果有資料的該欄位有值, 就設置到 csv 標籤中
    _.forEach(extendTitleMap, (field, fieldName) => {
      const data = _.find(list, (d) => !_.isEmpty(d[field]))
      if (data) titleMap[fieldName] = field
    })

    const fields = _.chain(titleMap).map((field, fieldName) => {
      return {
        label: fieldName,
        value: field,
      }
    }).filter((setting) => !_.isNil(setting.value)).value()
    const json2csvParser = new Parser({fields})
    const csv = json2csvParser.parse(list)
    return Csv.#encodeData({data: csv, encode, encoding: 'utf-8'})
  }

  // 轉換 csv-list 為 object-array
  static coverCsvToObjArr (param) {
    const {
      titleMap, // e.g. {'電話': 'phone', '姓名': 'name'}
      csvList, // e.g. [['電話', '姓名'], ['0900123456', 'Caro']]
    } = param

    const headers = csvList.shift()
    const arr = []
    let newHeaders = headers
    let i

    // 轉換 headers 的值; e.g. ['電話', '姓名'] => ['name', 'title']
    if (titleMap) {
      let title, objectKey
      newHeaders = []
      for (i in headers) {
        title = headers[i] // '電話'
        objectKey = titleMap[title] // 'phone'
        newHeaders.push(objectKey) // Note. objectKey 可能是 undefined
      }
    }

    let key, csvRaw, data
    for (csvRaw of csvList) {
      data = {} // e.g. ['0900123456', 'Caro'] => {phone: '0900123456', name: 'Caro'}
      for (i in newHeaders) {
        key = newHeaders[i]
        if (!key) continue
        data[key] = csvRaw[i]
      }
      arr.push(data)
    }
    return arr
  }

  // 組成 filename
  static generateFilename (param) {
    const {name, timeFormat = 'YYYYMMDDHHmmss'} = param
    return `${name}${timeFormat ? '_' + moment().format(timeFormat) : ''}.csv`
  }
}

module.exports = Csv
