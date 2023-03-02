import os
import http.server
import socketserver
import requests

class ProxyHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        # 获取客户端请求的路径
        request_path = self.path
        # 构造目标URL
        target_url = os.environ.get("MOCK_URL") + request_path
        # 发送请求到目标网站
        response = requests.get(target_url)
        # 将响应返回给客户端
        self.send_response(response.status_code)
        self.send_header("Content-type", response.headers["Content-type"])
        self.end_headers()
        self.wfile.write(response.content)

    def do_POST(self):
        # 获取客户端请求的路径
        request_path = self.path
        # 获取请求数据的长度
        content_length = int(self.headers["Content-Length"])
        # 读取请求数据
        headers = {}
        headers["Content-Type"] = self.headers["Content-Type"]
        request_data = self.rfile.read(content_length)
        # 构造目标URL
        target_url = os.environ.get("MOCK_URL") + request_path
        # 发送请求到目标网站
        print("target_url:{target_url},data:{data}".format(target_url=target_url,data=request_data))
        response = requests.post(target_url, data=request_data,headers = headers)
        # 将响应返回给客户端
        print("response:",response)
        self.send_response(response.status_code)
        self.send_header("Content-type", response.headers["Content-type"])
        self.end_headers()
        self.wfile.write(response.content)

PORT = 10001
with socketserver.TCPServer(("0.0.0.0", PORT), ProxyHandler) as httpd:
    print("serving at port", PORT)
    httpd.serve_forever()
