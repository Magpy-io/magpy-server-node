import { DataTypes, QueryInterface } from 'sequelize';

async function up({ context: queryInterface }: { context: QueryInterface }) {
  await queryInterface.sequelize.transaction(async t => {
    await queryInterface.addIndex('mediaIds', ['imageId'], { transaction: t });
  });
}

async function down({ context: queryInterface }: { context: QueryInterface }) {
  await queryInterface.sequelize.transaction(async t => {
    await queryInterface.removeIndex('mediaIds', ['imageId'], { transaction: t });
  });
}

const name = '20241121172100_02_add_mediaIds_imageId_index';

export default { up, down, name };
