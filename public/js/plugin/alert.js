// 通知功能
$.fn.alert = function () {
  const $self = this

  const $alert = $(`<div>`).css({
    'text-align': 'center',
    'position': 'absolute',
    'padding': '20px',
    'width': '100%',
    'cursor': 'pointer',
    'z-index': 200,
  }).addClass(`alert`).click(() => {
    $self.hideAlert()
  })

  _.assign($self, {
    showAlert: (type, msg, timeoutSec = 2) => {
      const className = `alert-${type}`
      $alert.removeClass((index, className) => {
        return (className.match(/(^|\s)alert-\S+/g) || []).join(' ')
      }).addClass(className)
      if (!msg) return
      $alert.html(msg).slideDown(200)

      if (!_.isNumber(timeoutSec) || !timeoutSec) return
      setTimeout(() => {
        $self.hideAlert()
      }, timeoutSec * 1000)
    },
    showInfo: (msg, timeoutSec) => {
      $self.showAlert(`info`, msg, timeoutSec)
      return $self
    },
    showWar: (msg, timeoutSec) => {
      $self.showAlert(`warning`, msg, timeoutSec)
      return $self
    },
    showErr: (msg, timeoutSec) => {
      $self.showAlert(`danger`, msg, timeoutSec)
      return $self
    },
    hideAlert: () => {
      $alert.slideUp(200)
      return $self
    },
  })

  $self.prepend($alert).hideAlert()

  return $self
}