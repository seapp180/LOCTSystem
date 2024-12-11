const { Client } = require('pg');
const oracledb = require("oracledb");
require("dotenv").config();
oracledb.initOracleClient({
    tnsAdmin: "D:\\app\\\Chayanon.I\\product\\11.2.0\\client_2\\network\\admin",
});
 
const ConnectOracleDB = async (ConnType) => {
    const oracledb = require("oracledb");
 
    if (ConnType === "FPC"){
        const FPC = {
            user: process.env.FPC_USER,
            password: process.env.FPC_PASSWORD,
            connectString : process.env.FPC_CONNECTION_STRING,
        };
        const connection = await oracledb.getConnection(FPC);
        return connection;
    }else if (ConnType === "CUSR"){
        const CUSR = {
            user: process.env.CUSR_USER,
            password: process.env.CUSR_PASSWORD,
            connectString : process.env.CUSR_CONNECTION_STRING,
        };
        console.log(process.env.CUSR_USER,process.env.CUSR_PASSWORD,process.env.CUSR_CONNECTION_STRING)
        const connection = await oracledb.getConnection(CUSR);
        return connection;
    }else if (ConnType === "HR"){
        const HR = {
            user: process.env.HR_USER,
            password: process.env.HR_PASSWORD,
            connectString : process.env.HR_CONNECTION_STRING,
        };
        console.log(process.env.HR_USER,process.env.HR_PASSWORD,process.env.HR_CONNECTION_STRING)
        const connection = await oracledb.getConnection(HR);
        return connection;
    }
};
 
const DisconnectOracleDB = async (connection) => {
    await connection.close();
    // console.log("Disconnected from Oracle");
}
 
 
module.exports = { ConnectOracleDB, DisconnectOracleDB};