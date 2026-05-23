import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';

const app = express();
app.use(cors());

const IMAGE_EXTS = new Set([
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp',
]);

function isImageFile(filename) {
  const ext = path.extname(filename).toLowerCase();
  return IMAGE_EXTS.has(ext);
}

async function getImages(dirPath) {
  const resolved = path.resolve(dirPath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Directory not found: ${resolved}`);
  }
  const stat = fs.statSync(resolved);
  if (!stat.isDirectory()) {
    throw new Error(`Not a directory: ${resolved}`);
  }
  const entries = await fs.promises.readdir(resolved);
  return entries
    .filter((f) => {
      const full = path.join(resolved, f);
      return fs.statSync(full).isFile() && isImageFile(f);
    })
    .sort();
}

app.get('/api/images', async (req, res) => {
  try {
    const dir = req.query.dir;
    if (!dir) {
      return res.status(400).json({ error: 'Missing directory parameter' });
    }
    const images = await getImages(dir);
    res.json(images);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/image', (req, res) => {
  const { dir, name } = req.query;
  if (!dir || !name) {
    return res.status(400).json({ error: 'Missing dir or name parameter' });
  }
  const decodedName = decodeURIComponent(name);
  const resolvedDir = path.resolve(dir);
  const filePath = path.join(resolvedDir, decodedName);

  if (!filePath.startsWith(resolvedDir)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  res.sendFile(filePath);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
