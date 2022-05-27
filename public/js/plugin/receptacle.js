// 取得底下所有包含 id/class 的 $dom, 並寫到 domMap 中
$.fn.receptacle = function () {
  const $self = this
  const domMap = {}

  // e.g. $self 底下包含了 <div class="block"><input id="a"><input id="b">
  // domMap = {blockClass: $('.block'), a: $('#a'), b: $('#b')}

  $self.find(`[id]`).each(function () {
    const attrVal = $(this).attr('id')
    domMap[`${attrVal}`] = $(`#${attrVal}`)
  })

  $self.find(`[class]`).each(function () {
    const attrVal = $(this).attr('class')
    domMap[`${attrVal}Class`] = $(`.${attrVal}`)
  })

  _.assign($self, {
    // 取得底下所有的 $dom.val()
    getMapVal: (data = {}) => {
      _.forEach(domMap, ($d, eleName) => {
        if (!_.isFunction($d.val)) return
        const val = $d.val()
        if (val === undefined || val === '') return
        data[eleName] = val
      })
      return data
    },
    domMap: domMap,
  })

  return $self
}