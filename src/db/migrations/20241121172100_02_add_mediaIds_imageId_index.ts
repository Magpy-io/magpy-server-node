import { DataTypes, QueryInterface } from 'sequelize';

async function up({ context: queryInterface }: { context: QueryInterface }) {
  await queryInterface.addIndex('mediaIds', ['imageId']);
}

async function down({ context: queryInterface }: { context: QueryInterface }) {
  await queryInterface.removeIndex('mediaIds', ['imageId']);
}

const name = '20241121172100_02_add_mediaIds_imageId_index';

export default { up, down, name };
