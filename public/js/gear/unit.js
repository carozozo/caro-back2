// 一些未分類的函式
$.unit = {
  // 取得網址上的變數值
  getUrlParam: (key) => {
    const hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&')
    let param = [], i = 0, hash
    for (i; i < hashes.length; i++) {
      hash = hashes[i].split('=')
      param[hash[0]] = hash[1]
    }
    if (_.isString(key)) return param[key]
    return param
  },
  // 是否為數字格式的字串
  isNumeric: (str) => {
    if (typeof str != 'string') return false
    return !isNaN(str) && !isNaN(parseFloat(str))
  },
  // 判斷是否可下載的數據; e.g. "30 (0)" => 取出 "30" 判斷是否數字
  disciplineDownloadableFigure: (val) => {
    const valArr = String(val).split(' ')
    const firstStr = valArr.shift()
    const tailStr = valArr.join(' ')
    const num = Number(firstStr)

    const isDownloadable = !_.isNaN(num) && num !== 0
    return {isDownloadable, firstStr, tailStr}
  },
  // 字串轉陣列
  strToArr: (str) => {
    return str.split(/\r\n|[\s\r\n,;]/)
  },
}