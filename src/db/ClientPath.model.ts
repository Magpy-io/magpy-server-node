import { Sequelize, DataTypes } from "sequelize";

const modelName = "clientPath";

const modelDefinition = {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    unique: true,
    primaryKey: true,
  },
  path: {
    type: DataTypes.STRING,
    allowNull: false,
  },
};

const modelOptions = {
  indexes: [{ fields: ["path"] }],
};

export function createClientPathModel(sequelize: Sequelize) {
  return sequelize.define(modelName, modelDefinition, modelOptions);
}

export interface ClientPathDB {
  id: string;
  path: string;
  deviceId: string;
  imageId: string;
}
