// 利用 data 裡的 key/value 自動設置到物件內
$.fn.autoSet = function (data, {cb} = {}) {
  const $self = this

  $self.find(`[auto-set]`).each(function (i) {
    const $self = $(this)
    const key = $self.attr(`auto-set`)
    let val = _.get(data, key)
    if (cb) {
      const newVal = cb({data, key, val, i})
      if (newVal) val = newVal
    }
    $self.html(!_.isUndefined(val) ? val : '')
  })

  return $self
}