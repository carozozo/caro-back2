// 快速建構 bootstrap input-group
$.fn.inputGroup = function (items, {prependItems = [], appendItems = []} = {}) {
  const $self = this

  const $inputGroup = $('<div class="input-group">')
  const setClassToSpan = (items) => {
    for (const item of items) {
      if (item.prop('tagName') !== 'SPAN') continue
      item.addClass('input-group-text')
    }
  }

  if (!_.isEmpty(prependItems)) {
    const $prepend = $('<div class="input-group-prepend">')
    $prepend.append(prependItems)
    $inputGroup.append($prepend)
    setClassToSpan(prependItems)
  }

  $inputGroup.append(items)
  setClassToSpan(items)

  if (!_.isEmpty(appendItems)) {
    const $append = $('<div class="input-group-append">')
    $append.append(appendItems)
    $inputGroup.append($append)
    setClassToSpan(appendItems)
  }

  $self.css({
    display: 'inline-block',
    verticalAlign: 'middle',
  }).append($inputGroup)

  return $self
}