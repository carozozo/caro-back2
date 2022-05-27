// 客製化每頁筆數輸入格
$.fn.limitInput = function () {
  const $self = this
  const defVal = 50
  const min = 1
  const max = 200

  $self.input({title: `每頁筆數`, val: defVal, size: 2})
  $self.keyup(() => {
    let val = Number($self.val())

    if (_.isNaN(val)) {
      val = defVal
    } else if (val < min) {
      val = min
    } else if (val > max) {
      val = max
    }

    $self.val(val)
  })

  return $self
}