// 選擇 bootstrap theme 效果
$.fn.bootstrapTheme = function () {
  const $self = this

  const $head = $('head')
  const className = `bootstrapTheme`
  const defTheme = `-none-`
  const currentTheme = localStorage.getItem(className) || defTheme

  const getLink = (theme) => {
    if (!theme || theme === defTheme) return `https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/css/bootstrap.min.css`
    return `https://stackpath.bootstrapcdn.com/bootswatch/4.4.1/${theme}/bootstrap.min.css`
  }
  const setHref = (theme) => {
    localStorage.setItem(className, theme)
    $link.attr(`href`, getLink(theme))
  }

  let $link = $self.find(className)
  if ($link.length === 0) $link = $(`<link class="${className}" rel="stylesheet">`)
  $head.append($link)

  const $group = $(`<div class="btn-group"></div>`).css({
    margin: 5,
  })
  const $btn = $(`<button type="button" class="btn btn-danger btn-sm dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">Theme</button>`)
  const $menu = $(`<div class="dropdown-menu dropdown-menu-right"></div>`).css({
    overflow: 'auto',
  })
  $group.append([$btn, $menu])
  $self.append($group)

  const themes = [
    `-none-`, `cerulean`, `cosmo`, `cyborg`, `darkly`, `flatly`, `journal`, `litera`, `lumen`,
    `lux`, `materia`, `minty`, `pulse`, `sandstone`, `simplex`, `sketchy`, `slate`, `solar`,
    `spacelab`, `superhero`, `united`, `yeti`,
  ]
  const itemList = []
  for (const theme of themes) {
    const $a = $(`<a class="dropdown-item" style="cursor:pointer;">${theme}</a>`).click(() => {
      setHref($a.html())
      for (const $item of itemList) {
        $item.removeClass(`active`)
      }
      $a.addClass(`active`)
    })
    if (currentTheme === theme) $a.addClass(`active`)
    $menu.append($a)
    itemList.push($a)
  }

  setHref(currentTheme)

  return $self
}