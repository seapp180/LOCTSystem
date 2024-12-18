const { ConnectOracleDB, DisconnectOracleDB } = require("../Common/DBconnection.cjs");

const oracledb = require("oracledb");
require("dotenv").config();

module.exports.rptSummaryFactory = async function (req, res) {
    try {
        const P_REQ_TYPE = req.query.P_REQ_TYPE
        const P_FISICAL_YEAR = req.query.P_FISICAL_YEAR
        const P_FACTORY = req.query.P_FACTORY
        const P_CC = req.query.P_CC
        const P_APP_MONTH_FRM = req.query.P_APP_MONTH_FRM
        const P_APP_MONTH_TO = req.query.P_APP_MONTH_TO

        const connect = await ConnectOracleDB("HR");
        let query = "";
        query += ` SELECT P_MONTH, `;
        query += `        P_FACTORY, `;
        query += `        NVL(COUNT(DISTINCT P_LEADER),0) AS P_OF_LEADER, `;
        query += `        NVL(SUM(CASE WHEN P_STATUS = 'WT' THEN 1 END),0) AS P_WAIT_APP, `;
        query += `        NVL(SUM(CASE WHEN P_STATUS = 'FN' THEN 1 END),0) AS P_APP, `;
        query += `        NVL(SUM(CASE WHEN P_STATUS = 'FN' AND P_EVA_STS = 'Y' THEN 1 END),0) AS P_IMPLEMENT, `;
        query += `        TRIM(TO_CHAR(NVL(SUM(P_MH),0),'9,999,990.00')) AS P_MH, `;
        query += `        P_MONTH_SORT `;
        query += `   FROM (SELECT DECODE(T.LRH_REQ_STATUS,'WT',TO_CHAR(T.LRH_REQ_DATE, 'YYYY-Mon'),'FN',TO_CHAR(T.LRH_LEADER_APP_DATE, 'YYYY-Mon')) AS P_MONTH, `;
        query += `                T.LRH_FACTORY AS P_FACTORY, `;
        query += `                T.LRH_LEADER_APP_BY AS P_LEADER, `;
        query += `                T.LRH_REQ_STATUS AS P_STATUS, `;
        query += `                T.LRH_EVALUATE_STS AS P_EVA_STS, `;
        query += `                T.LRH_MH_TSAVE AS P_MH, `;
        query += `                DECODE(T.LRH_REQ_STATUS,'WT',TO_CHAR(T.LRH_REQ_DATE, 'YYYYMM'),'FN',TO_CHAR(T.LRH_LEADER_APP_DATE, 'YYYYMM')) AS P_MONTH_SORT `;
        query += `           FROM LOCT_REQUEST_HEADER T `;
        query += `          WHERE 1 = 1            `;
        query += `            AND (DECODE(T.LRH_REQ_STATUS,'WT',TO_CHAR(T.LRH_REQ_DATE, 'YYYY'),'FN',TO_CHAR(T.LRH_LEADER_APP_DATE, 'YYYY')) = '${P_FISICAL_YEAR}' OR '${P_FISICAL_YEAR}' IS NULL) `;
        query += `            AND (T.LRH_FACTORY = '${P_FACTORY}' OR '${P_FACTORY}' IS NULL) `;
        query += `            AND (T.LRH_REQ_TYPE IN (SELECT TRIM(REGEXP_SUBSTR('${P_REQ_TYPE}', '[^,]+', 1, LEVEL)) AS LRH_REQ_TYPE FROM DUAL CONNECT BY LEVEL <= LENGTH('${P_REQ_TYPE}') - LENGTH(REPLACE('${P_REQ_TYPE}', ',', '')) + 1) OR '${P_REQ_TYPE}' = 'ALL') `;
        query += `            AND (T.LRH_COST_CENTER = '${P_CC}' OR '${P_CC}' IS NULL) `;
        query += `            AND (DECODE(T.LRH_REQ_STATUS,'WT',TO_CHAR(T.LRH_REQ_DATE, 'YYYYMM'),'FN',TO_CHAR(T.LRH_LEADER_APP_DATE, 'YYYYMM')) >= '${P_FISICAL_YEAR}${P_APP_MONTH_FRM}' OR '${P_APP_MONTH_FRM}' IS NULL) `;
        query += `            AND (DECODE(T.LRH_REQ_STATUS,'WT',TO_CHAR(T.LRH_REQ_DATE, 'YYYYMM'),'FN',TO_CHAR(T.LRH_LEADER_APP_DATE, 'YYYYMM')) <= DECODE('${P_APP_MONTH_TO}','','','01',TO_CHAR(TO_DATE('15/01/${P_FISICAL_YEAR}','DD/MM/YYYY') + 365,'YYYYMM'),'02',TO_CHAR(TO_DATE('15/02/${P_FISICAL_YEAR}','DD/MM/YYYY') + 365,'YYYYMM'),'03',TO_CHAR(TO_DATE('15/03/${P_FISICAL_YEAR}','DD/MM/YYYY') + 365,'YYYYMM'),'${P_FISICAL_YEAR}' || '${P_APP_MONTH_TO}') OR '${P_APP_MONTH_TO}' IS NULL)) A `;
        query += `  GROUP BY P_MONTH, P_FACTORY, P_MONTH_SORT `;
        query += `  ORDER BY P_MONTH_SORT `;

        const result = await connect.execute(query);
        DisconnectOracleDB(connect);

        const data = result.rows.map(row => ({
            P_MONTH: row[0],
            P_FACTORY: row[1],
            P_OF_LEADER: row[2],
            P_WAIT_APP: row[3],
            P_APP: row[4],
            P_IMPLEMENT: row[5],
            P_MH: row[6],
            P_MONTH_SORT: row[7]

        }));

        res.json(data);
    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        res.status(500).send("ข้อผิดพลาดในการค้นหาข้อมูล");
    }
};

