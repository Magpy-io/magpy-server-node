import { DataTypes, Sequelize } from 'sequelize';

const modelName = 'mediaId';

const modelDefinition = {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    unique: true,
    primaryKey: true,
  },
  imageId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  mediaId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  deviceUniqueId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
};

const modelOptions = {
  indexes: [{ fields: ['imageId'] }],
};

export function createMediaIdModel(sequelize: Sequelize) {
  return sequelize.define(modelName, modelDefinition, modelOptions);
}

export interface MediaIdDB {
  id: string;
  imageId: string;
  mediaId: string;
  deviceUniqueId: string;
}
