#!/bin/bash
# 把主题打成可在 OpenWrt 上一键安装的 tar.gz（含 install.sh）
set -eu
BASE="$(cd "$(dirname "$0")" && pwd)"
SRC="$BASE/luci-theme-ctmodem"
OUT="$BASE/testbed/vm/theme.tar.gz"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

mkdir -p "$TMP/www/luci-static" "$TMP/usr/share/ucode/luci/template/themes"
cp -a "$SRC/htdocs/luci-static/ctmodem" "$TMP/www/luci-static/"
cp -a "$SRC/ucode/template/themes/ctmodem" "$TMP/usr/share/ucode/luci/template/themes/"

cat > "$TMP/install.sh" <<'EOF'
#!/bin/sh
# luci-theme-ctmodem 安装脚本（在 OpenWrt 上以 root 运行）
set -e
cd "$(dirname "$0")"

mkdir -p /www/luci-static/ctmodem /usr/share/ucode/luci/template/themes/ctmodem
cp -rf www/luci-static/ctmodem/. /www/luci-static/ctmodem/
cp -rf usr/share/ucode/luci/template/themes/ctmodem/. /usr/share/ucode/luci/template/themes/ctmodem/

uci -q set luci.main.mediaurlbase='/luci-static/ctmodem'

# 注册到界面设置的主题列表（否则下拉会显示成别的主题名）
uci -q set luci.themes.ctmodem='/luci-static/ctmodem'

# 未显式设置过语言时默认中文（跟随原机界面）
cur_lang="$(uci -q get luci.main.lang)"
if [ -z "$cur_lang" ] || [ "$cur_lang" = "auto" ]; then
	uci -q set luci.main.lang='zh_cn'
fi

uci -q commit luci

[ -x /etc/init.d/uhttpd ] && /etc/init.d/uhttpd restart
echo "luci-theme-ctmodem installed"
EOF
chmod +x "$TMP/install.sh"

tar -czf "$OUT" -C "$TMP" .
ls -lh "$OUT"
tar -tzf "$OUT" | head -12
