// IMPORTS
import dotenv from 'dotenv';
import { main } from './mainFunction';

dotenv.config();

main().catch(err => {
  console.log('error init server');
  console.log(err);
});
