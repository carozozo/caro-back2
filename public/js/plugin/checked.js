// 設置/取得 checked
$.fn.checked = function (checked) {
  const $self = this

  if (_.isNil(checked)) return $self.prop('checked')
  $self.prop('checked', checked)

  return $self
}