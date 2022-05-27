// boolean 下拉選單
$.fn.booleanOption = function (opt = {}) {
  let {
    asc = true,
    defTitle = '是否',
    trueHtml = '是',
    falseHtml = '否',
    dropDownOpt = {addEmpty: true},
  } = opt

  const $self = this

  const list = [
    {html: trueHtml, val: true},
    {html: falseHtml, val: false},
  ]
  if (!asc) _.reverse(list)

  dropDownOpt = _.assign({
    defTitle,
  }, dropDownOpt)

  $self.dropDown(list, dropDownOpt)

  return $self
}