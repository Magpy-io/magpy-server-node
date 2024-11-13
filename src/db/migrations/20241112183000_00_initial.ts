import { DataTypes, QueryInterface } from 'sequelize';
import { hashLen } from '../../config/config';

async function up({ context: queryInterface }: { context: QueryInterface }) {
  const tableExists = await queryInterface.tableExists('images');

  if (tableExists) {
    // This is the initial state of the app before migrations were added
    return;
  }

  await queryInterface.createTable('images', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      unique: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fileSize: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    width: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    height: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    serverPath: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    serverCompressedPath: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    serverThumbnailPath: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    syncDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    hash: {
      type: DataTypes.STRING(hashLen),
      allowNull: false,
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

  await queryInterface.addIndex('images', ['date']);
  await queryInterface.addIndex('images', ['syncDate']);

  await queryInterface.createTable('mediaIds', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      unique: true,
      primaryKey: true,
    },
    mediaId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    deviceId: {
      type: DataTypes.UUID,
      references: {
        model: 'devices',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    imageId: {
      type: DataTypes.UUID,
      references: {
        model: 'images',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
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

  await queryInterface.addIndex('mediaIds', ['mediaId']);

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
}

async function down({ context: queryInterface }: { context: QueryInterface }) {
  await queryInterface.dropTable('images');
  await queryInterface.dropTable('devices');
  await queryInterface.dropTable('mediaIds');
}

const name = '20241112183000_00_initial';

export default { up, down, name };
