import { DataTypes, QueryInterface } from 'sequelize';

async function up({ context: queryInterface }: { context: QueryInterface }) {
  await queryInterface.removeIndex('images', ['syncDate']);

  await queryInterface.addColumn('mediaIds', 'deviceUniqueId', {
    type: DataTypes.STRING,
    allowNull: false,
  });

  await queryInterface.sequelize.query(`
    UPDATE "mediaIds" 
    SET "deviceUniqueId" = "devices"."deviceUniqueId"
    FROM "devices"
    WHERE "mediaIds"."deviceId" = "devices"."id";
  `);

  await queryInterface.removeColumn('mediaIds', 'deviceId');
  await queryInterface.removeColumn('mediaIds', 'createdAt');
  await queryInterface.removeColumn('mediaIds', 'updatedAt');

  await queryInterface.removeIndex('mediaIds', ['mediaId']);
  await queryInterface.addIndex('mediaIds', ['imageId']);

  await queryInterface.dropTable('devices');
}

async function down({ context: queryInterface }: { context: QueryInterface }) {
  await queryInterface.createTable('devices', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      unique: true,
      primaryKey: true,
    },
    deviceUniqueId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  });

  await queryInterface.addIndex('devices', ['deviceUniqueId']);

  await queryInterface.removeIndex('mediaIds', ['imageId']);
  await queryInterface.addIndex('mediaIds', ['mediaId']);

  await queryInterface.removeColumn('mediaIds', 'deviceUniqueId');

  await queryInterface.addColumn('mediaIds', 'updatedAt', {
    type: DataTypes.DATE,
    allowNull: false,
  });
  await queryInterface.addColumn('mediaIds', 'createdAt', {
    type: DataTypes.DATE,
    allowNull: false,
  });
  await queryInterface.addColumn('mediaIds', 'deviceId', {
    type: DataTypes.UUID,
    references: {
      model: 'devices',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  });

  await queryInterface.addIndex('images', ['syncDate']);
}

const name = '20241112193500_01_drop_devices_table';

export default { up, down, name };
