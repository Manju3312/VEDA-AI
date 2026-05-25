const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const assignmentRoutes = require('./routes/assignments');

const envPath = path.join(__dirname, '.env');
const envResult = dotenv.config({ path: envPath });
if (envResult.error) {
  dotenv.config();
}
connectDB();

const app = express();
app.use(cors());
app.use(express.json());
const uploadsRoot = path.join(__dirname, 'uploads');
const downloadsRoot = path.join(__dirname, 'downloads');

app.use('/uploads', express.static(uploadsRoot));
app.use('/downloads', express.static(downloadsRoot));

const renderDirectoryListing = (title, routeBase, absoluteDir, parentHref = '') => {
  let entries = [];
  try {
    entries = fs
      .readdirSync(absoluteDir, { withFileTypes: true })
      .map((entry) => ({ name: entry.name, isDirectory: entry.isDirectory() }))
      .sort((a, b) => {
        if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
  } catch (error) {
    entries = [];
  }

  const parentLink = parentHref ? `<li><a href="${parentHref}">.. (parent)</a></li>` : '';
  const entryLinks = entries.length
    ? entries.map((entry) => {
      const href = `${routeBase}/${encodeURIComponent(entry.name)}${entry.isDirectory ? '/' : ''}`;
      const suffix = entry.isDirectory ? ' (folder)' : '';
      return `<li><a href="${href}">${entry.name}</a>${suffix}</li>`;
    }).join('')
    : '<li>No files available.</li>';
  const links = `${parentLink}${entryLinks}`;

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 24px; color: #111827; }
      h1 { margin: 0 0 12px; font-size: 20px; }
      p { margin: 0 0 16px; color: #4b5563; }
      ul { margin: 0; padding-left: 20px; }
      li { margin: 8px 0; }
      a { color: #2563eb; text-decoration: none; }
      a:hover { text-decoration: underline; }
    </style>
  </head>
  <body>
    <h1>${title}</h1>
    <p>Available items:</p>
    <ul>${links}</ul>
  </body>
</html>`;
};

const resolveInsideRoot = (rootDir, requestPathTail = '') => {
  const cleanedTail = requestPathTail.replace(/^\/+/, '');
  const safeTail = path.normalize(cleanedTail);
  const resolved = path.resolve(rootDir, safeTail);
  const inRoot = resolved === rootDir || resolved.startsWith(`${rootDir}${path.sep}`);
  return inRoot ? resolved : null;
};

const directoryRouteHandler = (title, routeBase, rootDir) => (req, res) => {
  const tail = req.path.slice(routeBase.length) || '/';
  let decodedTail = '/';
  try {
    decodedTail = decodeURIComponent(tail);
  } catch (error) {
    res.status(400).send('Invalid path');
    return;
  }
  const targetPath = resolveInsideRoot(rootDir, decodedTail);

  if (!targetPath) {
    res.status(403).send('Forbidden');
    return;
  }

  if (!fs.existsSync(targetPath)) {
    res.status(404).send('Not Found');
    return;
  }

  const stat = fs.statSync(targetPath);
  if (!stat.isDirectory()) {
    res.sendFile(targetPath);
    return;
  }

  const relativeFromRoot = path.relative(rootDir, targetPath);
  const routeParts = relativeFromRoot && relativeFromRoot !== '.'
    ? relativeFromRoot.split(path.sep).map((part) => encodeURIComponent(part)).join('/')
    : '';
  const currentRoute = routeParts ? `${routeBase}/${routeParts}` : routeBase;

  const parentRoute = (() => {
    if (!routeParts) return '';
    const parentParts = routeParts.split('/').slice(0, -1).join('/');
    return parentParts ? `${routeBase}/${parentParts}` : routeBase;
  })();

  res.status(200).send(renderDirectoryListing(title, currentRoute, targetPath, parentRoute));
};

app.get(/^\/uploads(?:\/.*)?$/, directoryRouteHandler('Uploads', '/uploads', uploadsRoot));
app.get(/^\/downloads(?:\/.*)?$/, directoryRouteHandler('Downloads', '/downloads', downloadsRoot));

app.use('/api/assignments', assignmentRoutes);
app.get('/api/health', (req, res) => {
  const dbStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const dbReadyState = mongoose.connection.readyState;
  const healthy = dbReadyState === 1;

  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'ok' : 'degraded',
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    database: {
      state: dbStates[dbReadyState] || 'unknown',
      readyState: dbReadyState,
      name: mongoose.connection.name || '',
    },
  });
});

if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../frontend/dist');
  app.use(express.static(frontendPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

const port = parseInt(process.env.PORT, 10) || 5000;
const server = app.listen(port, () => {
  console.log(`API server running on http://localhost:${port}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Stop the existing process and restart the server.`);
  } else {
    console.error(err);
  }
  process.exit(1);
});
