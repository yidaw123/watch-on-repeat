import http.server
import socketserver
import urllib.parse
import sys

class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if '/log_error' in self.path:
            parsed = urllib.parse.urlparse(self.path)
            qs = urllib.parse.parse_qs(parsed.query)
            if 'msg' in qs:
                print("JS ERROR:", qs['msg'][0], flush=True)
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"OK")
            # stop the server after logging the error
            sys.exit(0)
            return
        return super().do_GET()

httpd = socketserver.TCPServer(("", 8080), Handler)
print("Serving on port 8080...", flush=True)
httpd.serve_forever()
