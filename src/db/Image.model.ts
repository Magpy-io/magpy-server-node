import { Sequelize, DataTypes } from "sequelize";
import { hashLen } from "@src/config/config";

const modelName = "Image";

const modelDefinition = {
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
  clientPath: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  serverPath: {
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
};

const modelOptions = {
  indexes: [{ fields: ["date"] }, { fields: ["clientPath"] }],
};

export function createImageModel(sequelize: Sequelize) {
  return sequelize.define(modelName, modelDefinition, modelOptions);
}
