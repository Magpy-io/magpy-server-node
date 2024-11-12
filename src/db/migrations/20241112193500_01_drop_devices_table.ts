import { DataTypes, QueryInterface } from 'sequelize';

async function up({ context: queryInterface }: { context: QueryInterface }) {
  await queryInterface.removeIndex('images', ['syncDate']);

  await queryInterface.removeColumn('mediaIds', 'deviceId');
  await queryInterface.removeColumn('mediaIds', 'createdAt');
  await queryInterface.removeColumn('mediaIds', 'updatedAt');

  await queryInterface.addColumn('mediaIds', 'deviceUniqueId', {
    type: DataTypes.STRING,
    allowNull: false,
  });
  await queryInterface.removeIndex('mediaIds', ['mediaId']);
  await queryInterface.addIndex('mediaIds', ['imageId']);

  await queryInterface.dropTable('devices');
}

async function down({ context: queryInterface }: { context: QueryInterface }) {
  await queryInterface.dropTable('images');
  await queryInterface.dropTable('devices');
  await queryInterface.dropTable('mediaIds');
}

const name = '20241112193500_01_drop_devices_table';

export default { up, down, name };
