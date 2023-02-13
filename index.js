let csvToJson = require('convert-csv-to-json');
const {PythonShell} = require('python-shell');
const { knexSqlite } = require('./config/db')
var fs = require('fs'); 
const xmlFormat = require('xml-formatter');

(async () => {
    await PythonShell.run('script.py', null, async function (err, results) {
        const [fileCsv] =  await results
        //console.log(fileCsv)
        //let teste = await fs.readFileSync(fileCsv, {encoding: "binary"})

        //const fileCsvJson = csvToJson.parseSubArray('*',';').getJsonFromCsv(fileCsv);
        const fileCsvJson = await csvToJson.latin1Encoding().parseSubArray('*',';').getJsonFromCsv(fileCsv);
        const fileCsvAjustado = (JSON.parse(JSON.stringify(fileCsvJson).replaceAll('C.RESULTADO','RESULTADO')))

        const script1 = `SELECT   (CASE WHEN C.EMPRESA = 1 THEN 1 ELSE 101 END) AS EMPRESA, 
                                  C.DTCONTABIL AS DTCONTABIL
                         FROM     ConversaoXml C
                         GROUP BY (CASE WHEN C.EMPRESA = 1 THEN 1 ELSE 101 END), C.DTCONTABIL`

        await knexSqlite('ConversaoXml').del().then().catch(error => console.log(error)) //Zera o BD
        await knexSqlite('ConversaoXml').insert(fileCsvAjustado).then().catch(error => console.log(error)) //Insere os Dados do CSV

        const dadosAgrupados = await knexSqlite.raw(script1)
        const dados = await knexSqlite('ConversaoXml').orderBy([{ column: 'EMPRESA', order: 'asc' }, { column: 'RESULTADO', order: 'asc' }])

        let xml = ''
        for(let i = 0; i < dadosAgrupados.length; i++) {
            xml += `<LancamentoImportacao>
                        <NROEMPRESA>${dadosAgrupados[i].EMPRESA == 1 ? 1 : 101}</NROEMPRESA>
                        <DTACONTABIL>${dadosAgrupados[i].DTCONTABIL.replaceAll('/','-')}</DTACONTABIL>
                        <NROLOTE>12</NROLOTE>
                        <EXTEMPORANEO>N</EXTEMPORANEO>
                    <LancamentoContas>`
            for(let j = 0; j < dados.length; j++) {
                if(dadosAgrupados[i].EMPRESA == dados[j].EMPRESA && dadosAgrupados[i].DTCONTABIL == dados[j].DTCONTABIL && dados[j].EMPRESA == 1) {
                    xml += `<LancamentoConta>
                                <CONTA>${dados[j].CONTA.replaceAll('.','')}</CONTA>
                                <TIPO>${dados[j].TIPO}</TIPO>
                                <VALOR>${dados[j].VALOR.replaceAll(',','.').replaceAll('"','')}</VALOR>
                                <HISTORICOCOMPLETO>${dados[j].HISTORICO}</HISTORICOCOMPLETO>
                                <LancamentoContaParams>
                                    <LancamentoContaParam>
                                        <PARAMETRO>E</PARAMETRO>
                                        <SEQPARAMETROVALOR>${dados[j].EMPRESA}</SEQPARAMETROVALOR>
                                    </LancamentoContaParam>
                                    ${dados[j].RESULTADO == '' ? `` : `<LancamentoContaParam>
                                                                                <PARAMETRO>T</PARAMETRO>
                                                                                <SEQPARAMETROVALOR>${dados[j].RESULTADO.replaceAll('.','')}</SEQPARAMETROVALOR>
                                                                        </LancamentoContaParam>`}
                                </LancamentoContaParams>
                            </LancamentoConta>`
                } else if(dados[j].EMPRESA != 1) {
                    xml += `<LancamentoConta>
                                <CONTA>${dados[j].CONTA.replaceAll('.','')}</CONTA>
                                <TIPO>${dados[j].TIPO}</TIPO>
                                <VALOR>${dados[j].VALOR.replaceAll(',','.').replaceAll('"','')}</VALOR>
                                <HISTORICOCOMPLETO>${dados[j].HISTORICO}</HISTORICOCOMPLETO>
                                <LancamentoContaParams>
                                    <LancamentoContaParam>
                                        <PARAMETRO>E</PARAMETRO>
                                        <SEQPARAMETROVALOR>${dados[j].EMPRESA}</SEQPARAMETROVALOR>
                                    </LancamentoContaParam>
                                    ${dados[j].RESULTADO == '' ? `` : `<LancamentoContaParam>
                                                                                <PARAMETRO>T</PARAMETRO>
                                                                                <SEQPARAMETROVALOR>${dados[j].RESULTADO.replaceAll('.','')}</SEQPARAMETROVALOR>
                                                                        </LancamentoContaParam>`}
                                </LancamentoContaParams>
                        </LancamentoConta>`
                }
            }
                xml += `</LancamentoContas>
                        </LancamentoImportacao>`
        }
        let xmlCompleto = `
            <ImportacaoLancamentoDTO>
                <ListaLancamentos>
                    ${xml}
                </ListaLancamentos>
            </ImportacaoLancamentoDTO>`

        console.log(fileCsv)
        await fs.writeFileSync(fileCsv.replaceAll('.csv','.xml'), xmlFormat(xmlCompleto, {
            indentation: '  ', 
            filter: (node) => node.type !== 'Comment', 
            collapseContent: true, 
            lineSeparator: '\n'
        }))
        process.exit()
    })
})()