module.exports.rptSummaryCC = async function (req, res) {
    try {
        const P_REQ_TYPE = req.query.P_REQ_TYPE
        const P_FISICAL_YEAR = req.query.P_FISICAL_YEAR
        const P_FACTORY = req.query.P_FACTORY
        const P_CC = req.query.P_CC
        const P_APP_MONTH_FRM = req.query.P_APP_MONTH_FRM
        const P_APP_MONTH_TO = req.query.P_APP_MONTH_TO

        const connect = await ConnectOracleDB("HR");
        let query = "";
        query += ` SELECT P_MONTH, `;
        query += `        P_FACTORY, `;
        query += `        P_CC, `;
        query += `        NVL(COUNT(DISTINCT P_LEADER),0) AS P_OF_LEADER, `;
        query += `        NVL(SUM(CASE WHEN P_STATUS = 'WT' THEN 1 END),0) AS P_WAIT_APP, `;
        query += `        NVL(SUM(CASE WHEN P_STATUS = 'FN' THEN 1 END),0) AS P_APP, `;
        query += `        NVL(SUM(CASE WHEN P_STATUS = 'FN' AND P_EVA_STS = 'Y' THEN 1 END),0) AS P_IMPLEMENT, `;
        query += `        TRIM(TO_CHAR(NVL(SUM(P_MH),0),'9,999,990.00')) AS P_MH, `;
        query += `        P_MONTH_SORT `;
        query += `   FROM (SELECT DECODE(T.LRH_REQ_STATUS,'WT',TO_CHAR(T.LRH_REQ_DATE, 'YYYY-Mon'),'FN',TO_CHAR(T.LRH_LEADER_APP_DATE, 'YYYY-Mon')) AS P_MONTH, `;
        query += `                T.LRH_FACTORY AS P_FACTORY, `;
        query += `                T.LRH_COST_CENTER AS P_CC, `;
        query += `                T.LRH_LEADER_APP_BY AS P_LEADER, `;
        query += `                T.LRH_REQ_STATUS AS P_STATUS, `;
        query += `                T.LRH_EVALUATE_STS AS P_EVA_STS, `;
        query += `                T.LRH_MH_TSAVE AS P_MH, `;
        query += `                DECODE(T.LRH_REQ_STATUS,'WT',TO_CHAR(T.LRH_REQ_DATE, 'YYYYMM'),'FN',TO_CHAR(T.LRH_LEADER_APP_DATE, 'YYYYMM')) AS P_MONTH_SORT `;
        query += `           FROM LOCT_REQUEST_HEADER T `;
        query += `          WHERE 1 = 1            `;
        query += `            AND (DECODE(T.LRH_REQ_STATUS,'WT',TO_CHAR(T.LRH_REQ_DATE, 'YYYY'),'FN',TO_CHAR(T.LRH_LEADER_APP_DATE, 'YYYY')) = '${P_FISICAL_YEAR}' OR '${P_FISICAL_YEAR}' IS NULL) `;
        query += `            AND (T.LRH_FACTORY = '${P_FACTORY}' OR '${P_FACTORY}' IS NULL) `;
        query += `            AND (T.LRH_REQ_TYPE IN (SELECT TRIM(REGEXP_SUBSTR('${P_REQ_TYPE}', '[^,]+', 1, LEVEL)) AS LRH_REQ_TYPE FROM DUAL CONNECT BY LEVEL <= LENGTH('${P_REQ_TYPE}') - LENGTH(REPLACE('${P_REQ_TYPE}', ',', '')) + 1) OR '${P_REQ_TYPE}' = 'ALL') `;
        query += `            AND (T.LRH_COST_CENTER = '${P_CC}' OR '${P_CC}' IS NULL) `;
        query += `            AND (DECODE(T.LRH_REQ_STATUS,'WT',TO_CHAR(T.LRH_REQ_DATE, 'YYYYMM'),'FN',TO_CHAR(T.LRH_LEADER_APP_DATE, 'YYYYMM')) >= '${P_FISICAL_YEAR}${P_APP_MONTH_FRM}' OR '${P_APP_MONTH_FRM}' IS NULL) `;
        query += `            AND (DECODE(T.LRH_REQ_STATUS,'WT',TO_CHAR(T.LRH_REQ_DATE, 'YYYYMM'),'FN',TO_CHAR(T.LRH_LEADER_APP_DATE, 'YYYYMM')) <= DECODE('${P_APP_MONTH_TO}','','','01',TO_CHAR(TO_DATE('15/01/${P_FISICAL_YEAR}','DD/MM/YYYY') + 365,'YYYYMM'),'02',TO_CHAR(TO_DATE('15/02/${P_FISICAL_YEAR}','DD/MM/YYYY') + 365,'YYYYMM'),'03',TO_CHAR(TO_DATE('15/03/${P_FISICAL_YEAR}','DD/MM/YYYY') + 365,'YYYYMM'),'${P_FISICAL_YEAR}' || '${P_APP_MONTH_TO}') OR '${P_APP_MONTH_TO}' IS NULL)) A `;
        query += `  GROUP BY P_MONTH, P_FACTORY, P_CC, P_MONTH_SORT `;
        query += `  ORDER BY P_MONTH_SORT `;

        const result = await connect.execute(query);
        DisconnectOracleDB(connect);

        const data = result.rows.map(row => ({
            P_MONTH: row[0],
            P_FACTORY: row[1],
            P_CC: row[2],
            P_OF_LEADER: row[3],
            P_WAIT_APP: row[4],
            P_APP: row[5],
            P_IMPLEMENT: row[6],
            P_MH: row[7],
            P_MONTH_SORT: row[8]
        }));

        res.json(data);
    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        res.status(500).send("ข้อผิดพลาดในการค้นหาข้อมูล");
    }
};

