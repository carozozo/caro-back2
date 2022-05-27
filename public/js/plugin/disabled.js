// 設置/取得 disabled
$.fn.disabled = function (disabled) {
  const $self = this

  if (_.isNil(disabled)) return $self.prop('disabled')
  $self.prop('disabled', disabled)

  return $self
}