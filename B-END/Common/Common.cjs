const { ConnectOracleDB, DisconnectOracleDB } = require("./DBconnection.cjs");

module.exports.getFactory = async function (req, res) {
    try {
        const connect = await ConnectOracleDB("CUSR");
        let query = "";
        query += ` SELECT T.FACTORY_CODE AS "value", T.FACTORY_NAME AS "label" `;
        query += `   FROM CUSR.CU_FACTORY_M T `;
        query += `  WHERE T.FACTORY_STATUS = 'A' `;
        query += `  ORDER BY T.FACTORY_NAME `;
        const result = await connect.execute(query);
        DisconnectOracleDB(connect);
        const data = result.rows.map(row => ({
            value: row[0],
            label: row[1]
        }));
        res.json(data);
    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        res.status(500).send("ข้อผิดพลาดในการค้นหาข้อมูล");
    }
};

module.exports.getCostCenter = async function (req, res) {
    try {
        const connect = await ConnectOracleDB("CUSR");
        let query = "";
        query += ` SELECT T.CC_CTR AS "value", T.CC_CTR || ' : ' || T.CC_DESC AS "label" `;
        query += `   FROM CUSR.CU_MFGPRO_CC_MSTR T `;
        query += `  WHERE T.CC_DOMAIN = '9000' `;
        query += `    AND T.CC_ACTIVE = 1 `;
        query += `  ORDER BY T.CC_CTR `;
        const result = await connect.execute(query);
        DisconnectOracleDB(connect);
        const data = result.rows.map(row => ({
            value: row[0],
            label: row[1]
        }));
        res.json(data);
    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        res.status(500).send("ข้อผิดพลาดในการค้นหาข้อมูล");
    }
};

module.exports.getCostCenterLOCT = async function (req, res) {
        const P_FACTORY = req.query.P_FACTORY
    try {
        const connect = await ConnectOracleDB("HR");
        let query = "";
        query += `   SELECT DISTINCT T.LRH_COST_CENTER AS CC_CTR `;
        query += `     FROM LOCT_REQUEST_HEADER T `;
        query += `    INNER JOIN CUSR.CU_FACTORY_M M ON M.FACTORY_NAME = T.LRH_FACTORY `;
        query += `    WHERE 1 = 1 `;
        query += `      AND (M.FACTORY_CODE = '${P_FACTORY}' OR '${P_FACTORY}' IS NULL) `;
        query += `    ORDER BY T.LRH_COST_CENTER `;

        const result = await connect.execute(query);
        DisconnectOracleDB(connect);
        const data = result.rows.map(row => ({
            value: row[0],
            label: row[0]
        }));
        res.json(data);
    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        res.status(500).send("ข้อผิดพลาดในการค้นหาข้อมูล");
    }
};

module.exports.getStatusLOCT = async function (req, res) {
    try {
        const connect = await ConnectOracleDB("HR");
        let query = "";
        query += ` SELECT A.F_CODE, A.F_DESC `;
        query += `   FROM (SELECT 'ALL' AS F_CODE, 'ALL' AS F_DESC, 0 LCM_SORT `;
        query += `           FROM DUAL `;
        query += `         UNION `;
        query += `         SELECT T.LCM_MASTER_CODE AS F_CODE, `;
        query += `                DECODE(T.LCM_MASTER_CODE, `;
        query += `                       'CT', `;
        query += `                       'Create', `;
        query += `                       'WT', `;
        query += `                       'Wait Approve', `;
        query += `                       'FN', `;
        query += `                       'Finished', `;
        query += `                       'RJ', `;
        query += `                       'Reject From Leader', `;
        query += `                       '') AS F_DESC, `;
        query += `                T.LCM_SORT `;
        query += `           FROM LOCT_CODE_MASTER T `;
        query += `          WHERE T.LCM_GROUP = 'STATUS' `;
        query += `            AND T.LCM_MASTER_STATUS = 'A' `;
        query += `          ORDER BY LCM_SORT) A `;

        const result = await connect.execute(query);
        DisconnectOracleDB(connect);
        const data = result.rows.map(row => ({
            value: row[0],
            label: row[1]
        }));
        res.json(data);
    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        res.status(500).send("ข้อผิดพลาดในการค้นหาข้อมูล");
    }
};
