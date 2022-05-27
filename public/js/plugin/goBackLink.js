// 回上層連結
$.fn.goBackLink = function ({
  title = '←回上層',
  style = 'primary',
  cb,
} = {}) {
  const $self = this

  $self.html(title).css({
    display: 'inline-block', float: 'right', fontSize: '1.1em', marginBottom: 12,
  }).linkStyle(style).click(() => {
    cb()
  })
  return $self
}