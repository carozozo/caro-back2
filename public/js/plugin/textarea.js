// 客製化 textarea 輸入欄位
$.fn.textarea = function ({title = '', width = 'auto'} = {}) {
  const $self = this

  const $title = $(`<span>${title}</span>`)
  const $textarea = $(`<textarea class="form-control" aria-label="${$title}"></textarea>`).css({})

  $self.inputGroup([$textarea], {prependItems: [$title]}).css({
    width,
  })

  _.assign($self, {
    // 取得輸入欄位
    getTextarea: () => {
      return $textarea
    },
  })

  return $self
}