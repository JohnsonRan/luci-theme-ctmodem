#!/usr/bin/env python3
"""QEMU 串口守护：把串口输出写入日志，并通过 TCP 8099 接受要发送到串口的命令。

用法:
  python3 seriald.py            # 常驻
  echo "command" | nc 127.0.0.1 8099   # 发送命令
"""
import socket, os, sys, time, select, threading

BASE = os.path.dirname(os.path.abspath(__file__))
SOCK = os.environ.get('VM_SERIAL', os.path.join(BASE, 'vm', 'serial.sock'))
LOG = os.environ.get('VM_CONSOLE', os.path.join(BASE, 'vm', 'console.log'))
PORT = int(os.environ.get('VM_CMDPORT', '8099'))

logf = open(LOG, 'ab', buffering=0)


def serial_loop():
    while True:
        s = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        try:
            s.connect(SOCK)
        except OSError:
            time.sleep(0.5)
            continue
        print('[seriald] connected to', SOCK, flush=True)
        global SERIAL
        SERIAL = s
        while True:
            try:
                r, _, _ = select.select([s], [], [], 1.0)
                if not r:
                    continue
                data = s.recv(8192)
                if not data:
                    break
                logf.write(data)
                sys.stdout.buffer.write(data)
                sys.stdout.buffer.flush()
            except OSError:
                break
        print('[seriald] disconnected', flush=True)
        try:
            s.close()
        except OSError:
            pass
        SERIAL = None
        time.sleep(0.5)


SERIAL = None
threading.Thread(target=serial_loop, daemon=True).start()

srv = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
srv.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
srv.bind(('127.0.0.1', PORT))
srv.listen(5)
print('[seriald] cmd port', PORT, flush=True)

while True:
    c, _ = srv.accept()
    data = c.recv(65536)
    if data:
        if SERIAL:
            try:
                SERIAL.sendall(data)
            except OSError as e:
                print('[seriald] send failed:', e, flush=True)
        else:
            print('[seriald] no serial connection, dropped', flush=True)
    c.close()
