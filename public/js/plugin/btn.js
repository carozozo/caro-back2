// 客製化 button
$.fn.btn = function ({type = 'primary', html = '送出', size} = {}) {
  const $self = this

  const $btn = $(`<button class="btn btn-${type}">${html}</button>`)
  let defType = type

  if (size) $btn.addClass(`btn-${size}`)

  $self.css({
    display: 'inline-block',
  }).append($btn)

  _.assign($self, {
    disableBtn: (disabled = true) => {
      $btn.prop('disabled', disabled)
    },
    changeType: (type = 'primary') => {
      $btn.removeClass(`btn-${defType}`).addClass(`btn-${type}`)
      defType = type
    },
  })

  return $self
}