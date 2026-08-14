require("dotenv").config();

const configuracaoComum = {
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  dialect: "postgres",
  logging: false,
  migrationStorage: "sequelize",
  migrationStorageTableName: "SequelizeMeta",
  seederStorage: "sequelize",
  seederStorageTableName: "SequelizeData",
};

module.exports = {
  development: configuracaoComum,
  test: {
    ...configuracaoComum,
    database: process.env.DB_NAME_TEST || `${configuracaoComum.database}_test`,
  },
  production: {
    ...configuracaoComum,
    logging: false,
  },
};
