// YBT 帳號身份下拉選單
$.fn.accountRoleOption = function () {
  const $self = this

  $.global.aj({
    url: `/main/account/getRoleMap`,
    data: {},
    suc: (res) => {
      const roleMap = res.roleMap
      const roles = _.map(roleMap, (chineseName, role) => {
        return {
          val: role,
          html: chineseName,
        }
      })
      const fnDropDownOpt = {
        addEmpty: true,
        defTitle: `身份`,
        style: `success`,
      }
      $self.dropDown(roles, fnDropDownOpt)
    },
  })

  return $self
}
