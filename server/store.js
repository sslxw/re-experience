const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR
    ? path.resolve(process.env.DATA_DIR)
    : path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');

function ensureDirs() {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

function filePath(name) {
    return path.join(DATA_DIR, name);
}

function readJson(name, fallback) {
    ensureDirs();
    const fp = filePath(name);
    if (!fs.existsSync(fp)) {
        writeJson(name, fallback);
        return JSON.parse(JSON.stringify(fallback));
    }
    return JSON.parse(fs.readFileSync(fp, 'utf8'));
}

function writeJson(name, data) {
    ensureDirs();
    fs.writeFileSync(filePath(name), JSON.stringify(data, null, 2));
}

module.exports = { DATA_DIR, UPLOADS_DIR, ensureDirs, readJson, writeJson };
