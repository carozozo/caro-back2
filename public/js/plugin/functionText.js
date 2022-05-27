// 提供一些方便客製化的 text 設定
$.fn.functionText = function ({enterCb}) {
  const $self = this

  $self.focus(function () {
    $(this).select()
  })
  $self.keyup(function (e) {
    if (e.keyCode !== 13) return
    enterCb && enterCb()
  })

  return $self
}