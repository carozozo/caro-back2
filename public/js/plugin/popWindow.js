// bootstrap Modal 互動式窗
$.fn.popWindow = function ({modalId, $targetBody, $targetHeader, $targetFooter}) {
  const $self = this

  $(`#${modalId}`).remove()

  const $modal = $(`<div class="modal fade" id="${modalId}" tabindex="-1" role="dialog" aria-hidden="true">`)
  const $dialog = $(`<div class="modal-dialog" role="document">`)
  const $content = $(`<div class="modal-content">`)
  const $header = $(`<div class="modal-header">`)
  const $body = $(`<div class="modal-body">`)
  const $footer = $(`<div class="modal-footer">`)
  const $closeBtn = $(`<button type="button" class="close" data-dismiss="modal" aria-label="Close"> <span aria-hidden="true">&times;</span></button>`)

  if (_.isString($targetBody)) $targetBody = $($targetBody)
  if (_.isString($targetHeader)) $targetHeader = $($targetHeader)
  if (_.isString($targetFooter)) $targetFooter = $($targetFooter)

  $self.attr(`data-toggle`, `modal`).attr(`data-target`, `#${modalId}`)

  $modal.append($dialog)
  $dialog.append($content)
  $content.append([$header, $body, $footer])
  $body.append($targetBody)
  if ($targetHeader) $header.append($targetHeader)
  if ($targetFooter) $footer.append($targetFooter)
  $header.append($closeBtn)

  $('body').append($modal)

  _.assign({
    // 隱藏視窗
    hideModal: () => {
      $closeBtn.click()
    },
  })

  return $self
}