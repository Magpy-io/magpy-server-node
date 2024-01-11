import { Sequelize, DataTypes } from "sequelize";
import { hashLen } from "@src/config/config";

const modelName = "image";

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
};

const modelOptions = {
  indexes: [{ fields: ["date"] }, { fields: ["syncDate"] }],
};

export function createImageModel(sequelize: Sequelize) {
  return sequelize.define(modelName, modelDefinition, modelOptions);
}

export interface PhotoDB {
  id: string;
  name: string;
  fileSize: number;
  width: number;
  height: number;
  date: string;
  syncDate: string;
  serverPath: string;
  serverCompressedPath: string;
  serverThumbnailPath: string;
  hash: string;
}
