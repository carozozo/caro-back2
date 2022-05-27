// 將內容改為連結樣式
$.fn.linkStyle = function (style = 'info') {
  const $self = this

  $self.addClass(`text-${style}`).css({
    cursor: 'pointer',
    textDecoration: 'underline',
    textUnderlinePosition: 'under',
  })

  return $self
}