module.exports.rptSummaryCenter = async function (req, res) {
    try {
        const P_REQ_TYPE = req.query.P_REQ_TYPE
        const P_FISICAL_YEAR = req.query.P_FISICAL_YEAR
        const P_FACTORY = req.query.P_FACTORY
        const P_CC = req.query.P_CC
        const P_APP_MONTH_FRM = req.query.P_APP_MONTH_FRM
        const P_APP_MONTH_TO = req.query.P_APP_MONTH_TO

        const connect = await ConnectOracleDB("HR");
        let query = "";
        query += ` SELECT A.P_MONTH, `;
        query += `        A.P_CC, `;
        query += `        A.P_LEADER_NAME, `;
        query += `        P.LTD_MEMBER_AMOUNT AS P_TOTAL_OPERATOR, `;
        query += `        COUNT(DISTINCT A.P_ISS_BY) AS P_TOTAL_PATICIPATE,        `;
        query += `        (ROUND((COUNT(DISTINCT A.P_ISS_BY) / P.LTD_MEMBER_AMOUNT) * 100, 0)) || '%' AS P_PATICIPATE, `;
        query += `        NVL(SUM(CASE WHEN A.P_SUBMIT_TO = 'Y' THEN 1 END),0) AS P_SUBMIT_TO, `;
        query += `        COUNT(A.P_REG_NO) AS P_TOTAL_ISS, `;
        query += `        NVL(SUM(CASE WHEN A.P_STATUS = 'WT' THEN 1 END),0) AS P_WAIT_APP, `;
        query += `        NVL(SUM(CASE WHEN A.P_EVA_STS = 'Y' THEN 1 END),0) AS P_IMPLEMENT, `;
        query += `        TRIM(TO_CHAR(NVL(SUM(A.P_MH),0),'9,999,990.00')) AS P_MH, `;
        query += `        TRIM(TO_CHAR(NVL(SUM(A.P_MC),0),'9,999,990.00')) AS P_MC, `;
        query += `        A.P_MONTH_SORT `;
        query += `   FROM (SELECT DECODE(T.LRH_REQ_STATUS,'WT',TO_CHAR(T.LRH_REQ_DATE, 'YYYY-Mon'),'FN',TO_CHAR(T.LRH_LEADER_APP_DATE, 'YYYY-Mon')) AS P_MONTH, `;
        query += `                T.LRH_COST_CENTER AS P_CC, `;
        query += `                T.LRH_LEADER_APP_BY AS P_LEADER, `;
        query += `                T.LRH_LEADER_APP_BY || ' : ' || UPPER(SUBSTR(H.ENAME,1,1)) || LOWER(SUBSTR(H.ENAME,2,LENGTH(H.ENAME)-1)) || ' ' || UPPER(SUBSTR(H.ESURNAME,1,1)) || LOWER(SUBSTR(H.ESURNAME,2,LENGTH(H.ESURNAME)-1)) AS P_LEADER_NAME, `;
        query += `                T.LRH_REQ_STATUS AS P_STATUS, `;
        query += `                T.LRH_EVALUATE_STS AS P_EVA_STS, `;
        query += `                T.LRH_MH_TSAVE AS P_MH, `;
        query += `                DECODE(T.LRH_REQ_STATUS,'WT',TO_CHAR(T.LRH_REQ_DATE, 'YYYYMM'),'FN',TO_CHAR(T.LRH_LEADER_APP_DATE, 'YYYYMM')) AS P_MONTH_SORT, `;
        query += `                T.LRH_REQ_BY AS P_ISS_BY, `;
        query += `                T.LRH_REQ_NO AS P_REG_NO, `;
        query += `                T.LRH_SUMIT_TO_SG AS P_SUBMIT_TO, `;
        query += `                T.LRH_MC_TSAVE AS P_MC, `;
        query += `                DECODE(T.LRH_REQ_STATUS,'WT',TO_CHAR(T.LRH_REQ_DATE, 'MM_YYYY'),'FN',TO_CHAR(T.LRH_LEADER_APP_DATE, 'MM_YYYY')) AS P_MONTH_YEAR `;
        query += `           FROM LOCT_REQUEST_HEADER T `;
        query += `           LEFT JOIN CUSR.CU_USER_HUMANTRIX H ON H.EMPCODE = T.LRH_LEADER_APP_BY `;
        query += `          WHERE 1 = 1            `;
        query += `            AND (DECODE(T.LRH_REQ_STATUS,'WT',TO_CHAR(T.LRH_REQ_DATE, 'YYYY'),'FN',TO_CHAR(T.LRH_LEADER_APP_DATE, 'YYYY')) = '${P_FISICAL_YEAR}' OR '${P_FISICAL_YEAR}' IS NULL) `;
        query += `            AND (T.LRH_FACTORY = '${P_FACTORY}' OR '${P_FACTORY}' IS NULL) `;
        query += `            AND (T.LRH_REQ_TYPE IN (SELECT TRIM(REGEXP_SUBSTR('${P_REQ_TYPE}', '[^,]+', 1, LEVEL)) AS LRH_REQ_TYPE FROM DUAL CONNECT BY LEVEL <= LENGTH('${P_REQ_TYPE}') - LENGTH(REPLACE('${P_REQ_TYPE}', ',', '')) + 1) OR '${P_REQ_TYPE}' = 'ALL') `;
        query += `            AND (T.LRH_COST_CENTER = '${P_CC}' OR '${P_CC}' IS NULL) `;
        query += `            AND (DECODE(T.LRH_REQ_STATUS,'WT',TO_CHAR(T.LRH_REQ_DATE, 'YYYYMM'),'FN',TO_CHAR(T.LRH_LEADER_APP_DATE, 'YYYYMM')) >= '${P_FISICAL_YEAR}${P_APP_MONTH_FRM}' OR '${P_APP_MONTH_FRM}' IS NULL) `;
        query += `            AND (DECODE(T.LRH_REQ_STATUS,'WT',TO_CHAR(T.LRH_REQ_DATE, 'YYYYMM'),'FN',TO_CHAR(T.LRH_LEADER_APP_DATE, 'YYYYMM')) <= DECODE('${P_APP_MONTH_TO}','','','01',TO_CHAR(TO_DATE('15/01/${P_FISICAL_YEAR}','DD/MM/YYYY') + 365,'YYYYMM'),'02',TO_CHAR(TO_DATE('15/02/${P_FISICAL_YEAR}','DD/MM/YYYY') + 365,'YYYYMM'),'03',TO_CHAR(TO_DATE('15/03/${P_FISICAL_YEAR}','DD/MM/YYYY') + 365,'YYYYMM'),'${P_FISICAL_YEAR}' || '${P_APP_MONTH_TO}') OR '${P_APP_MONTH_TO}' IS NULL)) A `;
        query += `     INNER JOIN LOCT_TEAM_DETAIL P ON P.LTD_LD_EMP_ID = A.P_LEADER AND P.LTD_APP_FISCALYR = A.P_MONTH_YEAR `;
        query += `  GROUP BY A.P_MONTH, A.P_CC, A.P_MONTH_SORT, A.P_LEADER, A.P_LEADER_NAME, P.LTD_LD_EMP_ID, P.LTD_APP_FISCALYR, P.LTD_MEMBER_AMOUNT `;
        query += `  ORDER BY P_MONTH_SORT, A.P_LEADER `;
        const result = await connect.execute(query);
        DisconnectOracleDB(connect);

        const data = result.rows.map(row => ({
            P_MONTH: row[0],
            P_CC: row[1],
            P_LEADER_NAME: row[2],
            P_TOTAL_OPERATOR: row[3],
            P_TOTAL_PATICIPATE: row[4],
            P_PATICIPATE: row[5],
            P_SUBMIT_TO: row[6],
            P_TOTAL_ISS: row[7],
            P_WAIT_APP: row[8],
            P_IMPLEMENT: row[9],
            P_MH: row[10],
            P_MC: row[11],
            P_MONTH_SORT: row[12]
        }));

        res.json(data);
    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        res.status(500).send("ข้อผิดพลาดในการค้นหาข้อมูล");
    }
};

