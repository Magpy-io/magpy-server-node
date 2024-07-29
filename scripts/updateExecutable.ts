import rcedit from 'rcedit';

async function main() {
  const src = process.argv[2];
  await rcedit(src, {
    'file-version': '0.1.0',
    'product-version': '0.1.0',
    'version-string': {
      Comments: "Magpy's Server Runtime",
      CompanyName: 'Magpy',
      FileDescription: "Magpy's Server Runtime",
      InternalFilename: 'Magpy.exe',
      OriginalFilename: 'Magpy.exe',
      LegalCopyright: 'Copyright Magpy',
      LegalTrademarks1: 'Magpy',
      ProductName: 'Magpy',
    },
    icon: './assets/appicon_windows.ico',
  });
}

main().catch(console.log);
