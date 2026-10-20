#!/usr/bin/env python3
"""通过 unix socket 与 QEMU 串口交互。

用法: python3 vm-serial.py [要发送的命令] [等待秒数] [socket路径]
不带命令时只读取当前串口输出。
"""
import socket, sys, time, os, select

sock_path = sys.argv[3] if len(sys.argv) > 3 else os.path.join(
    os.path.dirname(os.path.abspath(__file__)), 'vm', 'serial.sock')
cmd = sys.argv[1] if len(sys.argv) > 1 else ''
wait = float(sys.argv[2]) if len(sys.argv) > 2 else 8.0

s = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
s.settimeout(1.0)
s.connect(sock_path)

out = bytearray()

def drain(seconds):
    end = time.time() + seconds
    while time.time() < end:
        r, _, _ = select.select([s], [], [], 0.3)
        if not r:
            continue
        try:
            data = s.recv(8192)
        except socket.timeout:
            continue
        if not data:
            break
        out.extend(data)

drain(0.6)

if cmd:
    s.sendall(cmd.encode() + b'\n')
    drain(wait)
else:
    drain(wait)

sys.stdout.write(out.decode('utf-8', 'replace'))
sys.stdout.flush()
s.close()
