import es from 'event-stream';
import { Duplex } from 'stream';
import fs from 'fs';

let filepath = '.tmp/output.log';

if (process.argv.length == 3) {
  filepath = process.argv[2];
}

class CustomDuplexStream extends Duplex {
  constructor() {
    super();
  }

  // The _write method is called when data is written to the stream
  _write(chunk: Buffer, encoding: string, callback: () => void) {
    callback();
  }

  // The _read method is called when data is read from the stream
  _read() {
    this.push('');
  }
}

const myDuplexStream = new CustomDuplexStream();

function tailFile(curr: fs.Stats, prev?: fs.Stats) {
  // If the file has grown since the last read, process new content
  if (curr.size > (prev?.size || 0)) {
    const readStream = fs.createReadStream(filepath, {
      start: prev?.size || 0,
      end: curr.size,
      encoding: 'utf8',
    });

    readStream.on('data', chunk => {
      // Process each chunk of new data
      myDuplexStream.push(chunk);
    });
  }
}

fs.stat(filepath, (err, stats) => {
  if (err) {
    console.error('Error getting file stats:', err);
    return;
  }
  tailFile(stats);
});

// Watch the file for changes (new content added)
fs.watchFile(
  filepath,
  { persistent: true, interval: 500 },
  (curr: fs.Stats, prev: fs.Stats) => {
    tailFile(curr, prev); // Read new data when the file changes
  },
);

myDuplexStream
  .pipe(es.split()) // Split input by lines
  .pipe(
    es.mapSync((line: string) => {
      try {
        return JSON.parse(line); // Parse each line as JSON
      } catch (err) {
        console.error('Invalid JSON:', line);
        return null; // Ignore invalid JSON lines
      }
    }),
  )
  .pipe(es.filterSync((obj: any) => obj && obj.source == 'umzug')) // Filter by 'level'
  .pipe(es.mapSync((obj: any) => JSON.stringify(obj) + '\n')) // Convert back to JSON string
  .pipe(process.stdout)
  .on('error', err => {
    console.error('Error reading file:', err);
  })
  .on('end', () => {
    console.log('File reading ended');
  });

if (process.platform === 'win32') {
  var rl = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.on('SIGINT', function () {
    process.emit('SIGINT');
  });
}

process.on('SIGINT', function () {
  process.exit(0);
});
