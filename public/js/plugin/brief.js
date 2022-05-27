// 簡化文字內容
$.fn.brief = function (content = ``, {
  linkTxt = ``, // 指定連結文字內容, 沒有設置的時候則是截取內文, 有設置時 usePop 強制為 true
  maxLength = 20, // 截取內文的長度
} = {}) {
  const $self = this

  if (!content) return $self

  let briefTxt = ``
  let usePop = true // 是否要用彈跳顯示

  if (linkTxt) {
    briefTxt = linkTxt
    usePop = true
  } else {
    briefTxt = content.substr(0, maxLength)
    if (briefTxt.length < content.length) {
      briefTxt += `...`
    } else {
      usePop = false // 文字長度沒超過截取長度, 不需要 pop
    }
  }

  const $text = $(`<span>`)
  $text.html(briefTxt)
  if (usePop) {
    const opt = {
      content,
    }
    $text.addClass(`text-info`).css({cursor: `pointer`}).popover(opt)
  }
  $text.mouseover(() => {
    $text.popover(`show`)
  })
  $text.mouseleave(() => {
    $text.popover(`hide`)
  })

  $self.append($text)

  return $self
}