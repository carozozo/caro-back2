// 是否已刪除下拉選單
$.fn.isDisabledOption = function (opt = {}) {
  const $self = this

  $self.booleanOption(_.assign({defTitle: '已刪除'}, opt))

  return $self
}