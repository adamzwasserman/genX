const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const ROOT_DIR = path.join(__dirname, '..', '..'); // Serve from project root

const server = http.createServer((req, res) => {
    let filePath = path.join(ROOT_DIR, req.url === '/' ? 'index.html' : req.url);

    // Prevent directory traversal
    if (!filePath.startsWith(ROOT_DIR)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    fs.readFile(filePath, (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404);
                res.end('Not Found');
            } else {
                res.writeHead(500);
                res.end('Internal Server Error');
            }
        } else {
            // Set content type based on file extension
            const ext = path.extname(filePath);
            let contentType = 'text/plain';
            switch (ext) {
                case '.html':
                    contentType = 'text/html';
                    break;
                case '.js':
                    contentType = 'application/javascript';
                    break;
                case '.css':
                    contentType = 'text/css';
                    break;
            }
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        }
    });
});

function startServer() {
    return new Promise((resolve) => {
        server.listen(PORT, () => {
            console.log(`Test server running on http://localhost:${PORT}`);
            resolve();
        });
    });
}

function stopServer() {
    return new Promise((resolve) => {
        server.close(() => {
            console.log('Test server stopped');
            resolve();
        });
    });
}

module.exports = { startServer, stopServer };