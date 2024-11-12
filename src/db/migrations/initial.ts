import { DataTypes, QueryInterface } from 'sequelize';
import { hashLen } from '../../config/config';

async function up({ queryInterface }: { queryInterface: QueryInterface }) {
  await queryInterface.createTable('image', {
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

  queryInterface.addIndex('image', ['date']);
  queryInterface.addIndex('image', ['syncDate']);

  await queryInterface.createTable('mediaId', {
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
      allowNull: false,
      references: {
        model: 'device',
        key: 'id',
      },
    },
    imageId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'image',
        key: 'id',
      },
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
  queryInterface.addIndex('mediaId', ['mediaId']);

  await queryInterface.createTable('device', {
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
}

async function down({ queryInterface }: { queryInterface: QueryInterface }) {
  await queryInterface.dropTable('image');
  await queryInterface.dropTable('device');
}

export default { up, down };
