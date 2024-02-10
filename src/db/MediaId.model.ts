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
  mediaId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
};

const modelOptions = {
  indexes: [{ fields: ['mediaId'] }],
};

export function createMediaIdModel(sequelize: Sequelize) {
  return sequelize.define(modelName, modelDefinition, modelOptions);
}

export interface MediaIdDB {
  id: string;
  mediaId: string;
  deviceId: string;
  imageId: string;
}
