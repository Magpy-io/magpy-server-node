import { Sequelize } from 'sequelize';
import { Logger } from '../modules/Logger';
import { SequelizeStorage, Umzug } from 'umzug';

import initial from './migrations/initial';

export async function migrateDb(sequelize: Sequelize) {
  const umzug = new Umzug({
    migrations: [
      {
        name: '00_initial',
        async up({ context }) {
          initial.up({ queryInterface: context });
        },
        async down({ context }) {
          initial.down({ queryInterface: context });
        },
      },
    ],
    context: sequelize.getQueryInterface(),
    storage: new SequelizeStorage({ sequelize }),
    logger: Logger.child({ source: 'umzug' }),
  });

  await umzug.up();
}
