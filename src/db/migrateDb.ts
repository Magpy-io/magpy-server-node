import { Sequelize } from 'sequelize';
import { Logger } from '../modules/Logger';
import { SequelizeStorage, Umzug } from 'umzug';

import initial from './migrations/20241112183000_00_initial';

export async function migrateDb(sequelize: Sequelize) {
  const umzug = new Umzug({
    migrations: [initial],
    context: sequelize.getQueryInterface(),
    storage: new SequelizeStorage({ sequelize }),
    logger: Logger.child({ source: 'umzug' }),
  });

  await umzug.up();
}
