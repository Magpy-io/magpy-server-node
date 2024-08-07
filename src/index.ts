// IMPORTS
import dotenv from 'dotenv';
import { main } from './mainFunction';

dotenv.config();

main().catch(err => {
  console.log('App terminated unexpectedly');
  console.log(err);

  // This is needed because app will not close naturally
  // This is because we add a listener on process.stdin.on('data',), wich will cause node to wait around for an input
  process.exit(1);
});
