#
# luci-theme-ctmodem - 光猫/家庭网关风格 LuCI 主题
#
# 放置于 OpenWrt/LuCI 源码树的 feeds/luci/themes/ 或 package/ 任意子目录下即可编译。
# 目录名必须保持 luci-theme-ctmodem（luci.mk 用目录名推导包名和菜单分类）。
#
include $(TOPDIR)/rules.mk

LUCI_TITLE:=LuCI theme - ONT gateway style
LUCI_DESCRIPTION:=A LuCI theme reproducing the classic orange/blue home gateway \
 (ONT) web interface layout: top level tabs, secondary bar and a left navigation column.
LUCI_PKGARCH:=all
LUCI_DEPENDS:=

PKG_LICENSE:=MIT
PKG_MAINTAINER:=hakureiyuyuko <hakureiyuyuko@users.noreply.github.com>

# luci.mk 的位置随本目录放哪而变：feeds/luci/themes/<pkg> 时是 ../../luci.mk，
# 放到 package/<任意子目录>/<pkg> 时只能取 luci feed 里那份（否则 include 静默失败，
# BuildPackage 不被调用，menuconfig 里就看不到本包）。
LUCI_MK:=$(or $(wildcard ../../luci.mk),$(firstword $(wildcard $(TOPDIR)/feeds/*/luci.mk)))
ifeq ($(LUCI_MK),)
  $(error luci.mk not found - ./scripts/feeds update luci && ./scripts/feeds install luci)
endif

include $(LUCI_MK)

# call BuildPackage - OpenWrt buildroot signature
