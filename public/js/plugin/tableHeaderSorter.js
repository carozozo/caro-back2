// 設置 table 的 header 排序顯示
$.fn.tableHeaderSorter = function ({
  keys = [], // 指定可以點選排序的 header 項目; e.g. ['name', 'createdAt']
  fn = {}, // 點選排序時的 cb
  sortKey = '', // 指定預設顯示升降冪的 header 項目; e.g. 'createdAt', '-createdAt'
} = {}) {
  const $self = this

  const $header = $self.find(`tr:first`)
  const statusArr = [undefined, false, true] // 升冪狀態列表
  const maxStatusIndex = statusArr.length - 1
  const info = (() => {
    let key
    let asc
    if (sortKey.indexOf('-') === 0) {
      asc = false
      key = sortKey.slice(1)
    } else if (sortKey) {
      asc = true
      key = sortKey
    }
    return {
      key,
      asc,
    }
  })()
  const getHeaderElement = (key) => {
    return $header.find(`[data-key='${key}']`)
  }

  _.forEach(keys, (key) => {
    const $title = getHeaderElement(key)
    const originalHtml = $title.html()
    let asc = (key === info.key) ? info.asc : undefined
    let statusIndex = statusArr.indexOf(asc) // 升冪狀態的 index

    const setTrHtml = () => { // 更新 header 的顯示文字
      const symbol = asc ? '↑' : (asc === false ? '↓' : '')
      const html = `${originalHtml}${symbol}`
      $title.html(html)
    }

    $title.css({cursor: 'pointer', 'text-decoration': 'underline'})
    $title.click(() => {
      // 轉換升冪狀態
      if (++statusIndex > maxStatusIndex) statusIndex = 0
      asc = statusArr[statusIndex]

      info.key = (asc !== undefined) ? $title.attr(`data-key`) : undefined
      info.asc = asc
      setTrHtml()
      fn()
    })
    setTrHtml()
  })

  _.assign($self, {
    // 取得排序值
    getSortKey: () => {
      return `${(info.asc === false) ? '-' : ''}${info.key || ''}`
    },
  })

  return $self
}