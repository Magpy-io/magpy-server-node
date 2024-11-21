import { Sequelize } from 'sequelize';
import { Logger } from '../modules/Logger';
import { SequelizeStorage, Umzug } from 'umzug';

import initial from './migrations/20241112183000_00_initial';
import drop_devices_table from './migrations/20241112193500_01_drop_devices_table';
import add_mediaIds_imageId_index from './migrations/20241121172100_02_add_mediaIds_imageId_index';

export async function migrateDb(sequelize: Sequelize) {
  const umzug = new Umzug({
    migrations: [initial, drop_devices_table, add_mediaIds_imageId_index],
    context: sequelize.getQueryInterface(),
    storage: new SequelizeStorage({ sequelize }),
    logger: Logger.child({ source: 'umzug' }),
  });

  await umzug.up();
}
