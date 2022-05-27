// 設置 table 資料列表
$.fn.tableList = function (list, cb, {addIndex = true} = {}) {
  const $self = this
  const indexSearchStr = `[data-index='true']`
  const $thead = $self.find('thead')
  const $tbody = $self.find('tbody')
  const $headTr = $thead.find(`tr:first`)
  const $bodyTr = $tbody.find(`tr:first`)

  if (addIndex) {
    $headTr.prepend($(`<th>#</th>`).css({
      width: 50,
    }))
    $bodyTr.prepend($(`<td data-index="true"></td>`))
  }
  $thead.find('th').css({
    position: 'sticky',
    top: -1,
  })
  $tbody.html(``)

  const $trList = _.map(list, (data, index) => {
    const $tr = $bodyTr.clone()
    $tr.find(indexSearchStr).html(index + 1)
    $tr.find(`[data-key]`).each((i, target) => {
      const $ele = $(target)
      const key = $ele.attr(`data-key`)

      $ele.html(``)

      let val = _.get(data, key)
      val = !_.isNil(val) ? val : ``
      if (cb) {
        const gotVal = cb({val, key, data, $tr, $ele, index})
        if (gotVal === undefined) return
        val = gotVal
      }
      $ele.html(val)
    })
    return $tr
  })

  $tbody.append($trList)

  const tl = gsap.timeline()

  tl.from($trList, {
    duration: 0.2, ease: 'back.inOut(1)', x: 100, opacity: 0, stagger: 0.04,
    clearProps: 'transform',
  })

  _.assign($self, {
    // 取得標題欄位
    getHeaderElement: (key) => {
      return $self.find('tr:first').find(`[data-key='${key}']`)
    },
  })

  return $self
}
