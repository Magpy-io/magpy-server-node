import { DataTypes, Sequelize } from 'sequelize';

const modelName = 'device';

const modelDefinition = {
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
};

const modelOptions = {
  indexes: [{ fields: ['deviceUniqueId'] }],
};

export function createDevicesModel(sequelize: Sequelize) {
  return sequelize.define(modelName, modelDefinition, modelOptions);
}

export interface DeviceDB {
  id: string;
  deviceUniqueId: string;
}