module.exports.rptSummaryLeader = async function (req, res) {
    try {
        const P_REQ_TYPE = req.query.P_REQ_TYPE
        const P_FISICAL_YEAR = req.query.P_FISICAL_YEAR
        const P_FACTORY = req.query.P_FACTORY
        const P_CC = req.query.P_CC
        const P_APP_MONTH_FRM = req.query.P_APP_MONTH_FRM
        const P_APP_MONTH_TO = req.query.P_APP_MONTH_TO

        const connect = await ConnectOracleDB("HR");
        let query = "";
        query += ` SELECT P_MONTH, `;
        query += `        P_FACTORY, `;
        query += `        P_LEADER, `;
        query += `        P_LEADER_NAME, `;
        query += `        P_CC, `;
        query += `        NVL(SUM(CASE WHEN P_STATUS = 'WT' THEN 1 END),0) AS P_WAIT_APP, `;
        query += `        NVL(SUM(CASE WHEN P_STATUS = 'FN' THEN 1 END),0) AS P_APP, `;
        query += `        NVL(SUM(CASE WHEN P_STATUS = 'FN' AND P_EVA_STS = 'Y' THEN 1 END),0) AS P_IMPLEMENT, `;
        query += `        TRIM(TO_CHAR(NVL(SUM(P_MH),0),'9,999,990.00')) AS P_MH, `;
        query += `        P_MONTH_SORT `;
        query += `   FROM (SELECT DECODE(T.LRH_REQ_STATUS,'WT',TO_CHAR(T.LRH_REQ_DATE, 'YYYY-Mon'),'FN',TO_CHAR(T.LRH_LEADER_APP_DATE, 'YYYY-Mon')) AS P_MONTH,                `;
        query += `                T.LRH_FACTORY AS P_FACTORY, `;
        query += `                T.LRH_LEADER_APP_BY AS P_LEADER, `;
        query += `                UPPER(SUBSTR(H.ENAME,1,1)) || LOWER(SUBSTR(H.ENAME,2,LENGTH(H.ENAME)-1)) || ' ' || UPPER(SUBSTR(H.ESURNAME,1,1)) || LOWER(SUBSTR(H.ESURNAME,2,LENGTH(H.ESURNAME)-1)) AS P_LEADER_NAME, `;
        query += `                H.COST_CENTER AS P_CC, `;
        query += `                T.LRH_REQ_STATUS AS P_STATUS, `;
        query += `                T.LRH_EVALUATE_STS AS P_EVA_STS, `;
        query += `                T.LRH_MH_TSAVE AS P_MH, `;
        query += `                DECODE(T.LRH_REQ_STATUS,'WT',TO_CHAR(T.LRH_REQ_DATE, 'YYYYMM'),'FN',TO_CHAR(T.LRH_LEADER_APP_DATE, 'YYYYMM')) AS P_MONTH_SORT `;
        query += `           FROM LOCT_REQUEST_HEADER T `;
        query += `           LEFT JOIN CUSR.CU_USER_HUMANTRIX H ON H.EMPCODE = T.LRH_LEADER_APP_BY  `;
        query += `          WHERE 1 = 1            `;
        query += `            AND (DECODE(T.LRH_REQ_STATUS,'WT',TO_CHAR(T.LRH_REQ_DATE, 'YYYY'),'FN',TO_CHAR(T.LRH_LEADER_APP_DATE, 'YYYY')) = '${P_FISICAL_YEAR}' OR '${P_FISICAL_YEAR}' IS NULL) `;
        query += `            AND (T.LRH_FACTORY = '${P_FACTORY}' OR '${P_FACTORY}' IS NULL) `;
        query += `            AND (T.LRH_REQ_TYPE IN (SELECT TRIM(REGEXP_SUBSTR('${P_REQ_TYPE}', '[^,]+', 1, LEVEL)) AS LRH_REQ_TYPE FROM DUAL CONNECT BY LEVEL <= LENGTH('${P_REQ_TYPE}') - LENGTH(REPLACE('${P_REQ_TYPE}', ',', '')) + 1) OR '${P_REQ_TYPE}' = 'ALL') `;
        query += `            AND (T.LRH_COST_CENTER = '${P_CC}' OR '${P_CC}' IS NULL) `;
        query += `            AND (DECODE(T.LRH_REQ_STATUS,'WT',TO_CHAR(T.LRH_REQ_DATE, 'YYYYMM'),'FN',TO_CHAR(T.LRH_LEADER_APP_DATE, 'YYYYMM')) >= '${P_FISICAL_YEAR}${P_APP_MONTH_FRM}' OR '${P_APP_MONTH_FRM}' IS NULL) `;
        query += `            AND (DECODE(T.LRH_REQ_STATUS,'WT',TO_CHAR(T.LRH_REQ_DATE, 'YYYYMM'),'FN',TO_CHAR(T.LRH_LEADER_APP_DATE, 'YYYYMM')) <= DECODE('${P_APP_MONTH_TO}','','','01',TO_CHAR(TO_DATE('15/01/${P_FISICAL_YEAR}','DD/MM/YYYY') + 365,'YYYYMM'),'02',TO_CHAR(TO_DATE('15/02/${P_FISICAL_YEAR}','DD/MM/YYYY') + 365,'YYYYMM'),'03',TO_CHAR(TO_DATE('15/03/${P_FISICAL_YEAR}','DD/MM/YYYY') + 365,'YYYYMM'),'${P_FISICAL_YEAR}' || '${P_APP_MONTH_TO}') OR '${P_APP_MONTH_TO}' IS NULL)) A `;
        query += `  GROUP BY P_MONTH, P_FACTORY, P_CC, P_MONTH_SORT, P_LEADER, P_LEADER_NAME `;
        query += `  ORDER BY P_MONTH_SORT, P_LEADER `;
        const result = await connect.execute(query);
        DisconnectOracleDB(connect);

        const data = result.rows.map(row => ({
            P_MONTH: row[0],
            P_FACTORY: row[1],
            P_LEADER_ID: row[2],
            P_LEADER_NAME: row[3],
            P_CC: row[4],
            P_WAIT_APP: row[5],
            P_APP: row[6],
            P_IMPLEMENT: row[7],
            P_MH: row[8],
            P_MONTH_SORT: row[9]
        }));

        res.json(data);
    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        res.status(500).send("ข้อผิดพลาดในการค้นหาข้อมูล");
    }
};