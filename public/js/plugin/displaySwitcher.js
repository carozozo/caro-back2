// DOM 顯示切換
$.fn.displaySwitcher = function (domArrList = []) {
  const $self = this
  const indexList = []

  _.assign($self, {
    // 顯示指定階層
    displayLayer: (index = 0) => {
      if (!domArrList[index]) throw Error(`There is no layer for index ${index}`)

      // e.g. domArrList = [[$dom1, $dom2], [$dom3, $dom4], ...]
      let $dom, method
      _.forEach(domArrList, (domArr, i) => {
        if (!_.isArray(domArr)) domArr = [domArr]
        method = i === index ? 'fadeIn' : 'hide'
        for ($dom of domArr) {
          $dom[method]()
        }
      })

      // 寫入階層紀錄
      if (_.last(indexList) !== index) indexList.push(index)
      if (indexList.length > 12) indexList.shift() // 最多 12 階紀錄

      return $self
    },
    // 顯示上一個階層
    displayPrevLayer: () => {
      if (indexList.length < 2) return $self // 無上一次的階層紀錄, 不執行

      // e.g. indexList = [{上次顯示的階層}, {當下顯示的階層}]
      indexList.pop() // 先移除當下的階層紀錄
      const prevIndex = indexList.pop() // 取得上次的階層紀錄
      if (_.isNil(prevIndex)) return $self

      return $self.displayLayer(prevIndex)
    },
  })

  return $self
}