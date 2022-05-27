// 下拉選單 + input 輸入欄位
$.fn.variableInput = function (dropDownArr, {dropDownOpt} = {}) {
  const $self = this

  const $dropDown = $('<div>').dropDown(dropDownArr, {...dropDownOpt, defTitle: ''}).clickItem()
  $dropDown.find('button').css({
    'border-top-right-radius': 0,
    'border-bottom-right-radius': 0,
  })
  const $input = $('<input type="text" class="form-control">')
  $self.inputGroup([$input], {prependItems: [$dropDown]})

  _.assign($self, {
    // 取得或設置下拉選單的值
    dropDownVal: (val) => {
      return $dropDown.val(val)
    },
    // 取得或設置輸入欄位值
    inputVal: (val) => {
      if (_.isUndefined(val)) return $input.val()
      $input.val(val)
    },
    // 清除選項及填寫的值
    clean: () => {
      $dropDown.unselectAll()
      $input.val('')
    },
  })

  return $self
}