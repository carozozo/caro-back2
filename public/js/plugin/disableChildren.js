// 取得底下所有的 children dom 並 disabled
$.fn.disableChildren = function ({selector, disabled = true}) {
  const $self = this

  $self.find(selector).prop('disabled', disabled)

  return $self
}