import { DataTypes, QueryInterface } from 'sequelize';

async function up({ context: queryInterface }: { context: QueryInterface }) {
  await queryInterface.sequelize.transaction(async t => {
    await queryInterface.removeIndex('images', ['syncDate']);

    await queryInterface.addColumn(
      'mediaIds',
      'deviceUniqueId',
      {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: '',
      },
      { transaction: t },
    );

    await queryInterface.sequelize.query(
      `
      UPDATE "mediaIds" 
      SET "deviceUniqueId" = "devices"."deviceUniqueId"
      FROM "devices"
      WHERE "mediaIds"."deviceId" = "devices"."id";
    `,
      { transaction: t },
    );

    await queryInterface.removeColumn('mediaIds', 'deviceId', { transaction: t });
    await queryInterface.removeColumn('mediaIds', 'createdAt', { transaction: t });
    await queryInterface.removeColumn('mediaIds', 'updatedAt', { transaction: t });

    await queryInterface.removeIndex('mediaIds', ['mediaId'], { transaction: t });
    await queryInterface.addIndex('mediaIds', ['imageId'], { transaction: t });

    await queryInterface.changeColumn(
      'mediaIds',
      'imageId',
      {
        type: DataTypes.UUID,
        references: {
          model: 'images',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      { transaction: t },
    );

    await queryInterface.addConstraint('mediaIds', {
      fields: ['mediaId', 'deviceUniqueId'],
      type: 'unique',
      name: 'unique_mediaId_deviceUniqueId',
      transaction: t,
    });

    await queryInterface.dropTable('devices', { transaction: t });
  });
}

async function down({ context: queryInterface }: { context: QueryInterface }) {
  await queryInterface.sequelize.transaction(async t => {
    await queryInterface.createTable(
      'devices',
      {
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
      },
      { transaction: t },
    );

    await queryInterface.addIndex('devices', ['deviceUniqueId'], { transaction: t });

    await queryInterface.removeIndex('mediaIds', ['imageId'], { transaction: t });
    await queryInterface.addIndex('mediaIds', ['mediaId'], { transaction: t });

    await queryInterface.removeColumn('mediaIds', 'deviceUniqueId', { transaction: t });

    await queryInterface.addColumn(
      'mediaIds',
      'updatedAt',
      {
        type: DataTypes.DATE,
        allowNull: false,
      },
      { transaction: t },
    );
    await queryInterface.addColumn(
      'mediaIds',
      'createdAt',
      {
        type: DataTypes.DATE,
        allowNull: false,
      },
      { transaction: t },
    );
    await queryInterface.addColumn(
      'mediaIds',
      'deviceId',
      {
        type: DataTypes.UUID,
        references: {
          model: 'devices',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      { transaction: t },
    );

    await queryInterface.addIndex('images', ['syncDate'], { transaction: t });
  });
}

const name = '20241112193500_01_drop_devices_table';

export default { up, down, name };
