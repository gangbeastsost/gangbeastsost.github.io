#!/usr/bin/env node

'use strict';

const fs = require('fs');
const http = require('http');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number.parseInt(process.env.PORT || '4173', 10);

const CONTENT_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.m4a': 'audio/mp4',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.ogg': 'audio/ogg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

function sendText(response, status, message) {
  const body = `${message}\n`;
  response.writeHead(status, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  });
  response.end(body);
}

function resolveRequestPath(requestUrl) {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(requestUrl, `http://${HOST}:${PORT}`).pathname);
  } catch (cause) {
    return null;
  }

  const resolved = path.resolve(ROOT, pathname.replace(/^[/\\]+/, ''));
  if (resolved !== ROOT && !resolved.startsWith(`${ROOT}${path.sep}`)) return null;
  return resolved;
}

function parseRange(header, size) {
  const match = /^bytes=(\d*)-(\d*)$/i.exec(String(header || '').trim());
  if (!match) return null;

  let start;
  let end;
  if (match[1] === '') {
    const suffixLength = Number.parseInt(match[2], 10);
    if (!Number.isFinite(suffixLength) || suffixLength <= 0) return null;
    start = Math.max(0, size - suffixLength);
    end = size - 1;
  } else {
    start = Number.parseInt(match[1], 10);
    end = match[2] === '' ? size - 1 : Number.parseInt(match[2], 10);
  }

  if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || start >= size || end < start) {
    return null;
  }
  return { start, end: Math.min(end, size - 1) };
}

function serveFile(request, response, filePath, stat) {
  const contentType = CONTENT_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
  const headers = {
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'no-store',
    'Content-Type': contentType,
  };
  const requestedRange = request.headers.range;
  const range = requestedRange ? parseRange(requestedRange, stat.size) : null;

  if (requestedRange && !range) {
    response.writeHead(416, {
      ...headers,
      'Content-Range': `bytes */${stat.size}`,
    });
    response.end();
    return;
  }

  if (range) {
    const contentLength = range.end - range.start + 1;
    response.writeHead(206, {
      ...headers,
      'Content-Length': contentLength,
      'Content-Range': `bytes ${range.start}-${range.end}/${stat.size}`,
    });
    if (request.method === 'HEAD') response.end();
    else fs.createReadStream(filePath, range).pipe(response);
    return;
  }

  response.writeHead(200, {
    ...headers,
    'Content-Length': stat.size,
  });
  if (request.method === 'HEAD') response.end();
  else fs.createReadStream(filePath).pipe(response);
}

const server = http.createServer((request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    sendText(response, 405, 'Method not allowed');
    return;
  }

  let filePath = resolveRequestPath(request.url);
  if (!filePath) {
    sendText(response, 400, 'Invalid path');
    return;
  }

  fs.stat(filePath, (initialError, initialStat) => {
    if (!initialError && initialStat.isDirectory()) filePath = path.join(filePath, 'index.html');

    fs.stat(filePath, (error, stat) => {
      if (error || !stat.isFile()) {
        sendText(response, 404, 'Not found');
        return;
      }
      serveFile(request, response, filePath, stat);
    });
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Gang Beasts OST test server: http://${HOST}:${PORT}`);
});

function shutDown() {
  server.close(() => process.exit(0));
}

process.on('SIGINT', shutDown);
process.on('SIGTERM', shutDown);
