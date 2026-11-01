const http = require('http');
const fs = require('fs');
const path = require('path');

// Port 0 asks the OS for a free port, so each parallel cucumber worker (and any
// other process on the machine) gets its own. Read it with baseUrl() once started.
const PORT = Number(process.env.GENX_TEST_PORT) || 0;
let boundPort = null;
const ROOT_DIR = path.join(__dirname, '..', '..'); // Serve from project root

const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent(req.url.split(/[?#]/)[0]);
    let filePath = path.join(ROOT_DIR, urlPath === '/' ? 'index.html' : urlPath);

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
    return new Promise((resolve, reject) => {
        // Without this handler an EADDRINUSE (e.g. a second parallel cucumber worker,
        // or a stale server on this port) emits 'error' and the promise never settles,
        // hanging BeforeAll — and the whole run — forever. Reject fast and legibly instead.
        const onError = (err) => {
            reject(new Error(
                `Test server could not bind port ${PORT}: ${err.code || err.message}. ` +
                `Unset GENX_TEST_PORT to let the OS pick a free port.`
            ));
        };
        server.once('error', onError);
        server.listen(PORT, '127.0.0.1', () => {
            server.removeListener('error', onError);
            boundPort = server.address().port;
            console.log(`Test server running on ${baseUrl()}`);
            resolve();
        });
    });
}

/** Origin of this worker's test server, e.g. http://localhost:54321. */
function baseUrl() {
    if (boundPort === null) throw new Error('Test server is not running; startServer() first');
    return `http://localhost:${boundPort}`;
}

function stopServer() {
    return new Promise((resolve) => {
        boundPort = null;
        server.close(() => {
            console.log('Test server stopped');
            resolve();
        });
    });
}

module.exports = { startServer, stopServer, baseUrl };