#!/bin/bash
# 启动 ImmortalWrt QEMU 测试床（真机模拟）
# 用法: ./run-vm.sh [start|stop|status|serial]
set -u
BASE="$(cd "$(dirname "$0")" && pwd)"
VM="$BASE/vm"
IMG="$VM/openwrt.qcow2"
PORT="${PORT:-8088}"
SOCK="$VM/serial.sock"
PID="$VM/qemu.pid"
LOG="$VM/console.log"

case "${1:-start}" in
stop)
	[ -f "$PID" ] && kill "$(cat "$PID")" 2>/dev/null
	sleep 1
	rm -f "$SOCK"
	echo stopped
	exit 0
	;;
status)
	if [ -f "$PID" ] && kill -0 "$(cat "$PID")" 2>/dev/null; then
		echo "qemu running pid=$(cat "$PID")"
	else
		echo "qemu not running"
	fi
	curl -s -o /dev/null -w "http=%{http_code}\n" --noproxy '*' "http://127.0.0.1:$PORT/" 2>/dev/null
	exit 0
	;;
serial)
	exec python3 "$BASE/vm-serial.py" "${2:-}" "${3:-8}"
	;;
esac

"$BASE/run-vm.sh" stop >/dev/null 2>&1
rm -f "$SOCK"
: > "$LOG"

qemu-system-x86_64 \
	-enable-kvm -cpu host -m 512 -smp 2 \
	-drive file="$IMG",format=qcow2,if=virtio \
	-netdev user,id=n0,net=192.168.1.0/24,host=192.168.1.254,hostfwd=tcp:127.0.0.1:$PORT-192.168.1.1:80 \
	-device virtio-net-pci,netdev=n0 \
	-display none \
	-serial "unix:$SOCK,server=on,wait=off" \
	-daemonize -pidfile "$PID"

code=000
for i in $(seq 1 60); do
	code=$(curl -s -o /dev/null -w '%{http_code}' --noproxy '*' "http://127.0.0.1:$PORT/" 2>/dev/null)
	[ "$code" != "000" ] && break
	sleep 1
done
echo "vm started pid=$(cat $PID 2>/dev/null) http=$code port=$PORT serial=$SOCK"
