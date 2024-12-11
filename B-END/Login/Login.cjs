const { ConnectOracleDB, DisconnectOracleDB } = require("../Common/DBconnection.cjs");
// const { writeLogError } = require("../Common/LogFuction.cjs");
 
module.exports.getLoginHR = async function (req, res) {
    try {
        const P_EMPID = req.query.P_EMPID
 
        const connect = await ConnectOracleDB("CUSR");
        let query = "";
        query += ` SELECT EMPCODE AS USER_EMP_ID, `;
        query += `      (UPPER(SUBSTR(ENAME, 1, 1)) || `;
        query += `      LOWER(SUBSTR(ENAME, 2, LENGTH(ENAME) - 1))) AS USER_FNAME, `;
        query += `      (UPPER(SUBSTR(ESURNAME, 1, 1)) || `;
        query += `      LOWER(SUBSTR(ESURNAME, 2, LENGTH(ESURNAME) - 1))) AS USER_SURNAME, `;
        query += `      (UPPER(SUBSTR(ENAME, 1, 1)) || `;
        query += `      LOWER(SUBSTR(ENAME, 2, LENGTH(ENAME) - 1)) || ('.') || `;
        query += `      UPPER(SUBSTR(ESURNAME, 1, 1))) AS USER_LOGIN, `;
        query += `      (CASE `;
        query += `        WHEN WORK_LOCATION IN ('N1') THEN `;
        query += `         ('1000') `;
        query += `        WHEN WORK_LOCATION IN ('A1') THEN `;
        query += `         ('2000') `;
        query += `        WHEN WORK_LOCATION IN ('N2') THEN `;
        query += `         ('2100') `;
        query += `        WHEN WORK_LOCATION IN ('P1') THEN `;
        query += `         ('2200') `;
        query += `        WHEN WORK_LOCATION IN ('K1') THEN `;
        query += `         ('2300') `;
        query += `        WHEN WORK_LOCATION IN ('L1') THEN `;
        query += `         ('3000') `;
        query += `        WHEN WORK_LOCATION IN ('N3') THEN `;
        query += `         ('5100') `;
        query += `        WHEN WORK_LOCATION IN ('HQ') THEN `;
        query += `         ('9000') `;
        query += `      END) AS FACTORY_CODE, `;
        query += `      WORK_LOCATION AS FACTORY_NAME, `;
        query += `      COST_CENTER AS USER_COSTCENTER, `;
        query += `      STATUS AS STATUS `;
        query += ` FROM CUSR.CU_USER_HUMANTRIX `;
        query += ` WHERE STATUS IN ('Active') `;
        query += `  AND EMPCODE = '${P_EMPID}' `;
        const result = await connect.execute(query);
        DisconnectOracleDB(connect);
        res.json(result.rows);
    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        res.status(500).send("ข้อผิดพลาดในการค้นหาข้อมูล");
    }
};