const { clientSQLITE } = require('../knexfile.js')
const knexSqlite = require('knex')(clientSQLITE)

const createTableConversaoXml = async function(knexSqlite) {
    await knexSqlite.schema.hasTable('ConversaoXml').then(async function(exists)  {

      if (!exists) {
        return await knexSqlite.schema.createTable('ConversaoXml',  (table) => {
            table.increments('id').primary()
            table.string('EMPRESA')
            table.string('DTCONTABIL')
            table.string('CONTA')
            table.string('RESULTADO')
            table.string('TIPO')
            table.string('VALOR')
            table.string('HISTORICO')
            table.string('PESSOA')
        })
      }
    })
};

createTableConversaoXml(knexSqlite)


module.exports = { knexSqlite }