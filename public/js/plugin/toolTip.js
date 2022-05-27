// 客製浮動提示訊息
$.fn.toolTip = function (title, opt = {}) {
  const $self = this

  $self.attr({title: title}).tooltip(opt)

  return $self
}