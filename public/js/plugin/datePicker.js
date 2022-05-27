// 客製化日期選擇
$.fn.datePicker = function (opt = {}) {
  const $self = this
  const lang = $.datepicker.regional[`zh-TW`]

  opt = _.assign({
    showOtherMonths: true,
    selectOtherMonths: true,
    maxDate: 0,
    changeMonth: true,
    changeYear: true,
    dateFormat: `yy-mm-dd`,
  }, opt)
  $self.datepicker(`option`, lang).datepicker(opt)
  $self.addClass('form-control').css({
    display: 'inline-block',
    width: 'auto',
  })

  if (opt.now) {
    $self.datepicker(`setDate`, moment().format(`YYYY-MM-DD`))
  }
  if (opt.subtractDay) {
    $self.datepicker(`setDate`, moment().subtract(opt.subtractDay, `d`).format(`YYYY-MM-DD`))
  }
  if (opt.date) {
    $self.datepicker(`setDate`, opt.date)
  }

  return $self
}