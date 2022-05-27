// 客製化 input 輸入欄位
$.fn.input = function (param = {}) {
  const $self = this
  const {title = '', type = 'text', val = '', emptyVal = '', width = 'auto', placeholder, size} = param

  const $title = $(`<span>${title}</span>`)
  const $input = $(`<input type="${type}" class="form-control" value="${val}">`).css({
    width,
  }).on('blur', () => {
    const val = _.trim($input.val())
    if (val) return
    $input.val(emptyVal)
  })
  if (placeholder) $input.attr('placeholder', placeholder)
  if (size) $input.attr('size', size)

  $self.inputGroup([$input], {prependItems: [$title]})

  _.assign($self, {
    // 設置或取得值
    val: (...args) => {
      return $input.val.apply($input, args)
    },
    // 設置 disabled property
    disabled: (disabled) => {
      if (_.isNil(disabled)) return $input.prop('disabled')
      $input.prop('disabled', disabled)
    },
    // 回復預設值
    resetDefVal: () => {
      $input.val(val)
    },
  })

  return $self
}