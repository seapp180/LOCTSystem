const { ConnectOracleDB, DisconnectOracleDB } = require("../Common/DBconnection.cjs");

const oracledb = require("oracledb");
require("dotenv").config();

module.exports.rptDetailLeader = async function (req, res) {
    try {
        const P_REQ_TYPE = req.query.P_REQ_TYPE
        const P_FISICAL_YEAR = req.query.P_FISICAL_YEAR
        const P_FACTORY = req.query.P_FACTORY
        const P_CC = req.query.P_CC
        const P_APP_MONTH_FRM = req.query.P_APP_MONTH_FRM
        const P_APP_MONTH_TO = req.query.P_APP_MONTH_TO
        const P_LEADER_ID = req.query.P_LEADER_ID
        const P_LEADER_NAME = req.query.P_LEADER_NAME

        const connect = await ConnectOracleDB("HR");
        let query = "";
        query += ` SELECT P_MONTH, `;
        query += `        P_LEADER_ID, `;
        query += `        P_OPERATOR_ID, `;
        query += `        P_OPERATOR_NAME, `;
        query += `        P_CC, `;
        query += `        NVL(SUM(CASE WHEN P_STATUS = 'WT' THEN 1 END),0) AS P_WAIT_APP, `;
        query += `        NVL(SUM(CASE WHEN P_STATUS = 'FN' THEN 1 END),0) AS P_APP, `;
        query += `        NVL(SUM(CASE WHEN P_STATUS = 'FN' AND P_EVA_STS = 'Y' THEN 1 END),0) AS P_IMPLEMENT, `;
        query += `        TRIM(TO_CHAR(NVL(SUM(P_MH),0),'9,999,990.00')) AS P_MH, `;
        query += `        P_MONTH_SORT `;
        query += `   FROM (SELECT DECODE(T.LRH_REQ_STATUS,'WT',TO_CHAR(T.LRH_REQ_DATE, 'YYYY-Mon'),'FN',TO_CHAR(T.LRH_LEADER_APP_DATE, 'YYYY-Mon')) AS P_MONTH,                `;
        query += `                T.LRH_REQ_BY AS P_OPERATOR_ID, `;
        query += `                UPPER(SUBSTR(HO.ENAME,1,1)) || LOWER(SUBSTR(HO.ENAME,2,LENGTH(HO.ENAME)-1)) || ' ' || UPPER(SUBSTR(HO.ESURNAME,1,1)) || LOWER(SUBSTR(HO.ESURNAME,2,LENGTH(HO.ESURNAME)-1)) AS P_OPERATOR_NAME, `;
        query += `                T.LRH_COST_CENTER AS P_CC, `;
        query += `                T.LRH_REQ_STATUS AS P_STATUS, `;
        query += `                T.LRH_EVALUATE_STS AS P_EVA_STS, `;
        query += `                T.LRH_MH_TSAVE AS P_MH, `;
        query += `                T.LRH_LEADER_APP_BY AS P_LEADER_ID, `;
        query += `                DECODE(T.LRH_REQ_STATUS,'WT',TO_CHAR(T.LRH_REQ_DATE, 'YYYYMM'),'FN',TO_CHAR(T.LRH_LEADER_APP_DATE, 'YYYYMM')) AS P_MONTH_SORT `;
        query += `           FROM LOCT_REQUEST_HEADER T `;
        query += `           LEFT JOIN CUSR.CU_USER_HUMANTRIX H ON H.EMPCODE = T.LRH_LEADER_APP_BY `;
        query += `           LEFT JOIN CUSR.CU_USER_HUMANTRIX HO ON HO.EMPCODE = T.LRH_REQ_BY `;
        query += `          WHERE 1 = 1            `;
        query += `            AND (DECODE(T.LRH_REQ_STATUS,'WT',TO_CHAR(T.LRH_REQ_DATE, 'YYYY'),'FN',TO_CHAR(T.LRH_LEADER_APP_DATE, 'YYYY')) = '${P_FISICAL_YEAR}' OR '${P_FISICAL_YEAR}' IS NULL) `;
        query += `            AND (T.LRH_FACTORY = '${P_FACTORY}' OR '${P_FACTORY}' IS NULL) `;
        query += `            AND (T.LRH_REQ_TYPE IN (SELECT TRIM(REGEXP_SUBSTR('${P_REQ_TYPE}', '[^,]+', 1, LEVEL)) AS LRH_REQ_TYPE FROM DUAL CONNECT BY LEVEL <= LENGTH('${P_REQ_TYPE}') - LENGTH(REPLACE('${P_REQ_TYPE}', ',', '')) + 1) OR '${P_REQ_TYPE}' = 'ALL') `;
        query += `            AND (T.LRH_COST_CENTER = '${P_CC}' OR '${P_CC}' IS NULL) `;
        query += `            AND (DECODE(T.LRH_REQ_STATUS,'WT',TO_CHAR(T.LRH_REQ_DATE, 'YYYYMM'),'FN',TO_CHAR(T.LRH_LEADER_APP_DATE, 'YYYYMM')) >= '${P_FISICAL_YEAR}${P_APP_MONTH_FRM}' OR '${P_APP_MONTH_FRM}' IS NULL) `;
        query += `            AND (DECODE(T.LRH_REQ_STATUS,'WT',TO_CHAR(T.LRH_REQ_DATE, 'YYYYMM'),'FN',TO_CHAR(T.LRH_LEADER_APP_DATE, 'YYYYMM')) <= DECODE('${P_APP_MONTH_TO}','','','01',TO_CHAR(TO_DATE('15/01/${P_FISICAL_YEAR}','DD/MM/YYYY') + 365,'YYYYMM'),'02',TO_CHAR(TO_DATE('15/02/${P_FISICAL_YEAR}','DD/MM/YYYY') + 365,'YYYYMM'),'03',TO_CHAR(TO_DATE('15/03/${P_FISICAL_YEAR}','DD/MM/YYYY') + 365,'YYYYMM'),'${P_FISICAL_YEAR}' || '${P_APP_MONTH_TO}') OR '${P_APP_MONTH_TO}' IS NULL) `;
        query += `            AND (T.LRH_LEADER_APP_BY = '${P_LEADER_ID}' OR '${P_LEADER_ID}' IS NULL) `;
        query += `            AND (UPPER(H.ENAME || ' ' || H.ESURNAME) LIKE UPPER('%${P_LEADER_NAME}%'))) A `;
        query += `  GROUP BY P_MONTH, P_CC, P_MONTH_SORT, P_OPERATOR_ID, P_OPERATOR_NAME, P_LEADER_ID `;
        query += `  ORDER BY P_MONTH_SORT, P_OPERATOR_ID `;

        const result = await connect.execute(query);
        DisconnectOracleDB(connect);

        const data = result.rows.map(row => ({
            P_MONTH: row[0],
            P_LEADER_ID: row[1],
            P_OPERATOR_ID: row[2],
            P_OPERATOR_NAME: row[3],
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

module.exports.rptDetailOperator = async function (req, res) {
    try {
        const P_REQ_TYPE = req.query.P_REQ_TYPE
        const P_FISICAL_YEAR = req.query.P_FISICAL_YEAR
        const P_FACTORY = req.query.P_FACTORY
        const P_CC = req.query.P_CC
        const P_APP_MONTH_FRM = req.query.P_APP_MONTH_FRM
        const P_APP_MONTH_TO = req.query.P_APP_MONTH_TO
        const P_LEADER_ID = req.query.P_LEADER_ID
        const P_LEADER_NAME = req.query.P_LEADER_NAME
        const P_OPR_ID = req.query.P_OPR_ID
        const P_OPR_NAME = req.query.P_OPR_NAME
        const P_MODE = req.query.P_MODE

        const connect = await ConnectOracleDB("HR");
        let query = "";
        query += ` SELECT DECODE(T.LRH_REQ_TYPE,'1','SL','2','L','3','SI','I') AS P_TYPE, `;
        query += `        T.LRH_REQ_NO AS P_REG_NO, `;
        query += `        TS.SCM_MASTER_DESC AS P_TYPE_SGT, `;
        query += `        REPLACE(REPLACE(REPLACE(REPLACE(T.LRH_PROBLEM,'(SL)',''),'(L)',''),'(SI)',''),'(I)','') AS P_SUBJECT, `;
        query += `        T.LRH_DET_BEFORE AS P_BEFORE, `;
        query += `        T.LRH_DET_AFTER AS P_AFTER, `;
        query += `        T.LRH_REQ_BY AS P_OPERATOR_ID, `;
        query += `        UPPER(SUBSTR(HO.ENAME,1,1)) || LOWER(SUBSTR(HO.ENAME,2,LENGTH(HO.ENAME)-1)) || ' ' || UPPER(SUBSTR(HO.ESURNAME,1,1)) || LOWER(SUBSTR(HO.ESURNAME,2,LENGTH(HO.ESURNAME)-1)) AS P_OPERATOR_NAME, `;
        query += `        T.LRH_COST_CENTER AS P_CC, `;
        query += `        T.LRH_LEADER_APP_BY || ' : ' || UPPER(SUBSTR(H.ENAME,1,1)) || LOWER(SUBSTR(H.ENAME,2,LENGTH(H.ENAME)-1)) || ' ' || UPPER(SUBSTR(H.ESURNAME,1,1)) || LOWER(SUBSTR(H.ESURNAME,2,LENGTH(H.ESURNAME)-1)) AS P_ISSUE_NAME, `;
        query += `        TRIM(TO_CHAR(NVL(T.LRH_MH_TSAVE,0),'9,999,990.00')) AS P_MH `;
        query += `   FROM LOCT_REQUEST_HEADER T `;
        query += `   LEFT JOIN CUSR.CU_USER_HUMANTRIX H ON H.EMPCODE = T.LRH_LEADER_APP_BY `;
        query += `   LEFT JOIN CUSR.CU_USER_HUMANTRIX HO ON HO.EMPCODE = T.LRH_REQ_BY `;
        query += `   LEFT JOIN SG_CODE_MASTER TS ON TS.SCM_MASTER_CODE = T.LRH_SG_TYPE `;
        query += `  WHERE 1 = 1            `;
        if (P_MODE === 'ALL') {
        } else if (P_MODE === 'FN') {
            query += `    AND (T.LRH_REQ_STATUS = 'FN') `;
        } else if (P_MODE === 'IM') {
            query += `    AND (T.LRH_REQ_STATUS = 'FN') `;
            query += `    AND (T.LRH_EVALUATE_STS = 'Y') `;
        } else if (P_MODE === 'WT') {
            query += `    AND (T.LRH_REQ_STATUS = 'WT') `;
        }
        query += `    AND (DECODE(T.LRH_REQ_STATUS,'WT',TO_CHAR(T.LRH_REQ_DATE, 'YYYY'),'FN',TO_CHAR(T.LRH_LEADER_APP_DATE, 'YYYY')) = '${P_FISICAL_YEAR}' OR '${P_FISICAL_YEAR}' IS NULL) `;
        query += `    AND (T.LRH_FACTORY = '${P_FACTORY}' OR '${P_FACTORY}' IS NULL) `;
        query += `    AND (T.LRH_REQ_TYPE IN (SELECT TRIM(REGEXP_SUBSTR('${P_REQ_TYPE}', '[^,]+', 1, LEVEL)) AS LRH_REQ_TYPE FROM DUAL CONNECT BY LEVEL <= LENGTH('${P_REQ_TYPE}') - LENGTH(REPLACE('${P_REQ_TYPE}', ',', '')) + 1) OR '${P_REQ_TYPE}' = 'ALL') `;
        query += `    AND (T.LRH_COST_CENTER = '${P_CC}' OR '${P_CC}' IS NULL) `;
        query += `    AND (DECODE(T.LRH_REQ_STATUS,'WT',TO_CHAR(T.LRH_REQ_DATE, 'YYYYMM'),'FN',TO_CHAR(T.LRH_LEADER_APP_DATE, 'YYYYMM')) >= '${P_FISICAL_YEAR}${P_APP_MONTH_FRM}' OR '${P_APP_MONTH_FRM}' IS NULL) `;
        query += `    AND (DECODE(T.LRH_REQ_STATUS,'WT',TO_CHAR(T.LRH_REQ_DATE, 'YYYYMM'),'FN',TO_CHAR(T.LRH_LEADER_APP_DATE, 'YYYYMM')) <= DECODE('${P_APP_MONTH_TO}','','','01',TO_CHAR(TO_DATE('15/01/${P_FISICAL_YEAR}','DD/MM/YYYY') + 365,'YYYYMM'),'02',TO_CHAR(TO_DATE('15/02/${P_FISICAL_YEAR}','DD/MM/YYYY') + 365,'YYYYMM'),'03',TO_CHAR(TO_DATE('15/03/${P_FISICAL_YEAR}','DD/MM/YYYY') + 365,'YYYYMM'),'${P_FISICAL_YEAR}' || '${P_APP_MONTH_TO}') OR '${P_APP_MONTH_TO}' IS NULL) `;
        query += `    AND (T.LRH_LEADER_APP_BY = '${P_LEADER_ID}' OR '${P_LEADER_ID}' IS NULL) `;
        query += `    AND (UPPER(H.ENAME || ' ' || H.ESURNAME) LIKE UPPER('%${P_LEADER_NAME}%')) `;
        query += `    AND (T.LRH_REQ_BY = '${P_OPR_ID}' OR '${P_OPR_ID}' IS NULL) `;
        query += `    AND (UPPER(HO.ENAME || ' ' || HO.ESURNAME) LIKE UPPER('%${P_OPR_NAME}%')) `;
        query += `  ORDER BY DECODE(T.LRH_REQ_STATUS,'WT',TO_CHAR(T.LRH_REQ_DATE, 'YYYYMM'),'FN',TO_CHAR(T.LRH_LEADER_APP_DATE, 'YYYYMM')), T.LRH_REQ_BY, T.LRH_REQ_NO `;

        const result = await connect.execute(query);
        DisconnectOracleDB(connect);

        const data = result.rows.map(row => ({
            P_TYPE: row[0],
            P_REG_NO: row[1],
            P_TYPE_SGT: row[2],
            P_SUBJECT: row[3],
            P_BEFORE: row[4],
            P_AFTER: row[5],
            P_OPERATOR_ID: row[6],
            P_OPERATOR_NAME: row[7],
            P_CC: row[8],
            P_ISSUE_NAME: row[9],
            P_MH: row[10]
        }));

        res.json(data);
    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        res.status(500).send("ข้อผิดพลาดในการค้นหาข้อมูล");
    }
};

module.exports.getCheckRole = async function (req, res) {
    const P_EMP_ID = req.query.P_EMP_ID
    try {
        const connect = await ConnectOracleDB("HR");
        let query = "";
        query += ` SELECT DISTINCT (CASE `;
        query += `                   WHEN COUNT(M.LRH_LEADER_APP_BY) >= 1 THEN `;
        query += `                    'AP' `;
        query += `                   ELSE `;
        query += `                    'IS' `;
        query += `                 END) AS ROLE_EMP `;
        query += `   FROM LOCT_REQUEST_HEADER M `;
        query += `  WHERE M.LRH_LEADER_APP_BY = '${P_EMP_ID}' `;
        const result = await connect.execute(query);
        DisconnectOracleDB(connect);
        res.json(result.rows[0][0]);
    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        res.status(500).send("ข้อผิดพลาดในการค้นหาข้อมูล");
    }
};


module.exports.getTeamDetail = async function (req, res) {
    const P_EMP_ID = req.query.P_EMP_ID
    const P_APP_FISICAL = req.query.P_APP_FISICAL
    try {
        const connect = await ConnectOracleDB("HR");
        let query = "";
        query += ` SELECT T.LTD_LD_LOGIN, `;
        query += `        T.LTD_LD_EMP_ID, `;
        query += `        F.FACTORY_CODE AS F_CODE, `;
        query += `        H.WORK_LOCATION AS F_DESC, `;
        query += `        DECODE(H.WORK_LOCATION,'HQ',H.COST_CENTER,NULL) AS CC_CODE, `;
        query += `        DECODE(H.WORK_LOCATION,'HQ',H.COST_CENTER || ' : ' || C.CC_DESC,NULL) AS CC_DESC,        `;
        query += `        T.LTD_APP_FISCALYR, `;
        query += `        SUBSTR(T.LTD_APP_FISCALYR,4,4) AS P_YEAR, `;
        query += `        SUBSTR(T.LTD_APP_FISCALYR,1,2) AS P_MONTH_CODE, `;
        query += `        TRIM(TO_CHAR(TO_DATE('01_' || T.LTD_APP_FISCALYR,'DD_MM_YYYY'),'Month')) AS P_MONTH_DESC, `;
        query += `        T.LTD_MGR_EMP_ID, `;
        query += `        UPPER(SUBSTR(HM.ENAME,1,1)) || LOWER(SUBSTR(HM.ENAME,2,LENGTH(HM.ENAME)-1)) || ' ' || UPPER(SUBSTR(HM.ESURNAME,1,1)) || LOWER(SUBSTR(HM.ESURNAME,2,LENGTH(HM.ESURNAME)-1)) LTD_MGR_EMP_NAME, `;
        query += `        T.LTD_MEMBER_AMOUNT, `;
        query += `        '' AS LTD_MODIFY_BY `;
        query += `   FROM LOCT_TEAM_DETAIL T `;
        query += `   LEFT JOIN CUSR.CU_USER_HUMANTRIX H ON H.EMPCODE =  T.LTD_LD_EMP_ID `;
        query += `   LEFT JOIN CUSR.CU_FACTORY_M F ON F.FACTORY_NAME = H.WORK_LOCATION `;
        query += `   LEFT JOIN CUSR.CU_MFGPRO_CC_MSTR C ON C.CC_CTR = H.COST_CENTER AND C.CC_DOMAIN = '9000' `;
        query += `   LEFT JOIN CUSR.CU_USER_HUMANTRIX HM ON HM.EMPCODE =  T.LTD_MGR_EMP_ID `;
        query += `  WHERE T.LTD_LD_EMP_ID = '${P_EMP_ID}' `;
        query += `    AND (T.LTD_APP_FISCALYR = '${P_APP_FISICAL}' OR '${P_APP_FISICAL}' IS NULL) `;
        query += `  ORDER BY SUBSTR(T.LTD_APP_FISCALYR,4,4) DESC,CAST(SUBSTR(T.LTD_APP_FISCALYR,1,2) AS INTEGER) DESC `;
        const result = await connect.execute(query);
        DisconnectOracleDB(connect);

        const data = result.rows.map(row => ({
            LTD_LD_LOGIN: row[0],
            LTD_LD_EMP_ID: row[1],
            LTD_FACTORY: { value: row[2], label: row[3] },
            LTD_CC: null,
            LTD_APP_FISCALYR: row[6],
            LTD_YEAR: { value: row[7], label: row[7] },
            LTD_MONTH: { value: row[8], label: row[9] },
            LTD_MGR_EMP_ID: row[10],
            LTD_MGR_EMP_NAME: row[11],
            LTD_MEMBER_AMOUNT: row[12],
            LTD_MODIFY_BY: ''
        }));
        res.json(data);

        // if (result.rows.length > 0) {
        //     const row = result.rows[0];
        //     const data = {
        //         LTD_LD_LOGIN: row[0],
        //         LTD_LD_EMP_ID: row[1],
        //         LTD_FACTORY: { value: row[2], label: row[3] },
        //         LTD_CC: null,
        //         LTD_APP_FISCALYR: row[6],
        //         LTD_YEAR: { value: row[7], label: row[7] },
        //         LTD_MONTH: { value: row[8], label: row[9] },
        //         LTD_MGR_EMP_ID: row[10],
        //         LTD_MGR_EMP_NAME: row[11],
        //         LTD_MEMBER_AMOUNT: row[12],
        //         LTD_MODIFY_BY: ''
        //     };
        //     res.json(data);

        // } else {
        //     const data = {
        //         LTD_LD_LOGIN: '',
        //         LTD_LD_EMP_ID: '',
        //         LTD_FACTORY: null,
        //         LTD_CC: null,
        //         LTD_APP_FISCALYR: '',
        //         LTD_YEAR: null,
        //         LTD_MONTH: null,
        //         LTD_MGR_EMP_ID: '',
        //         LTD_MGR_EMP_NAME: '',
        //         LTD_MEMBER_AMOUNT: '',
        //         LTD_MODIFY_BY: ''
        //     };
        //     res.json(data);
        // }

    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        res.status(500).send("ข้อผิดพลาดในการค้นหาข้อมูล");
    }
};


module.exports.setTeamDetail = async function (req, res) {
    let connect;
    try {
        const { LTD_LD_LOGIN,
            LTD_APP_FISCALYR,
            LTD_LD_EMP_ID,
            LTD_MGR_EMP_ID,
            LTD_MEMBER_AMOUNT,
            LTD_MODIFY_BY } = req.body;
        console.log(req.body)
        connect = await ConnectOracleDB("HR");
        let query = ``;
        query += ` MERGE INTO HR.LOCT_TEAM_DETAIL T `;
        query += ` USING (SELECT '${LTD_LD_LOGIN}' AS LTD_LD_LOGIN, `;
        query += `               '${LTD_APP_FISCALYR}' AS LTD_APP_FISCALYR, `;
        query += `               '${LTD_LD_EMP_ID}' AS LTD_LD_EMP_ID, `;
        query += `               '${LTD_MGR_EMP_ID}' AS LTD_MGR_EMP_ID, `;
        query += `               '${LTD_MEMBER_AMOUNT}' AS LTD_MEMBER_AMOUNT, `;
        query += `               '${LTD_MODIFY_BY}' AS LTD_CREATE_BY, `;
        query += `               SYSDATE AS LTD_CREATE_DATE, `;
        query += `               '${LTD_MODIFY_BY}' AS LTD_UPDATE_BY, `;
        query += `               SYSDATE AS LTD_UPDATE_DATE `;
        query += `          FROM DUAL) D `;
        query += ` ON (T.LTD_LD_LOGIN = D.LTD_LD_LOGIN AND T.LTD_APP_FISCALYR = D.LTD_APP_FISCALYR AND T.LTD_LD_EMP_ID = D.LTD_LD_EMP_ID) `;
        query += ` WHEN MATCHED THEN `;
        query += `   UPDATE `;
        query += `      SET T.LTD_MGR_EMP_ID    = D.LTD_MGR_EMP_ID, `;
        query += `          T.LTD_MEMBER_AMOUNT = D.LTD_MEMBER_AMOUNT, `;
        query += `          T.LTD_UPDATE_BY     = D.LTD_UPDATE_BY, `;
        query += `          T.LTD_UPDATE_DATE   = D.LTD_UPDATE_DATE `;
        query += ` WHEN NOT MATCHED THEN `;
        query += `   INSERT `;
        query += `     (T.LTD_LD_LOGIN, `;
        query += `      T.LTD_APP_FISCALYR, `;
        query += `      T.LTD_LD_EMP_ID, `;
        query += `      T.LTD_MGR_EMP_ID, `;
        query += `      T.LTD_MEMBER_AMOUNT, `;
        query += `      T.LTD_CREATE_BY, `;
        query += `      T.LTD_CREATE_DATE, `;
        query += `      T.LTD_UPDATE_BY, `;
        query += `      T.LTD_UPDATE_DATE) `;
        query += `   VALUES `;
        query += `     (D.LTD_LD_LOGIN, `;
        query += `      D.LTD_APP_FISCALYR, `;
        query += `      D.LTD_LD_EMP_ID, `;
        query += `      D.LTD_MGR_EMP_ID, `;
        query += `      D.LTD_MEMBER_AMOUNT, `;
        query += `      D.LTD_CREATE_BY, `;
        query += `      D.LTD_CREATE_DATE, `;
        query += `      D.LTD_UPDATE_BY, `;
        query += `      D.LTD_UPDATE_DATE) `;
        await connect.execute(query);

        await connect.commit();
        res.status(200).send('');

    } catch (err) {
        if (connect) {
            try {
                await connect.rollback();
                res.status(404).send({ err: err.message });
                console.log(err.message)
            } catch (rollbackErr) {
                console.error("Error occurred during rollback: ", rollbackErr.message);
                res.status(500).send("Error occurred during rollback: ", rollbackErr.message);
                console.log(rollbackErr.message)
            }
        }
    } finally {
        if (connect) {
            try {
                await connect.close();
            } catch (closeErr) {
                console.error("Error occurred during closing connection: ", closeErr.message);
                res.status(500).send("Error occurred during closing connection: ", closeErr.message);
            }
        }
    }

};

module.exports.dataHeaderPrint = async function (req, res) {
    try {
        const P_LEADER_ID = req.query.P_LEADER_ID
        const P_APP_MONTH = req.query.P_APP_MONTH
        const P_FACTORY = req.query.P_FACTORY
        const P_CC = req.query.P_CC

        const connect = await ConnectOracleDB("HR");
        let query = "";
        query += ` SELECT TD.LTD_MGR_EMP_ID || ' ' || H.ENAME || ' ' || H.ESURNAME AS P_MGR_NAME, `;
        query += `        TD.LTD_MEMBER_AMOUNT AS P_AMOUNT_UNDER, `;
        query += `        COUNT(DISTINCT T.LRH_REQ_BY) AS P_PERSON_ISS, `;
        query += `        DECODE('${P_CC}', '', 'ALL', '${P_CC}') AS P_PROC_CC, `;
        query += `        TRIM(TO_CHAR(TO_DATE('01_' || T.LRH_LEADER_APP_MONTH, 'DD_MM_YYYY'), `;
        query += `                     'Month')) || ' ' || `;
        query += `        TRIM(TO_CHAR(TO_DATE('01_' || T.LRH_LEADER_APP_MONTH, 'DD_MM_YYYY'), `;
        query += `                     'YYYY')) AS P_RES_OF_MONTH, `;
        query += `        TRIM(TO_CHAR(TO_DATE('01_' || T.LRH_LEADER_APP_MONTH, 'DD_MM_YYYY'), `;
        query += `                     'YYYY')) AS P_RES_OF_YEAR, `;
        query += `        TRIM(TO_CHAR(NVL(SUM(T.LRH_MH_TSAVE), 0), '9,999,990.00')) || ' MH' AS P_TOTAL_MH, `;
        query += `        TRIM(TO_CHAR(NVL(SUM(T.LRH_MC_TSAVE), 0), '9,999,990.00')) || ' THB' AS P_TOTAL_MC, `;
        query += `        '[' || T.LRH_LEADER_APP_BY || '] ' || L.ENAME || ' ' || L.ESURNAME AS P_LEADER, `;
        query += `        (SELECT COUNT(F.LRH_REQ_NO)  `;
        query += `           FROM LOCT_REQUEST_HEADER F  `;
        query += `          WHERE F.LRH_REQ_STATUS = 'FN'    `;
        query += `            AND F.LRH_LEADER_APP_BY = '${P_LEADER_ID}' `;
        query += `            AND F.LRH_LEADER_APP_MONTH = '${P_APP_MONTH}' `;
        query += `            AND (F.LRH_FACTORY = '${P_FACTORY}' OR '${P_FACTORY}' IS NULL) `;
        query += `            AND (F.LRH_COST_CENTER = '${P_CC}' OR '${P_CC}' IS NULL)) AS P_COUNT_ISS `;
        query += `   FROM LOCT_REQUEST_HEADER T `;
        query += `  INNER JOIN LOCT_TEAM_DETAIL TD ON TD.LTD_LD_EMP_ID = T.LRH_LEADER_APP_BY `;
        query += `    AND TD.LTD_APP_FISCALYR = T.LRH_LEADER_APP_MONTH `;
        query += `   LEFT JOIN CUSR.CU_USER_HUMANTRIX L ON L.EMPCODE = T.LRH_LEADER_APP_BY `;
        query += `   LEFT JOIN CUSR.CU_USER_HUMANTRIX H ON H.EMPCODE = TD.LTD_MGR_EMP_ID `;
        query += `  WHERE T.LRH_REQ_STATUS = 'FN'    `;
        query += `    AND T.LRH_LEADER_APP_BY = '${P_LEADER_ID}' `;
        query += `    AND T.LRH_LEADER_APP_MONTH = '${P_APP_MONTH}' `;
        query += `    AND (T.LRH_FACTORY = '${P_FACTORY}' OR '${P_FACTORY}' IS NULL) `;
        query += `    AND (T.LRH_COST_CENTER = '${P_CC}' OR '${P_CC}' IS NULL) `;
        query += `  GROUP BY T.LRH_LEADER_APP_MONTH, `;
        query += `           T.LRH_LEADER_APP_BY, `;
        query += `           L.ENAME, `;
        query += `           L.ESURNAME, `;
        query += `           TD.LTD_MGR_EMP_ID, `;
        query += `           H.ENAME, `;
        query += `           H.ESURNAME, `;
        query += `           TD.LTD_MEMBER_AMOUNT `;
        const result = await connect.execute(query);
        DisconnectOracleDB(connect);

        const data = result.rows.map(row => ({
            P_MGR_NAME: row[0],
            P_AMOUNT_UNDER: row[1],
            P_PERSON_ISS: row[2],
            P_PROC_CC: row[3],
            P_RES_OF_MONTH: row[4],
            P_RES_OF_YEAR: row[5],
            P_TOTAL_MH: row[6],
            P_TOTAL_MC: row[7],
            P_LEADER: row[8],
            P_COUNT_ISS: row[9]
        }));

        res.json(data);
    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        res.status(500).send("ข้อผิดพลาดในการค้นหาข้อมูล");
    }
};

module.exports.dataDetailPrint = async function (req, res) {
    try {
        const P_LEADER_ID = req.query.P_LEADER_ID
        const P_APP_MONTH = req.query.P_APP_MONTH
        const P_FACTORY = req.query.P_FACTORY
        const P_CC = req.query.P_CC

        const connect = await ConnectOracleDB("HR");
        let query = "";
        query += ` SELECT ROW_NUMBER()OVER(ORDER BY T.LRH_REQ_DATE,T.LRH_REQ_NO ASC) AS P_NO, `;
        query += `        TO_CHAR(T.LRH_REQ_DATE,'DD/MM/YYYY') AS P_ISS_DATE, `;
        query += `        T.LRH_SUMIT_TO_SG AS P_FLAG_SGT, `;
        query += `        DECODE(T.LRH_EVALUATE_STS,'Y','Implement', 'No Implement') AS P_FLAG_EVA, `;
        query += `        TO_CHAR(T.LRH_EVALUATE_DATE,'DD/MM/YYYY') AS P_DATE_EVA, `;
        query += `        T.LRH_MH_TSAVE AS P_MH, `;
        query += `        T.LRH_MC_TSAVE AS P_MC, `;
        query += `        TO_CHAR(T.LRH_LEADER_APP_DATE,'DD/MM/YYYY') AS P_APP_DATE, `;
        query += `        T.LRH_REQ_BY AS P_ISS_ID, `;
        query += `        UPPER(SUBSTR(H.ENAME,1,1)) || LOWER(SUBSTR(H.ENAME,2,LENGTH(H.ENAME)-1)) || ' ' || UPPER(SUBSTR(H.ESURNAME,1,1)) || LOWER(SUBSTR(H.ESURNAME,2,LENGTH(H.ESURNAME)-1)) AS P_ISS_NAME, `;
        query += `        T.LRH_PROBLEM AS P_SUBJECT, `;
        query += `        T.LRH_DET_BEFORE AS P_BEFORE, `;
        query += `        T.LRH_DET_AFTER AS P_AFTER `;
        query += `   FROM LOCT_REQUEST_HEADER T `;
        query += `   LEFT JOIN CUSR.CU_USER_HUMANTRIX L ON L.EMPCODE = T.LRH_LEADER_APP_BY `;
        query += `   LEFT JOIN CUSR.CU_USER_HUMANTRIX H ON H.EMPCODE = T.LRH_REQ_BY `;
        query += `  WHERE T.LRH_REQ_STATUS = 'FN'    `;
        query += `    AND T.LRH_LEADER_APP_BY = '${P_LEADER_ID}' `;
        query += `    AND T.LRH_LEADER_APP_MONTH = '${P_APP_MONTH}' `;
        query += `    AND (T.LRH_FACTORY = '${P_FACTORY}' OR '${P_FACTORY}' IS NULL) `;
        query += `    AND (T.LRH_COST_CENTER = '${P_CC}' OR '${P_CC}' IS NULL) `;
        const result = await connect.execute(query);
        DisconnectOracleDB(connect);

        const data = result.rows.map(row => ({
            P_NO: row[0],
            P_ISS_DATE: row[1],
            P_FLAG_SGT: row[2],
            P_FLAG_EVA: row[3],
            P_DATE_EVA: row[4],
            P_MH: row[5],
            P_MC: row[6],
            P_APP_DATE: row[7],
            P_ISS_ID: row[8],
            P_ISS_NAME: row[9],
            P_SUBJECT: row[10],
            P_BEFORE: row[11],
            P_AFTER: row[12]
        }));

        res.json(data);
    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        res.status(500).send("ข้อผิดพลาดในการค้นหาข้อมูล");
    }
};