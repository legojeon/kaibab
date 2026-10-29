"""Build an allowlisted Chrome Web Store ZIP with manifest.json at its root."""
from pathlib import Path
import hashlib
import json
import zipfile

root = Path(__file__).resolve().parents[1]
source = root / 'extension'
manifest = json.loads((source / 'manifest.json').read_text())
files = ['manifest.json', 'popup.html', 'popup.css', 'popup.js', 'data.js', 'locales.js', 'network.js']
files += [f'icons/icon{size}.png' for size in (16, 32, 48, 128)]
files += [f'_locales/{language}/messages.json' for language in ('en', 'ko')]
output = root / 'dist'
output.mkdir(exist_ok=True)
archive_path = output / f'kaibab-{manifest["version"]}-chrome-web-store.zip'
with zipfile.ZipFile(archive_path, 'w', zipfile.ZIP_DEFLATED) as archive:
    for relative in files:
        archive.write(source / relative, relative)
with zipfile.ZipFile(archive_path) as archive:
    assert archive.testzip() is None
    assert 'manifest.json' in archive.namelist()
    assert set(archive.namelist()) == set(files)
digest = hashlib.sha256(archive_path.read_bytes()).hexdigest()
(archive_path.with_suffix('.zip.sha256')).write_text(f'{digest}  {archive_path.name}\n')
print(f'{archive_path.name}: {len(files)} files; manifest at ZIP root; SHA-256 {digest}')
