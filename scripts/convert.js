// Convert the executable to not show a console when launched on windows

if (process.argv.length === 2) {
  console.error('Expected first argument to be path to file to convert');
  process.exit(1);
}

const path = require('path');

const p = path.parse(process.argv[2]);

require('create-nodew-exe')({
  src: process.argv[2],
  dst: process.argv[3] ?? path.join(p.dir, p.name + '-converted' + p.ext),
});
