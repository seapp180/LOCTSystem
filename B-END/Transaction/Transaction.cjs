const { ConnectOracleDB, DisconnectOracleDB } = require("../Common/DBconnection.cjs");

const oracledb = require("oracledb");
require("dotenv").config();

const fs = require('fs');
// const sftpClient  = require('ssh2-sftp-client');
// // const sftp = new Client();
// const ftp = require('basic-ftp');
const ftp = require('ftp');
const { Buffer } = require('buffer');
const path = require('path');
const base64 = require('base-64');

module.exports.getDataMain = async function (req, res) {
    try {
        const P_FACTORY = req.query.P_FACTORY
        const P_CC = req.query.P_CC
        const P_ISS_DATE_FRM = req.query.P_ISS_DATE_FRM
        const P_ISS_DATE_TO = req.query.P_ISS_DATE_TO
        const P_EMP_ID = req.query.P_EMP_ID
        const P_EMP_NAME = req.query.P_EMP_NAME
        const P_TYPE = req.query.P_TYPE
        const P_STATUS = req.query.P_STATUS
        const P_SM_DATE_FRM = req.query.P_SM_DATE_FRM
        const P_SM_DATE_TO = req.query.P_SM_DATE_TO
        const P_FISICAL_YEAR = req.query.P_FISICAL_YEAR
        const P_APP_MONTH_FRM = req.query.P_APP_MONTH_FRM
        const P_APP_MONTH_TO = req.query.P_APP_MONTH_TO
        const P_APP_BY = req.query.P_APP_BY
        const P_APP_FLAG = req.query.P_APP_FLAG

        const connect = await ConnectOracleDB("HR");
        let query = "";
        query += ` SELECT T.LRH_FACTORY, `;
        query += `        T.LRH_COST_CENTER, `;
        query += `        T.LRH_REQ_NO, `;
        query += `        TO_CHAR(T.LRH_REQ_DATE,'DD/MM/YYYY') AS LRH_REQ_DATE, `;
        query += `        T.LRH_REQ_BY || ' : ' || UPPER(SUBSTR(T.LRH_REQ_NAME,1,1)) || LOWER(SUBSTR(T.LRH_REQ_NAME,2,LENGTH(T.LRH_REQ_NAME)-1)) || ' ' || UPPER(SUBSTR(T.LRH_REQ_SURNAME,1,1)) || LOWER(SUBSTR(T.LRH_REQ_SURNAME,2,LENGTH(T.LRH_REQ_SURNAME)-1)) AS LRH_REQ_BY, `;
        // query += `        REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(T.LRH_PROBLEM,'(SL)',''),'(SI)',''),'(L)',''),'(I)',''),'(S)','') AS LRH_PROBLEM, `;
        query += `        T.LRH_PROBLEM, `;
        query += `        T.LRH_LEADER_APP_BY || ' : ' || UPPER(SUBSTR(HM.ENAME,1,1)) || LOWER(SUBSTR(HM.ENAME,2,LENGTH(HM.ENAME)-1)) || ' ' || UPPER(SUBSTR(HM.ESURNAME,1,1)) || LOWER(SUBSTR(HM.ESURNAME,2,LENGTH(HM.ESURNAME)-1)) AS LRH_LEADER_APP_BY, `;
        query += `        NVL(TO_CHAR(T.LRH_LEADER_APP_DATE,'DD/MM/YYYY'),'-') AS LRH_LEADER_APP_DATE, `;
        //query += `        S.LCM_MASTER_DESC AS LRH_REQ_STATUS `;
        query += `       DECODE(T.LRH_REQ_STATUS, `;
        query += `              'CT', `;
        query += `              'Create', `;
        query += `              'WT', `;
        query += `              'Wait Approve', `;
        query += `              'FN', `;
        query += `              'Finished', `;
        query += `              'RJ', `;
        query += `              'Reject From Leader', `;
        query += `              S.LCM_MASTER_DESC) AS LRH_REQ_STATUS, `;
        query += `              DECODE(T.LRH_REQ_TYPE ,'1','LOCT','2','LOCT','IECT') AS ISS_TYPE, `;
        query += `        T.LRH_DET_BEFORE, `;
        query += `        T.LRH_DET_AFTER, `;
        query += `        T.LRH_SUMIT_TO_SG, `;
        query += `        T.LRH_EVALUATE_STS, `;
        query += `        T.LRH_EVALUATE_DATE, `;
        query += `        T.LRH_MH_TSAVE, `;
        query += `        T.LRH_MC_TSAVE, `;
        query += `        T.LRH_LEADER_COMMENT, `;
        query += `        T.LRH_FILESERVER, `;
        query += `        T.LRH_SUMIT_TO_SG `;
        query += `   FROM HR.LOCT_REQUEST_HEADER T `;
        query += `   LEFT JOIN CUSR.CU_USER_HUMANTRIX HM ON HM.EMPCODE = T.LRH_LEADER_APP_BY `;
        query += `   LEFT JOIN HR.LOCT_CODE_MASTER S ON S.LCM_MASTER_CODE = T.LRH_REQ_STATUS `;
        query += `  WHERE 1 = 1 `;
        query += `    AND (T.LRH_REQ_STATUS = '${P_STATUS}' OR '${P_STATUS}' = 'ALL') `;
        query += `    AND (T.LRH_FACTORY = '${P_FACTORY}' OR '${P_FACTORY}' IS NULL) `;
        query += `    AND (T.LRH_COST_CENTER = '${P_CC}' OR '${P_CC}' IS NULL) `;
        query += `    AND (TO_CHAR(T.LRH_REQ_DATE,'YYYYMMDD') >= '${P_ISS_DATE_FRM}' OR '${P_ISS_DATE_FRM}' IS NULL) `;
        query += `    AND (TO_CHAR(T.LRH_REQ_DATE,'YYYYMMDD') <= '${P_ISS_DATE_TO}' OR '${P_ISS_DATE_TO}' IS NULL) `;
        query += `    AND (T.LRH_REQ_BY = '${P_EMP_ID}' OR '${P_EMP_ID}' IS NULL) `;
        query += `    AND (T.LRH_LEADER_APP_BY = '${P_APP_BY}' OR '${P_APP_BY}' IS NULL) `;
        query += `    AND UPPER(T.LRH_REQ_NAME || ' ' || T.LRH_REQ_SURNAME) LIKE UPPER('%${P_EMP_NAME}%') `;

        if (P_TYPE.trim() !== '' && P_TYPE !== null) {
            query += `    AND (T.LRH_REQ_TYPE IN `;
            query += `        (SELECT TRIM(REGEXP_SUBSTR('${P_TYPE}', '[^,]+', 1, LEVEL)) AS LRH_REQ_TYPE `;
            query += `            FROM DUAL `;
            query += `          CONNECT BY LEVEL <= `;
            query += `                     LENGTH('${P_TYPE}') - `;
            query += `                     LENGTH(REPLACE('${P_TYPE}', ',', '')) + 1))   `;
        }

        query += `    AND (TO_CHAR(T.LRH_SEND_DATE,'YYYYMMDD') >= '${P_SM_DATE_FRM}' OR '${P_SM_DATE_FRM}' IS NULL) `;
        query += `    AND (TO_CHAR(T.LRH_SEND_DATE,'YYYYMMDD') <= '${P_SM_DATE_TO}' OR '${P_SM_DATE_TO}' IS NULL) `;
        query += `    AND (T.LRH_LEADER_APP_FISCALYR = '${P_FISICAL_YEAR}' OR '${P_FISICAL_YEAR}' IS NULL) `;
        query += `    AND (TO_CHAR(T.LRH_LEADER_APP_DATE,'MM') >= '${P_APP_MONTH_FRM}' OR '${P_APP_MONTH_FRM}' IS NULL) `;
        query += `    AND (TO_CHAR(T.LRH_LEADER_APP_DATE,'MM') <= '${P_APP_MONTH_TO}' OR '${P_APP_MONTH_TO}' IS NULL) `;

        query += `  ORDER BY T.LRH_SEND_DATE, T.LRH_REQ_DATE DESC `;
        const result = await connect.execute(query);
        DisconnectOracleDB(connect);
        // let base64String = '';

        // const data = result.rows.map(row => ({
        //     LRH_FACTORY: row[0],
        //     LRH_COST_CENTER: row[1],
        //     LRH_REQ_NO: row[2],
        //     LRH_REQ_DATE: row[3],
        //     LRH_REQ_BY: row[4],
        //     LRH_PROBLEM: row[5],
        //     LRH_LEADER_APP_BY: row[6],
        //     LRH_LEADER_APP_DATE: row[7],
        //     LRH_REQ_STATUS: row[8],
        //     LRH_ISS_TYPE: row[9],
        //     LRH_DET_BEFORE: row[10],
        //     LRH_DET_AFTER: row[11],
        //     LRH_SUMIT_TO_SG: row[12],
        //     LRH_EVALUATE_STS: row[13],
        //     LRH_EVALUATE_DATE: row[14],
        //     LRH_MH_TSAVE: row[15],
        //     LRH_MC_TSAVE: row[16],
        //     LRH_LEADER_COMMENT: row[17],
        //     LRH_IS_OPEN: false,
        //     LRH_FILESERVER: row[18],
        //     LRH_FILE_BL: null,
        //     LRH_FILE_URL: null,        
        //     LRH_SSH_FILE: base64String
        // }));
        // //const data = processData(result)
        // res.json(data);

        const data = await Promise.all(result.rows.map(async (row) => {
            let base64String = '';
            if (P_APP_FLAG === 'Y') {

                if (row[18] !== null) {
                    if (row[19] === 'N') {
                        base64String = await fileToBase64(row[18]);
                    } else {
                        base64String = await downloadFileFromFTP(row[18]);
                    }
                }
            }

            return {
                LRH_FACTORY: row[0],
                LRH_COST_CENTER: row[1],
                LRH_REQ_NO: row[2],
                LRH_REQ_DATE: row[3],
                LRH_REQ_BY: row[4],
                LRH_PROBLEM: row[5],
                LRH_LEADER_APP_BY: row[6],
                LRH_LEADER_APP_DATE: row[7],
                LRH_REQ_STATUS: row[8],
                LRH_ISS_TYPE: row[9],
                LRH_DET_BEFORE: row[10],
                LRH_DET_AFTER: row[11],
                LRH_SUMIT_TO_SG: row[12],
                LRH_EVALUATE_STS: row[13],
                LRH_EVALUATE_DATE: row[14],
                LRH_MH_TSAVE: row[15],
                LRH_MC_TSAVE: row[16],
                LRH_LEADER_COMMENT: row[17],
                LRH_IS_OPEN: false,
                LRH_FILESERVER: row[18],
                LRH_FILE_BL: null,
                LRH_FILE_URL: null,
                LRH_SSH_FILE: base64String
            };
        }));

        res.json(data);
    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        res.status(500).send("ข้อผิดพลาดในการค้นหาข้อมูล");
    }
};


module.exports.getSGT_Type = async function (req, res) {
    try {
        const connect = await ConnectOracleDB("HR");
        let query = "";
        query += ` SELECT T.SCM_MASTER_CODE, T.SCM_MASTER_DESC `
        query += `   FROM SG_CODE_MASTER T `
        query += `  WHERE T.SCM_GROUP = 'SGT' `
        query += `    AND T.SCM_MASTER_STATUS = 'A' `
        query += `  ORDER BY T.SCM_SORT `

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

module.exports.getDataEmp = async function (req, res) {
    try {
        const P_EMP_ID = req.query.P_EMP_ID
        const connect = await ConnectOracleDB("HR");
        let query = "";
        query += ` SELECT T.EMPCODE, `;
        query += `        T.ENAME, `;
        query += `        T.ESURNAME, `;
        query += `        T.ENAME || ' ' || T.ESURNAME AS EMP_NAME, `;
        query += `        T.WORK_LOCATION, `;
        query += `        T.COST_CENTER, `;
        query += `        NVL(T.PROCESS, T.COST_CENTER) AS PROCESS, `;
        query += `        T.BOSS, `;
        query += `        B.ENAME, `;
        query += `        B.ESURNAME, `;
        query += `        B.EMPCODE || ' : ' || B.ENAME || ' ' || B.ESURNAME AS BOSS_NAME, `;
        query += `        CASE `;
        query += `          WHEN T.WORK_LOCATION = 'N1' THEN `;
        query += `           '1000' `;
        query += `          WHEN T.WORK_LOCATION = 'A1' THEN `;
        query += `           '2000' `;
        query += `          WHEN T.WORK_LOCATION = 'N2' THEN `;
        query += `           '2100' `;
        query += `          WHEN T.WORK_LOCATION = 'P1' THEN `;
        query += `           '2200' `;
        query += `          WHEN T.WORK_LOCATION = 'K1' THEN `;
        query += `           '2300' `;
        query += `          WHEN T.WORK_LOCATION = 'L1' THEN `;
        query += `           '3000' `;
        query += `          WHEN T.WORK_LOCATION = 'N3' THEN `;
        query += `           '5100' `;
        query += `          WHEN T.WORK_LOCATION = 'HQ' THEN `;
        query += `           '9000' `;
        query += `        END AS FACTORY_CODE, `;
        query += `        CASE `;
        query += `          WHEN T.JOBTYPE = 'Indirect' THEN `;
        query += `           'IECT' `;
        query += `          WHEN T.JOBTYPE = 'Direct' THEN `;
        query += `           'LOCT' `;
        query += `        END AS TYPE_RECORD, `;
        query += `        'FETL' AS EMP_TYPE, `;
        query += `        SUBSTR(T.POS_GRADE, 1, 2) AS P_LEVEL `;
        query += `   FROM CUSR.CU_USER_HUMANTRIX T `;
        query += `   LEFT JOIN CUSR.CU_USER_HUMANTRIX B ON B.EMPCODE = T.BOSS `;
        query += `  WHERE T.EMPCODE = '${P_EMP_ID}' `;
        query += `    AND UPPER(T.STATUS) = 'ACTIVE' `;

        const result = await connect.execute(query);
        DisconnectOracleDB(connect);
        const data = result.rows.map(row => ({
            EMP_ID: row[0],
            EMP_F_NAME: row[1],
            EMP_S_NAME: row[2],
            EMP_NAME: row[3],
            EMP_FAC_DESC: row[4],
            EMP_CC: row[5],
            EMP_PROC: row[6],
            EMP_BOSS: row[7],
            BOSS_F_NAME: row[8],
            BOSS_L_NAME: row[9],
            BOSS_NAME: row[10],
            EMP_FAC_CODE: row[11],
            TYPE_RECORD: row[12],
            EMP_TYPE: row[13],
            EPM_LEVEL: row[14]
        }));
        res.json(data);
    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        res.status(500).send("ข้อผิดพลาดในการค้นหาข้อมูล");
    }
};

module.exports.getSup_SGT = async function (req, res) {
    try {
        const P_FACTORY = req.query.P_FACTORY
        const P_CC = req.query.P_CC
        const connect = await ConnectOracleDB("HR");
        let query = "";
        query += ` SELECT T.SPM_USER_LOGIN `;
        query += `   FROM SG_PERSON_MASTER T, CUSR.CU_USER_M CU `;
        query += `  WHERE T.SPM_EMP_ID = CU.USER_EMP_ID `;
        query += `    AND T.SPM_PERSON_STS = 'A' `;
        query += `    AND T.SPM_LEVEL = 'PLV001' `;
        query += `    AND T.SPM_FACTORY = '${P_FACTORY}' `;
        query += `    AND T.SPM_COSTCENTER = '${P_CC}' `;
        query += `  ORDER BY CU.USER_FNAME `;


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

module.exports.getDataDetail = async function (req, res) {
    try {
        const P_NO = req.query.P_NO

        const connect = await ConnectOracleDB("HR");
        let query = "";
        query += ` SELECT DECODE(T.LRH_REQ_TYPE,'1','LOCT','2','LOCT','IECT') AS ISS_TYPE, `;
        query += `        T.LRH_REQ_NO, `;
        query += `        T.LRH_FACTORY, `;
        query += `        F.FACTORY_CODE AS LRH_FACTORY_CODE, `;
        query += `        T.LRH_COST_CENTER, `;
        query += `        TO_CHAR(T.LRH_REQ_DATE,'DD/MM/YYYY HH24:MI:SS') AS LRH_REQ_DATE, `;
        query += `        T.LRH_REQ_EMP_TYPE, `;
        query += `        T.LRH_REQ_BY, `;
        query += `        T.LRH_REQ_NAME, `;
        query += `        T.LRH_REQ_SURNAME, `;
        query += `        T.LRH_REQ_NAME || ' ' || T.LRH_REQ_SURNAME AS LRH_REQ_NAME_FULL, `;
        query += `        T.LRH_REQ_PROCESS, `;
        query += `        T.LRH_REQ_POSITION, `;
        query += `        T.LRH_REQ_MANAGER, `;
        query += `        T.LRH_REQ_MANAGER || ' : ' || H.ENAME || ' ' || H.ESURNAME AS LRH_REQ_MANAGER_NANE, `;
        query += `        T.LRH_REQ_STATUS, `;
        //query += `        S.LCM_MASTER_DESC AS LRH_REQ_STATUS_DESC, `;
        query += `       DECODE(T.LRH_REQ_STATUS, `;
        query += `              'CT', `;
        query += `              'Create', `;
        query += `              'WT', `;
        query += `              'Wait Approve', `;
        query += `              'FN', `;
        query += `              'Finished', `;
        query += `              'RJ', `;
        query += `              'Reject From Leader', `;
        query += `              S.LCM_MASTER_DESC) AS LRH_REQ_STATUS_DESC, `;
        query += `        T.LRH_FILENAME, `;
        query += `        T.LRH_FILESERVER, `;
        query += `        '' AS LRH_FILE_BL, `;
        query += `        '' AS LRH_FILE_URL, `;
        query += `        REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(T.LRH_PROBLEM,'(SL)',''),'(SI)',''),'(L)',''),'(I)',''),'(S)','') AS LRH_PROBLEM, `;
        query += `        T.LRH_DET_BEFORE, `;
        query += `        T.LRH_DET_AFTER, `;
        query += `        T.LRH_MH_OUTPUT, `;
        query += `        T.LRH_MH_FORECAST, `;
        query += `        T.LRH_MH_TSAVE, `;
        query += `        T.LRH_MC_WCODE, `;
        query += `        T.LRH_MC_WCOST, `;
        query += `        T.LRH_MC_TSAVE, `;
        query += `        T.LRH_EVALUATE_STS, `;
        query += `        T.LRH_EVALUATE_DATE, `;
        query += `        T.LRH_LEADER_RESULT, `;
        query += `        T.LRH_LEADER_APP_BY, `;
        query += `        L.ENAME || ' ' || L.ESURNAME AS LRH_LEADER_APP_NAME, `;
        query += `        T.LRH_LEADER_APP_DATE, `;
        query += `        T.LRH_LEADER_APP_FISCALYR, `;
        query += `        T.LRH_LEADER_COMMENT, `;
        query += `        T.LRH_SUMIT_TO_SG, `;
        query += `        DECODE(T.LRH_REQ_STATUS,'CT','false','true') AS LRH_SUMIT_TO_SG_BL, `;
        query += `        T.LRH_SG_TYPE AS LRH_SG_TYPE_V, `;
        query += `        SGT.SCM_MASTER_DESC AS LRH_SG_TYPE_L, `;
        query += `        T.LRH_FILE_PATH, `;
        query += `        T.LRH_REQ_TYPE, `;
        query += `        T.LRH_SG_NO, `;
        query += `        T.LRH_LEADER_APP_MONTH, `;
        query += `        T.LRH_REQ_MONTH, `;
        query += `        T.LRH_SEND_DATE, `;
        query += `        T.LRH_REQ_TYPE_TEAM, `;
        query += `        SH.SSH_SV_APP_BY, `;
        query += `        SH.SSH_REQ_TYPE, `;
        query += `        SH.SSH_TEAM AS SSH_TEAM_NAME, `;
        query += `        '' AS SSH_TEAM_BL        `;
        query += `   FROM HR.LOCT_REQUEST_HEADER T `;
        query += `   LEFT JOIN CUSR.CU_FACTORY_M F ON F.FACTORY_NAME = T.LRH_FACTORY `;
        query += `   LEFT JOIN CUSR.CU_USER_HUMANTRIX H ON H.EMPCODE = T.LRH_REQ_MANAGER `;
        query += `   LEFT JOIN CUSR.CU_USER_HUMANTRIX L ON L.EMPCODE = T.LRH_LEADER_APP_BY `;
        query += `   LEFT JOIN HR.LOCT_CODE_MASTER S ON S.LCM_MASTER_CODE = T.LRH_REQ_STATUS `;
        query += `   LEFT JOIN HR.SG_CODE_MASTER SGT ON SGT.SCM_MASTER_CODE = T.LRH_SG_TYPE `;
        query += `   LEFT JOIN HR.SG_SUGGESTION_HEADER SH ON SH.SSH_REQ_NO = T.LRH_SG_NO `;
        query += `  WHERE T.LRH_REQ_NO = '${P_NO}' `;
        const result = await connect.execute(query);
        DisconnectOracleDB(connect);

        if (!result.rows || !Array.isArray(result.rows) || result.rows.length === 0) {
            throw new Error("Data is not available or in incorrect format");
        }

        const memberTeam = await getMemberTeam(P_NO);

        let base64String = '';
        if (result.rows[0][18] !== null) {
            if (result.rows[0][38] === 'N') {
                base64String = await fileToBase64(result.rows[0][18]);
            } else {
                base64String = await downloadFileFromFTP(result.rows[0][18]);
            }
        }
        const row = result.rows[0];


        const data = {
            ISS_TYPE: row[0],
            LRH_REQ_NO: row[1],
            LRH_FACTORY: row[2],
            LRH_FACTORY_CODE: row[3],
            LRH_COST_CENTER: row[4],
            LRH_REQ_DATE: row[5],
            LRH_REQ_EMP_TYPE: row[6],
            LRH_REQ_BY: row[7],
            LRH_REQ_NAME: row[8],
            LRH_REQ_SURNAME: row[9],
            LRH_REQ_NAME_FULL: row[10],
            LRH_REQ_PROCESS: row[11],
            LRH_REQ_POSITION: row[12],
            LRH_REQ_MANAGER: row[13],
            LRH_REQ_MANAGER_NANE: row[14],
            LRH_REQ_STATUS: row[15],
            LRH_REQ_STATUS_DESC: row[16],
            LRH_FILENAME: row[17],
            LRH_FILESERVER: row[18],
            LRH_FILE_BL: null,
            LRH_FILE_URL: null,
            LRH_PROBLEM: row[21],
            LRH_DET_BEFORE: row[22],
            LRH_DET_AFTER: row[23],
            LRH_MH_OUTPUT: row[24],
            LRH_MH_FORECAST: row[25],
            LRH_MH_TSAVE: row[26],
            LRH_MC_WCODE: row[27],
            LRH_MC_WCOST: row[28],
            LRH_MC_TSAVE: row[29],
            LRH_EVALUATE_STS: row[30],
            LRH_EVALUATE_DATE: row[31],
            LRH_LEADER_RESULT: row[32],
            LRH_LEADER_APP_BY: row[33],
            LRH_LEADER_APP_NAME: row[34],
            LRH_LEADER_APP_DATE: row[35],
            LRH_LEADER_APP_FISCALYR: row[36],
            LRH_LEADER_COMMENT: row[37],
            LRH_SUMIT_TO_SG: row[38],
            LRH_SUMIT_TO_SG_BL: JSON.parse(row[39]),
            LRH_SG_TYPE: { value: row[40], label: row[41] },
            LRH_FILE_PATH: row[42],
            LRH_REQ_TYPE: row[43],
            LRH_SG_NO: row[44],
            LRH_LEADER_APP_MONTH: row[45],
            LRH_REQ_MONTH: row[46],
            LRH_SEND_DATE: row[47],
            LRH_REQ_TYPE_TEAM: row[48],
            SSH_SV_APP_BY: { value: row[49], label: row[49] },
            SSH_REQ_TYPE: row[50],
            SSH_TEAM_NAME: row[51],
            SSH_TEAM_BL: false,
            SSH_MEMBER_TEAM: memberTeam,
            LRH_SSH_FILE: base64String
        };
        res.json(data);
    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        res.status(500).send("ข้อผิดพลาดในการค้นหาข้อมูล");
    }
};

async function getMemberTeam(P_NO) {
    try {

        const connect = await ConnectOracleDB("HR");
        let query = "";
        query += ` SELECT T.LST_EMP_ID AS T_EMP_ID, `;
        query += `        H.ENAME || ' ' || H.ESURNAME AS T_EMP_NAME, `;
        query += `        T.LST_POS_GRADE AS T_EMP_JOBGRAD, `;
        query += `        T.LST_COST_CENTER AS T_EMP_CC `;
        query += `   FROM HR.LOCT_SUGGESTION_TEAM T `;
        query += `   LEFT JOIN CUSR.CU_USER_HUMANTRIX H ON H.EMPCODE = T.LST_EMP_ID `;
        query += `  WHERE T.LST_REQ_NO = '${P_NO}' `;
        query += `  ORDER BY T.LST_EMP_ID `;
        const result = await connect.execute(query);
        DisconnectOracleDB(connect);
        const data = result.rows.map(row => ({
            T_EMP_ID: row[0],
            T_EMP_NAME: row[1],
            T_EMP_JOBGRAD: row[2],
            T_EMP_CC: row[3]
        }));
        return data;
    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        return [];
    }
};

async function getMaxLOCT(P_FACTORY, P_CC) {
    try {

        const connect = await ConnectOracleDB("HR");
        let query = "";
        query += ` 	SELECT CASE MAX(SUBSTR(T.LRH_REQ_NO, 5, 2))	`;
        query += ` 	         WHEN TO_CHAR(SYSDATE, 'YY') THEN		`;
        query += ` 	          CASE		`;
        query += ` 	           LENGTH(TO_NUMBER(MAX(SUBSTR(T.LRH_REQ_NO, LENGTH(T.LRH_REQ_NO) - 5))) + 1)		`;
        query += ` 	            WHEN 1 THEN		`;
        query += ` 	             'L' || '${P_FACTORY}' || '-' || TO_CHAR(SYSDATE, 'YY') || '-' || '${P_CC}' || '-' ||'00000' ||		`;
        query += ` 	             TO_NUMBER(MAX(SUBSTR(T.LRH_REQ_NO, LENGTH(T.LRH_REQ_NO) - 5)) + 1)		`;
        query += ` 	            WHEN 2 THEN		`;
        query += ` 	             'L' || '${P_FACTORY}' || '-' || TO_CHAR(SYSDATE, 'YY') || '-' || '${P_CC}' || '-' ||'0000' ||		`;
        query += ` 	             TO_NUMBER(MAX(SUBSTR(T.LRH_REQ_NO, LENGTH(T.LRH_REQ_NO) - 5)) + 1)		`;
        query += ` 	            WHEN 3 THEN		`;
        query += ` 	             'L' || '${P_FACTORY}' || '-' || TO_CHAR(SYSDATE, 'YY') || '-' || '${P_CC}' || '-' ||'000' ||		`;
        query += ` 	             TO_NUMBER(MAX(SUBSTR(T.LRH_REQ_NO, LENGTH(T.LRH_REQ_NO) - 5)) + 1)		`;
        query += ` 	            WHEN 4 THEN		`;
        query += ` 	             'L' || '${P_FACTORY}' || '-' || TO_CHAR(SYSDATE, 'YY') || '-' || '${P_CC}' || '-' || '00' ||		`;
        query += ` 	             TO_NUMBER(MAX(SUBSTR(T.LRH_REQ_NO, LENGTH(T.LRH_REQ_NO) - 5)) + 1)		`;
        query += ` 	            WHEN 5 THEN		`;
        query += ` 	             'L' || '${P_FACTORY}' || '-' || TO_CHAR(SYSDATE, 'YY') || '-' || '${P_CC}' || '-' || '0' ||		`;
        query += ` 	             TO_NUMBER(MAX(SUBSTR(T.LRH_REQ_NO, LENGTH(T.LRH_REQ_NO) - 5)) + 1)		`;
        query += ` 	            ELSE		`;
        query += ` 	             'L' || '${P_FACTORY}' || '-' || TO_CHAR(SYSDATE, 'YY') || '-' || '${P_CC}' || '-' ||		`;
        query += ` 	             TO_NUMBER(MAX(SUBSTR(T.LRH_REQ_NO, LENGTH(T.LRH_REQ_NO) - 5)) + 1)		`;
        query += ` 	          END		`;
        query += ` 	         ELSE		`;
        query += ` 	          'L' || '${P_FACTORY}' || '-' || TO_CHAR(SYSDATE, 'YY') || '-' || '${P_CC}' || '-' || '000001'		`;
        query += ` 	       END AS MAX_RUNNING_LOCT		`;
        query += ` 	  FROM LOCT_REQUEST_HEADER T		`;
        query += ` 	 WHERE T.LRH_FACTORY = '${P_FACTORY}'		`;
        query += ` 	   AND T.LRH_COST_CENTER = '${P_CC}'		`;
        const result = await connect.execute(query);
        DisconnectOracleDB(connect);
        const row = result.rows[0];
        console.log(row[0])
        return row[0];
    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        return '';
    }
};

async function getMaxSGT(P_FACTORY_CODE, P_CC) {
    try {

        const connect = await ConnectOracleDB("HR");
        let query = "";
        query += `   SELECT CASE MAX(SUBSTR(T.SSH_REQ_NO, LENGTH(T.SSH_REQ_NO) - 9, 4))  `;
        query += `            WHEN TO_CHAR(SYSDATE, 'YYYY') THEN `;
        query += `             CASE  `;
        query += `              LENGTH(TO_NUMBER(MAX(SUBSTR(T.SSH_REQ_NO, LENGTH(T.SSH_REQ_NO) - 4))) + 1) `;
        query += `               WHEN 1 THEN `;
        query += `                '${P_FACTORY_CODE}' || '/' || '${P_CC}' || '/' || TO_CHAR(SYSDATE, 'YYYY') || '/' || '0000' || `;
        query += `                TO_NUMBER(MAX(SUBSTR(T.SSH_REQ_NO, LENGTH(T.SSH_REQ_NO) - 4)) + 1) `;
        query += `               WHEN 2 THEN `;
        query += `                '${P_FACTORY_CODE}' || '/' || '${P_CC}' || '/' || TO_CHAR(SYSDATE, 'YYYY') || '/' || '000' ||  `;
        query += `                TO_NUMBER(MAX(SUBSTR(T.SSH_REQ_NO, LENGTH(T.SSH_REQ_NO) - 4)) + 1) `;
        query += `               WHEN 3 THEN `;
        query += `                '${P_FACTORY_CODE}' || '/' || '${P_CC}' || '/' || TO_CHAR(SYSDATE, 'YYYY') || '/' || '00' || `;
        query += `                TO_NUMBER(MAX(SUBSTR(T.SSH_REQ_NO, LENGTH(T.SSH_REQ_NO) - 4)) + 1) `;
        query += `               WHEN 4 THEN `;
        query += `                '${P_FACTORY_CODE}' || '/' || '${P_CC}' || '/' || TO_CHAR(SYSDATE, 'YYYY') || '/' || '0' ||  `;
        query += `                TO_NUMBER(MAX(SUBSTR(T.SSH_REQ_NO, LENGTH(T.SSH_REQ_NO) - 4)) + 1) `;
        query += `               ELSE  `;
        query += `                '${P_FACTORY_CODE}' || '/' || '${P_CC}' || '/' || TO_CHAR(SYSDATE, 'YYYY') || '/' || '-' ||  `;
        query += `                TO_NUMBER(MAX(SUBSTR(T.SSH_REQ_NO, LENGTH(T.SSH_REQ_NO) - 4)) + 1) `;
        query += `             END `;
        query += `            ELSE `;
        query += `             '${P_FACTORY_CODE}' || '/' || '${P_CC}' || '/' || TO_CHAR(SYSDATE, 'YYYY') || '/' || '00001'  `;
        query += `          END AS MAX_RUNNING `;
        query += `     FROM SG_SUGGESTION_HEADER T `;
        query += `    WHERE T.SSH_FACTORY = '${P_FACTORY_CODE}' `;
        query += `      AND T.SSH_COST_CENTER = '${P_CC}'   `;
        query += `      AND (SUBSTR(T.SSH_REQ_NO, LENGTH(T.SSH_REQ_NO) - 9, 4)) = TO_CHAR(SYSDATE, 'YYYY')`;
        const result = await connect.execute(query);
        DisconnectOracleDB(connect);
        const row = result.rows[0];
        return row[0];

    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        return '';
    }
};

module.exports.MergHeader = async function (req, res) {
    let connect;
    const P_STATUS = req.query.P_STATUS
    const P_STATUS_SG = req.query.P_STATUS_SG
    try {
        const { ISS_TYPE,
            LRH_REQ_NO,
            LRH_FACTORY,
            LRH_FACTORY_CODE,
            LRH_COST_CENTER,
            LRH_REQ_DATE,
            LRH_REQ_EMP_TYPE,
            LRH_REQ_BY,
            LRH_REQ_NAME,
            LRH_REQ_SURNAME,
            LRH_REQ_NAME_FULL,
            LRH_REQ_PROCESS,
            LRH_REQ_POSITION,
            LRH_REQ_MANAGER,
            LRH_REQ_MANAGER_NANE,
            LRH_REQ_STATUS,
            LRH_REQ_STATUS_DESC,
            LRH_FILENAME,
            LRH_FILESERVER,
            LRH_FILE_BL,
            LRH_FILE_URL,
            LRH_PROBLEM,
            LRH_DET_BEFORE,
            LRH_DET_AFTER,
            LRH_MH_OUTPUT,
            LRH_MH_FORECAST,
            LRH_MH_TSAVE,
            LRH_MC_WCODE,
            LRH_MC_WCOST,
            LRH_MC_TSAVE,
            LRH_EVALUATE_STS,
            LRH_EVALUATE_DATE,
            LRH_LEADER_RESULT,
            LRH_LEADER_APP_BY,
            LRH_LEADER_APP_NAME,
            LRH_LEADER_APP_DATE,
            LRH_LEADER_APP_FISCALYR,
            LRH_LEADER_COMMENT,
            LRH_SUMIT_TO_SG,
            LRH_SUMIT_TO_SG_BL,
            LRH_SG_TYPE,
            LRH_FILE_PATH,
            LRH_REQ_TYPE,
            LRH_SG_NO,
            LRH_LEADER_APP_MONTH,
            LRH_REQ_MONTH,
            LRH_SEND_DATE,
            LRH_REQ_TYPE_TEAM,
            SSH_SV_APP_BY,
            SSH_REQ_TYPE,
            SSH_TEAM_NAME,
            SSH_TEAM_BL,
            SSH_MEMBER_TEAM,
            LRH_SSH_FILE } = req.body;

        let LOCTno = '';
        let SGTno = '';
        let Subject = '';

        if (LRH_REQ_NO.trim() === '' || LRH_REQ_NO === null) {
            LOCTno = await getMaxLOCT(LRH_FACTORY, LRH_COST_CENTER)
        } else {
            LOCTno = LRH_REQ_NO
        }

        if (LRH_REQ_TYPE === '1' || LRH_REQ_TYPE === '3') {
            if (LRH_SG_NO.trim() === '' || LRH_SG_NO === null) {
                SGTno = await getMaxSGT(LRH_FACTORY_CODE, LRH_COST_CENTER)
            } else {
                SGTno = LRH_SG_NO
            }
        } else {
            SGTno = LRH_SG_NO
        }

        if (LRH_REQ_TYPE === '1') {
            Subject = '(SL)' + LRH_PROBLEM;
        } else if (LRH_REQ_TYPE === '2') {
            Subject = '(L)' + LRH_PROBLEM;
        } else if (LRH_REQ_TYPE === '3') {
            Subject = '(SI)' + LRH_PROBLEM;
        } else if (LRH_REQ_TYPE === '4') {
            Subject = '(I)' + LRH_PROBLEM;
        } else if (LRH_REQ_TYPE === '5') {
            Subject = '(S)' + LRH_PROBLEM;
        }
        connect = await ConnectOracleDB("HR");
        // await saveBase64ToFile(LRH_FILESERVER,LRH_SSH_FILE)
        let query = ``;
        if (LRH_REQ_TYPE === '1' || LRH_REQ_TYPE === '3') {
            query = ``;
            query += ` 	MERGE INTO HR.LOCT_REQUEST_HEADER T	`;
            query += ` 	USING (SELECT :1 AS LRH_REQ_NO,	`;
            query += ` 	              :2 AS LRH_FACTORY,	`;
            query += ` 	              :3 AS LRH_COST_CENTER,	`;
            query += ` 	              TO_DATE(:4, 'DD/MM/YYYY HH24:MI:SS') AS LRH_REQ_DATE,	`;
            query += ` 	              :5 AS LRH_REQ_EMP_TYPE,	`;
            query += ` 	              :6 AS LRH_REQ_BY,	`;
            query += ` 	              :7 AS LRH_REQ_NAME,	`;
            query += ` 	              :8 AS LRH_REQ_SURNAME,	`;
            query += ` 	              :9 AS LRH_REQ_PROCESS,	`;
            query += ` 	              :10 AS LRH_REQ_POSITION,	`;
            query += ` 	              :11 AS LRH_REQ_MANAGER,	`;
            query += ` 	              :12 AS LRH_REQ_STATUS,	`;
            query += ` 	              :13 AS LRH_FILENAME,	`;
            query += ` 	              :14 AS LRH_FILESERVER,	`;
            query += ` 	              :15 AS LRH_PROBLEM,	`;
            query += ` 	              :16 AS LRH_DET_BEFORE,	`;
            query += ` 	              :17 AS LRH_DET_AFTER,	`;
            query += ` 	              :18 AS LRH_MH_OUTPUT,	`;
            query += ` 	              :19 AS LRH_MH_FORECAST,	`;
            query += ` 	              :20 AS LRH_MH_TSAVE,	`;
            query += ` 	              :21 AS LRH_MC_WCODE,	`;
            query += ` 	              :22 AS LRH_MC_WCOST,	`;
            query += ` 	              :23 AS LRH_MC_TSAVE,	`;
            query += ` 	              :24 AS LRH_EVALUATE_STS,	`;
            query += ` 	              :25 AS LRH_EVALUATE_DATE,	`;
            query += ` 	              :26 AS LRH_LEADER_RESULT,	`;
            query += ` 	              :27 AS LRH_LEADER_APP_BY,	`;
            query += ` 	              :28 AS LRH_LEADER_APP_DATE,	`;
            query += ` 	              :29 AS LRH_LEADER_APP_FISCALYR,	`;
            query += ` 	              :30 AS LRH_LEADER_COMMENT,	`;
            query += ` 	              :31 AS LRH_SUMIT_TO_SG,	`;
            query += ` 	              :32 AS LRH_SG_TYPE,	`;
            query += ` 	              SYSDATE AS LRH_CREATE_DATE,	`;
            query += ` 	              :33 AS LRH_CREATE_BY,	`;
            query += ` 	              SYSDATE AS LRH_UPDATE_DATE,	`;
            query += ` 	              :34 AS LRH_UPDATE_BY,	`;
            query += ` 	              :35 AS LRH_FILE_PATH,	`;
            query += ` 	              :36 AS LRH_REQ_TYPE,	`;
            query += ` 	              :37 AS LRH_SG_NO,	`;
            query += ` 	              :38 AS LRH_LEADER_APP_MONTH,	`;
            query += ` 	              TO_CHAR(SYSDATE, 'MM_YYYY') AS LRH_REQ_MONTH,	`;
            query += ` 	              DECODE(:39, 'WT', SYSDATE, '') AS LRH_SEND_DATE,	`;
            query += ` 	              :40 AS LRH_REQ_TYPE_TEAM	`;
            query += ` 	         FROM DUAL) D	`;
            query += ` 	ON (T.LRH_REQ_NO = D.LRH_REQ_NO)	`;
            query += ` 	WHEN MATCHED THEN	`;
            query += ` 	  UPDATE	`;
            query += ` 	     SET T.LRH_FACTORY             = D.LRH_FACTORY,	`;
            query += ` 	         T.LRH_COST_CENTER         = D.LRH_COST_CENTER,	`;
            query += ` 	         T.LRH_REQ_EMP_TYPE        = D.LRH_REQ_EMP_TYPE,	`;
            query += ` 	         T.LRH_REQ_BY              = D.LRH_REQ_BY,	`;
            query += ` 	         T.LRH_REQ_NAME            = D.LRH_REQ_NAME,	`;
            query += ` 	         T.LRH_REQ_SURNAME         = D.LRH_REQ_SURNAME,	`;
            query += ` 	         T.LRH_REQ_PROCESS         = D.LRH_REQ_PROCESS,	`;
            query += ` 	         T.LRH_REQ_POSITION        = D.LRH_REQ_POSITION,	`;
            query += ` 	         T.LRH_REQ_MANAGER         = D.LRH_REQ_MANAGER,	`;
            query += ` 	         T.LRH_REQ_STATUS          = D.LRH_REQ_STATUS,	`;
            query += ` 	         T.LRH_FILENAME            = D.LRH_FILENAME,	`;
            query += ` 	         T.LRH_FILESERVER          = D.LRH_FILESERVER,	`;
            query += ` 	         T.LRH_PROBLEM             = D.LRH_PROBLEM,	`;
            query += ` 	         T.LRH_DET_BEFORE          = D.LRH_DET_BEFORE,	`;
            query += ` 	         T.LRH_DET_AFTER           = D.LRH_DET_AFTER,	`;
            query += ` 	         T.LRH_MH_OUTPUT           = D.LRH_MH_OUTPUT,	`;
            query += ` 	         T.LRH_MH_FORECAST         = D.LRH_MH_FORECAST,	`;
            query += ` 	         T.LRH_MH_TSAVE            = D.LRH_MH_TSAVE,	`;
            query += ` 	         T.LRH_MC_WCODE            = D.LRH_MC_WCODE,	`;
            query += ` 	         T.LRH_MC_WCOST            = D.LRH_MC_WCOST,	`;
            query += ` 	         T.LRH_MC_TSAVE            = D.LRH_MC_TSAVE,	`;
            query += ` 	         T.LRH_EVALUATE_STS        = D.LRH_EVALUATE_STS,	`;
            query += ` 	         T.LRH_EVALUATE_DATE       = D.LRH_EVALUATE_DATE,	`;
            query += ` 	         T.LRH_LEADER_RESULT       = D.LRH_LEADER_RESULT,	`;
            query += ` 	         T.LRH_LEADER_APP_BY       = D.LRH_LEADER_APP_BY,	`;
            query += ` 	         T.LRH_LEADER_APP_DATE     = D.LRH_LEADER_APP_DATE,	`;
            query += ` 	         T.LRH_LEADER_APP_FISCALYR = D.LRH_LEADER_APP_FISCALYR,	`;
            query += ` 	         T.LRH_LEADER_COMMENT      = D.LRH_LEADER_COMMENT,	`;
            query += ` 	         T.LRH_SUMIT_TO_SG         = D.LRH_SUMIT_TO_SG,	`;
            query += ` 	         T.LRH_SG_TYPE             = D.LRH_SG_TYPE,	`;
            query += ` 	         T.LRH_UPDATE_DATE         = D.LRH_UPDATE_DATE,	`;
            query += ` 	         T.LRH_UPDATE_BY           = D.LRH_UPDATE_BY,	`;
            query += ` 	         T.LRH_FILE_PATH           = D.LRH_FILE_PATH,	`;
            query += ` 	         T.LRH_REQ_TYPE            = D.LRH_REQ_TYPE,	`;
            query += ` 	         T.LRH_SG_NO               = D.LRH_SG_NO,	`;
            query += ` 	         T.LRH_LEADER_APP_MONTH    = D.LRH_LEADER_APP_MONTH,	`;
            query += ` 	         T.LRH_SEND_DATE           = D.LRH_SEND_DATE,	`;
            query += ` 	         T.LRH_REQ_TYPE_TEAM       = D.LRH_REQ_TYPE_TEAM	`;
            query += ` 	WHEN NOT MATCHED THEN	`;
            query += ` 	  INSERT	`;
            query += ` 	    (T.LRH_REQ_NO,	`;
            query += ` 	     T.LRH_FACTORY,	`;
            query += ` 	     T.LRH_COST_CENTER,	`;
            query += ` 	     T.LRH_REQ_DATE,	`;
            query += ` 	     T.LRH_REQ_EMP_TYPE,	`;
            query += ` 	     T.LRH_REQ_BY,	`;
            query += ` 	     T.LRH_REQ_NAME,	`;
            query += ` 	     T.LRH_REQ_SURNAME,	`;
            query += ` 	     T.LRH_REQ_PROCESS,	`;
            query += ` 	     T.LRH_REQ_POSITION,	`;
            query += ` 	     T.LRH_REQ_MANAGER,	`;
            query += ` 	     T.LRH_REQ_STATUS,	`;
            query += ` 	     T.LRH_FILENAME,	`;
            query += ` 	     T.LRH_FILESERVER,	`;
            query += ` 	     T.LRH_PROBLEM,	`;
            query += ` 	     T.LRH_DET_BEFORE,	`;
            query += ` 	     T.LRH_DET_AFTER,	`;
            query += ` 	     T.LRH_MH_OUTPUT,	`;
            query += ` 	     T.LRH_MH_FORECAST,	`;
            query += ` 	     T.LRH_MH_TSAVE,	`;
            query += ` 	     T.LRH_MC_WCODE,	`;
            query += ` 	     T.LRH_MC_WCOST,	`;
            query += ` 	     T.LRH_MC_TSAVE,	`;
            query += ` 	     T.LRH_EVALUATE_STS,	`;
            query += ` 	     T.LRH_EVALUATE_DATE,	`;
            query += ` 	     T.LRH_LEADER_RESULT,	`;
            query += ` 	     T.LRH_LEADER_APP_BY,	`;
            query += ` 	     T.LRH_LEADER_APP_DATE,	`;
            query += ` 	     T.LRH_LEADER_APP_FISCALYR,	`;
            query += ` 	     T.LRH_LEADER_COMMENT,	`;
            query += ` 	     T.LRH_SUMIT_TO_SG,	`;
            query += ` 	     T.LRH_SG_TYPE,	`;
            query += ` 	     T.LRH_CREATE_DATE,	`;
            query += ` 	     T.LRH_CREATE_BY,	`;
            query += ` 	     T.LRH_FILE_PATH,	`;
            query += ` 	     T.LRH_REQ_TYPE,	`;
            query += ` 	     T.LRH_SG_NO,	`;
            query += ` 	     T.LRH_LEADER_APP_MONTH,	`;
            query += ` 	     T.LRH_REQ_MONTH,	`;
            query += ` 	     T.LRH_SEND_DATE,	`;
            query += ` 	     T.LRH_REQ_TYPE_TEAM)	`;
            query += ` 	  VALUES	`;
            query += ` 	    (D.LRH_REQ_NO,	`;
            query += ` 	     D.LRH_FACTORY,	`;
            query += ` 	     D.LRH_COST_CENTER,	`;
            query += ` 	     D.LRH_REQ_DATE,	`;
            query += ` 	     D.LRH_REQ_EMP_TYPE,	`;
            query += ` 	     D.LRH_REQ_BY,	`;
            query += ` 	     D.LRH_REQ_NAME,	`;
            query += ` 	     D.LRH_REQ_SURNAME,	`;
            query += ` 	     D.LRH_REQ_PROCESS,	`;
            query += ` 	     D.LRH_REQ_POSITION,	`;
            query += ` 	     D.LRH_REQ_MANAGER,	`;
            query += ` 	     D.LRH_REQ_STATUS,	`;
            query += ` 	     D.LRH_FILENAME,	`;
            query += ` 	     D.LRH_FILESERVER,	`;
            query += ` 	     D.LRH_PROBLEM,	`;
            query += ` 	     D.LRH_DET_BEFORE,	`;
            query += ` 	     D.LRH_DET_AFTER,	`;
            query += ` 	     D.LRH_MH_OUTPUT,	`;
            query += ` 	     D.LRH_MH_FORECAST,	`;
            query += ` 	     D.LRH_MH_TSAVE,	`;
            query += ` 	     D.LRH_MC_WCODE,	`;
            query += ` 	     D.LRH_MC_WCOST,	`;
            query += ` 	     D.LRH_MC_TSAVE,	`;
            query += ` 	     D.LRH_EVALUATE_STS,	`;
            query += ` 	     D.LRH_EVALUATE_DATE,	`;
            query += ` 	     D.LRH_LEADER_RESULT,	`;
            query += ` 	     D.LRH_LEADER_APP_BY,	`;
            query += ` 	     D.LRH_LEADER_APP_DATE,	`;
            query += ` 	     D.LRH_LEADER_APP_FISCALYR,	`;
            query += ` 	     D.LRH_LEADER_COMMENT,	`;
            query += ` 	     D.LRH_SUMIT_TO_SG,	`;
            query += ` 	     D.LRH_SG_TYPE,	`;
            query += ` 	     D.LRH_CREATE_DATE,	`;
            query += ` 	     D.LRH_CREATE_BY,	`;
            query += ` 	     D.LRH_FILE_PATH,	`;
            query += ` 	     D.LRH_REQ_TYPE,	`;
            query += ` 	     D.LRH_SG_NO,	`;
            query += ` 	     D.LRH_LEADER_APP_MONTH,	`;
            query += ` 	     D.LRH_REQ_MONTH,	`;
            query += ` 	     D.LRH_SEND_DATE,	`;
            query += ` 	     D.LRH_REQ_TYPE_TEAM)	`;
            await connect.execute(query,
                [LOCTno,
                    LRH_FACTORY,
                    LRH_COST_CENTER,
                    LRH_REQ_DATE,
                    LRH_REQ_EMP_TYPE,
                    LRH_REQ_BY,
                    LRH_REQ_NAME,
                    LRH_REQ_SURNAME,
                    LRH_REQ_PROCESS,
                    LRH_REQ_POSITION,
                    LRH_REQ_MANAGER,
                    P_STATUS, //LRH_REQ_STATUS
                    LRH_FILENAME,
                    LRH_FILESERVER,
                    Subject,
                    LRH_DET_BEFORE,
                    LRH_DET_AFTER,
                    LRH_MH_OUTPUT,
                    LRH_MH_FORECAST,
                    LRH_MH_TSAVE,
                    LRH_MC_WCODE,
                    LRH_MC_WCOST,
                    LRH_MC_TSAVE,
                    LRH_EVALUATE_STS,
                    LRH_EVALUATE_DATE,
                    LRH_LEADER_RESULT,
                    LRH_LEADER_APP_BY,
                    LRH_LEADER_APP_DATE,
                    LRH_LEADER_APP_FISCALYR,
                    LRH_LEADER_COMMENT,
                    LRH_SUMIT_TO_SG,
                    LRH_SG_TYPE.value,
                    LRH_REQ_BY,
                    LRH_REQ_BY,
                    LRH_FILE_PATH,
                    LRH_REQ_TYPE,
                    SGTno,
                    LRH_LEADER_APP_MONTH,
                    P_STATUS,
                    LRH_REQ_TYPE_TEAM]);

            query = ``;
            query += ` DELETE HR.LOCT_SUGGESTION_TEAM T WHERE T.LST_REQ_NO = :1 `;
            await connect.execute(query, [LOCTno]);


            let calMHR = 0;
            if (SSH_MEMBER_TEAM.length > 0) {
                calMHR = LRH_MH_TSAVE / SSH_MEMBER_TEAM.length
            }

            for (const item of SSH_MEMBER_TEAM) {
                const { T_EMP_ID, T_EMP_JOBGRAD, T_EMP_CC } = item;
                query = ``;
                query += ` INSERT INTO HR.LOCT_SUGGESTION_TEAM T `;
                query += `   (T.LST_REQ_NO, `;
                query += `    T.LST_EMP_ID, `;
                query += `    T.LST_POS_GRADE, `;
                query += `    T.LST_COST_CENTER, `;
                query += `    T.LST_SAVE_MHR, `;
                query += `    T.LST_CREATE_DATE, `;
                query += `    T.LST_CREATE_BY, `;
                query += `    T.LST_UPDATE_DATE, `;
                query += `    T.LST_UPDATE_BY) `;
                query += ` VALUES `;
                query += `   (:1, :2, :3, :4, :5, SYSDATE, :6, SYSDATE, :7) `;
                await connect.execute(query, [LOCTno, T_EMP_ID, T_EMP_JOBGRAD, T_EMP_CC, calMHR, LRH_REQ_BY, LRH_REQ_BY]);
            }
            query = ``;
            query += ` 	MERGE INTO HR.SG_SUGGESTION_HEADER T	`;
            query += ` 	USING (SELECT :1 AS SSH_REQ_NO,	`;
            query += ` 	              :2 AS SSH_FACTORY,	`;
            query += ` 	              :3 AS SSH_COST_CENTER,	`;
            query += ` 	              :4 AS SSH_DEPT,	`;
            query += ` 	              :5 AS SSH_SECTION,	`;
            query += ` 	              SYSDATE AS SSH_REQ_DATE,	`;
            query += ` 	              :6 AS SSH_EMP_TYPE,	`;
            query += ` 	              :7 AS SSH_REQ_BY,	`;
            query += ` 	              :8 AS SSH_REQ_NAME,	`;
            query += ` 	              :9 AS SSH_REQ_SURNAME,	`;
            query += ` 	              :10 AS SSH_REQ_PROCESS,	`;
            query += ` 	              :11 AS SSH_REQ_POSITION,	`;
            query += ` 	              :12 AS SSH_REQ_MANAGER,	`;
            query += ` 	              :13 AS SSH_REQ_STATUS,	`;
            query += ` 	              :14 AS SSH_SUGGESTION_TYPE,	`;
            query += ` 	              :15 AS SSH_SUBJECT,	`;
            query += ` 	              :16 AS SSH_DET_BEFORE,	`;
            query += ` 	              :17 AS SSH_DET_SUGGESTION,	`;
            query += ` 	              SYSDATE AS SSH_CREATE_DATE,	`;
            query += ` 	              'SGT' AS SSH_CREATE_BY,	`;
            query += ` 	              SYSDATE AS SSH_UPDATE_DATE,	`;
            query += ` 	              'SGT' AS SSH_UPDATE_BY,	`;
            query += ` 	              :18 AS SSH_REQ_TYPE,	`;
            query += ` 	              :19 AS SSH_FILENAME,	`;
            query += ` 	              :20 AS SSH_MH_TSAVE,	`;
            query += ` 	              :21 AS SSH_MC_TSAVE,	`;
            query += ` 	              :22 AS SSH_FILESERVER,	`;
            query += ` 	              :23 AS SSH_TEAM,	`;
            query += ` 	              :24 AS SSH_SV_APP_BY	`;
            query += ` 	         FROM DUAL) D	`;
            query += ` 	ON (T.SSH_REQ_NO = D.SSH_REQ_NO)	`;
            query += ` 	WHEN MATCHED THEN	`;
            query += ` 	  UPDATE	`;
            query += ` 	     SET T.SSH_FACTORY         = D.SSH_FACTORY,	`;
            query += ` 	         T.SSH_COST_CENTER     = D.SSH_COST_CENTER,	`;
            query += ` 	         T.SSH_DEPT            = D.SSH_DEPT,	`;
            query += ` 	         T.SSH_SECTION         = D.SSH_SECTION,	`;
            query += ` 	         T.SSH_EMP_TYPE        = D.SSH_EMP_TYPE,	`;
            query += ` 	         T.SSH_REQ_BY          = D.SSH_REQ_BY,	`;
            query += ` 	         T.SSH_REQ_NAME        = D.SSH_REQ_NAME,	`;
            query += ` 	         T.SSH_REQ_SURNAME     = D.SSH_REQ_SURNAME,	`;
            query += ` 	         T.SSH_REQ_PROCESS     = D.SSH_REQ_PROCESS,	`;
            query += ` 	         T.SSH_REQ_POSITION    = D.SSH_REQ_POSITION,	`;
            query += ` 	         T.SSH_REQ_MANAGER     = D.SSH_REQ_MANAGER,	`;
            query += ` 	         T.SSH_REQ_STATUS      = D.SSH_REQ_STATUS,	`;
            query += ` 	         T.SSH_SUGGESTION_TYPE = D.SSH_SUGGESTION_TYPE,	`;
            query += ` 	         T.SSH_SUBJECT         = D.SSH_SUBJECT,	`;
            query += ` 	         T.SSH_DET_BEFORE      = D.SSH_DET_BEFORE,	`;
            query += ` 	         T.SSH_DET_SUGGESTION  = D.SSH_DET_SUGGESTION,	`;
            query += ` 	         T.SSH_UPDATE_DATE     = D.SSH_UPDATE_DATE,	`;
            query += ` 	         T.SSH_UPDATE_BY       = D.SSH_UPDATE_BY,	`;
            query += ` 	         T.SSH_REQ_TYPE        = D.SSH_REQ_TYPE,	`;
            query += ` 	         T.SSH_FILENAME        = D.SSH_FILENAME,	`;
            query += ` 	         T.SSH_MH_TSAVE        = D.SSH_MH_TSAVE,	`;
            query += ` 	         T.SSH_MC_TSAVE        = D.SSH_MC_TSAVE,	`;
            query += ` 	         T.SSH_FILESERVER      = D.SSH_FILESERVER,	`;
            query += ` 	         T.SSH_TEAM            = D.SSH_TEAM,	`;
            query += ` 	         T.SSH_SV_APP_BY       = D.SSH_SV_APP_BY	`;
            query += ` 	WHEN NOT MATCHED THEN	`;
            query += ` 	  INSERT	`;
            query += ` 	    (T.SSH_REQ_NO,	`;
            query += ` 	     T.SSH_FACTORY,	`;
            query += ` 	     T.SSH_COST_CENTER,	`;
            query += ` 	     T.SSH_DEPT,	`;
            query += ` 	     T.SSH_SECTION,	`;
            query += ` 	     T.SSH_REQ_DATE,	`;
            query += ` 	     T.SSH_EMP_TYPE,	`;
            query += ` 	     T.SSH_REQ_BY,	`;
            query += ` 	     T.SSH_REQ_NAME,	`;
            query += ` 	     T.SSH_REQ_SURNAME,	`;
            query += ` 	     T.SSH_REQ_PROCESS,	`;
            query += ` 	     T.SSH_REQ_POSITION,	`;
            query += ` 	     T.SSH_REQ_MANAGER,	`;
            query += ` 	     T.SSH_REQ_STATUS,	`;
            query += ` 	     T.SSH_SUGGESTION_TYPE,	`;
            query += ` 	     T.SSH_SUBJECT,	`;
            query += ` 	     T.SSH_DET_BEFORE,	`;
            query += ` 	     T.SSH_DET_SUGGESTION,	`;
            query += ` 	     T.SSH_CREATE_DATE,	`;
            query += ` 	     T.SSH_CREATE_BY,	`;
            query += ` 	     T.SSH_UPDATE_DATE,	`;
            query += ` 	     T.SSH_UPDATE_BY,	`;
            query += ` 	     T.SSH_REQ_TYPE,	`;
            query += ` 	     T.SSH_FILENAME,	`;
            query += ` 	     T.SSH_MH_TSAVE,	`;
            query += ` 	     T.SSH_MC_TSAVE,	`;
            query += ` 	     T.SSH_FILESERVER,	`;
            query += ` 	     T.SSH_TEAM,	`;
            query += ` 	     T.SSH_SV_APP_BY)	`;
            query += ` 	  VALUES	`;
            query += ` 	    (D.SSH_REQ_NO,	`;
            query += ` 	     D.SSH_FACTORY,	`;
            query += ` 	     D.SSH_COST_CENTER,	`;
            query += ` 	     D.SSH_DEPT,	`;
            query += ` 	     D.SSH_SECTION,	`;
            query += ` 	     D.SSH_REQ_DATE,	`;
            query += ` 	     D.SSH_EMP_TYPE,	`;
            query += ` 	     D.SSH_REQ_BY,	`;
            query += ` 	     D.SSH_REQ_NAME,	`;
            query += ` 	     D.SSH_REQ_SURNAME,	`;
            query += ` 	     D.SSH_REQ_PROCESS,	`;
            query += ` 	     D.SSH_REQ_POSITION,	`;
            query += ` 	     D.SSH_REQ_MANAGER,	`;
            query += ` 	     D.SSH_REQ_STATUS,	`;
            query += ` 	     D.SSH_SUGGESTION_TYPE,	`;
            query += ` 	     D.SSH_SUBJECT,	`;
            query += ` 	     D.SSH_DET_BEFORE,	`;
            query += ` 	     D.SSH_DET_SUGGESTION,	`;
            query += ` 	     D.SSH_CREATE_DATE,	`;
            query += ` 	     D.SSH_CREATE_BY,	`;
            query += ` 	     D.SSH_UPDATE_DATE,	`;
            query += ` 	     D.SSH_UPDATE_BY,	`;
            query += ` 	     D.SSH_REQ_TYPE,	`;
            query += ` 	     D.SSH_FILENAME,	`;
            query += ` 	     D.SSH_MH_TSAVE,	`;
            query += ` 	     D.SSH_MC_TSAVE,	`;
            query += ` 	     D.SSH_FILESERVER,	`;
            query += ` 	     D.SSH_TEAM,	`;
            query += ` 	     D.SSH_SV_APP_BY)	`;
            await connect.execute(query, [
                SGTno,
                LRH_FACTORY_CODE,
                LRH_COST_CENTER,
                '',
                '',
                LRH_REQ_EMP_TYPE,
                LRH_REQ_BY,
                LRH_REQ_NAME,
                LRH_REQ_SURNAME,
                LRH_REQ_PROCESS,
                LRH_REQ_POSITION,
                LRH_REQ_MANAGER,
                P_STATUS_SG, //LRH_REQ_STATUS
                LRH_SG_TYPE.value,
                Subject,
                LRH_DET_BEFORE,
                LRH_DET_AFTER,
                SSH_REQ_TYPE,
                LRH_FILENAME,
                LRH_MH_TSAVE,
                LRH_MC_TSAVE,
                LRH_FILESERVER,
                SSH_TEAM_NAME,
                SSH_SV_APP_BY.value
            ]);

            query = ``;
            query += ` DELETE HR.SG_SUGGESTION_TEAM T WHERE T.SST_REQ_NO = :1 `;
            await connect.execute(query, [SGTno]);

            for (const item of SSH_MEMBER_TEAM) {
                const { T_EMP_ID, T_EMP_JOBGRAD, T_EMP_CC } = item;
                query = ``;
                query += ` INSERT INTO HR.SG_SUGGESTION_TEAM T `;
                query += `   (T.SST_REQ_NO, `;
                query += `    T.SST_EMP_ID, `;
                query += `    T.SST_POS_GRADE, `;
                query += `    T.SST_COST_CENTER, `;
                query += `    T.SST_SAVE_MHR, `;
                query += `    T.SST_CREATE_DATE, `;
                query += `    T.SST_CREATE_BY, `;
                query += `    T.SST_UPDATE_DATE, `;
                query += `    T.SST_UPDATE_BY) `;
                query += ` VALUES `;
                query += `   (:1, :2, :3, :4, :5, SYSDATE, :6, SYSDATE, :7) `;
                await connect.execute(query, [SGTno, T_EMP_ID, T_EMP_JOBGRAD, T_EMP_CC, calMHR, LRH_REQ_BY, LRH_REQ_BY]);
            }

            if (LRH_SSH_FILE !== '') {
                await uploadFileFTP(LRH_FILESERVER, LRH_SSH_FILE)
            }

        } else if (LRH_REQ_TYPE === '2' || LRH_REQ_TYPE === '4') {
            query = ``;
            query += ` DELETE HR.LOCT_SUGGESTION_TEAM T WHERE T.LST_REQ_NO = :1 `;
            await connect.execute(query, [LOCTno]);

            query = ``;
            query += ` DELETE HR.SG_SUGGESTION_TEAM T WHERE T.SST_REQ_NO = :1 `;
            await connect.execute(query, [SGTno]);

            SGTno = ``;
            query = ``;
            query += ` 	MERGE INTO HR.LOCT_REQUEST_HEADER T	`;
            query += ` 	USING (SELECT :1 AS LRH_REQ_NO,	`;
            query += ` 	              :2 AS LRH_FACTORY,	`;
            query += ` 	              :3 AS LRH_COST_CENTER,	`;
            query += ` 	              TO_DATE(:4, 'DD/MM/YYYY HH24:MI:SS') AS LRH_REQ_DATE,	`;
            query += ` 	              :5 AS LRH_REQ_EMP_TYPE,	`;
            query += ` 	              :6 AS LRH_REQ_BY,	`;
            query += ` 	              :7 AS LRH_REQ_NAME,	`;
            query += ` 	              :8 AS LRH_REQ_SURNAME,	`;
            query += ` 	              :9 AS LRH_REQ_PROCESS,	`;
            query += ` 	              :10 AS LRH_REQ_POSITION,	`;
            query += ` 	              :11 AS LRH_REQ_MANAGER,	`;
            query += ` 	              :12 AS LRH_REQ_STATUS,	`;
            query += ` 	              :13 AS LRH_FILENAME,	`;
            query += ` 	              :14 AS LRH_FILESERVER,	`;
            query += ` 	              :15 AS LRH_PROBLEM,	`;
            query += ` 	              :16 AS LRH_DET_BEFORE,	`;
            query += ` 	              :17 AS LRH_DET_AFTER,	`;
            query += ` 	              :18 AS LRH_MH_OUTPUT,	`;
            query += ` 	              :19 AS LRH_MH_FORECAST,	`;
            query += ` 	              :20 AS LRH_MH_TSAVE,	`;
            query += ` 	              :21 AS LRH_MC_WCODE,	`;
            query += ` 	              :22 AS LRH_MC_WCOST,	`;
            query += ` 	              :23 AS LRH_MC_TSAVE,	`;
            query += ` 	              :24 AS LRH_EVALUATE_STS,	`;
            query += ` 	              :25 AS LRH_EVALUATE_DATE,	`;
            query += ` 	              :26 AS LRH_LEADER_RESULT,	`;
            query += ` 	              :27 AS LRH_LEADER_APP_BY,	`;
            query += ` 	              :28 AS LRH_LEADER_APP_DATE,	`;
            query += ` 	              :29 AS LRH_LEADER_APP_FISCALYR,	`;
            query += ` 	              :30 AS LRH_LEADER_COMMENT,	`;
            query += ` 	              :31 AS LRH_SUMIT_TO_SG,	`;
            query += ` 	              :32 AS LRH_SG_TYPE,	`;
            query += ` 	              SYSDATE AS LRH_CREATE_DATE,	`;
            query += ` 	              :33 AS LRH_CREATE_BY,	`;
            query += ` 	              SYSDATE AS LRH_UPDATE_DATE,	`;
            query += ` 	              :34 AS LRH_UPDATE_BY,	`;
            query += ` 	              :35 AS LRH_FILE_PATH,	`;
            query += ` 	              :36 AS LRH_REQ_TYPE,	`;
            query += ` 	              :37 AS LRH_SG_NO,	`;
            query += ` 	              :38 AS LRH_LEADER_APP_MONTH,	`;
            query += ` 	              TO_CHAR(SYSDATE, 'MM_YYYY') AS LRH_REQ_MONTH,	`;
            query += ` 	              DECODE(:39, 'WT', SYSDATE, '') AS LRH_SEND_DATE,	`;
            query += ` 	              :40 AS LRH_REQ_TYPE_TEAM	`;
            query += ` 	         FROM DUAL) D	`;
            query += ` 	ON (T.LRH_REQ_NO = D.LRH_REQ_NO)	`;
            query += ` 	WHEN MATCHED THEN	`;
            query += ` 	  UPDATE	`;
            query += ` 	     SET T.LRH_FACTORY             = D.LRH_FACTORY,	`;
            query += ` 	         T.LRH_COST_CENTER         = D.LRH_COST_CENTER,	`;
            query += ` 	         T.LRH_REQ_EMP_TYPE        = D.LRH_REQ_EMP_TYPE,	`;
            query += ` 	         T.LRH_REQ_BY              = D.LRH_REQ_BY,	`;
            query += ` 	         T.LRH_REQ_NAME            = D.LRH_REQ_NAME,	`;
            query += ` 	         T.LRH_REQ_SURNAME         = D.LRH_REQ_SURNAME,	`;
            query += ` 	         T.LRH_REQ_PROCESS         = D.LRH_REQ_PROCESS,	`;
            query += ` 	         T.LRH_REQ_POSITION        = D.LRH_REQ_POSITION,	`;
            query += ` 	         T.LRH_REQ_MANAGER         = D.LRH_REQ_MANAGER,	`;
            query += ` 	         T.LRH_REQ_STATUS          = D.LRH_REQ_STATUS,	`;
            query += ` 	         T.LRH_FILENAME            = D.LRH_FILENAME,	`;
            query += ` 	         T.LRH_FILESERVER          = D.LRH_FILESERVER,	`;
            query += ` 	         T.LRH_PROBLEM             = D.LRH_PROBLEM,	`;
            query += ` 	         T.LRH_DET_BEFORE          = D.LRH_DET_BEFORE,	`;
            query += ` 	         T.LRH_DET_AFTER           = D.LRH_DET_AFTER,	`;
            query += ` 	         T.LRH_MH_OUTPUT           = D.LRH_MH_OUTPUT,	`;
            query += ` 	         T.LRH_MH_FORECAST         = D.LRH_MH_FORECAST,	`;
            query += ` 	         T.LRH_MH_TSAVE            = D.LRH_MH_TSAVE,	`;
            query += ` 	         T.LRH_MC_WCODE            = D.LRH_MC_WCODE,	`;
            query += ` 	         T.LRH_MC_WCOST            = D.LRH_MC_WCOST,	`;
            query += ` 	         T.LRH_MC_TSAVE            = D.LRH_MC_TSAVE,	`;
            query += ` 	         T.LRH_EVALUATE_STS        = D.LRH_EVALUATE_STS,	`;
            query += ` 	         T.LRH_EVALUATE_DATE       = D.LRH_EVALUATE_DATE,	`;
            query += ` 	         T.LRH_LEADER_RESULT       = D.LRH_LEADER_RESULT,	`;
            query += ` 	         T.LRH_LEADER_APP_BY       = D.LRH_LEADER_APP_BY,	`;
            query += ` 	         T.LRH_LEADER_APP_DATE     = D.LRH_LEADER_APP_DATE,	`;
            query += ` 	         T.LRH_LEADER_APP_FISCALYR = D.LRH_LEADER_APP_FISCALYR,	`;
            query += ` 	         T.LRH_LEADER_COMMENT      = D.LRH_LEADER_COMMENT,	`;
            query += ` 	         T.LRH_SUMIT_TO_SG         = D.LRH_SUMIT_TO_SG,	`;
            query += ` 	         T.LRH_SG_TYPE             = D.LRH_SG_TYPE,	`;
            query += ` 	         T.LRH_UPDATE_DATE         = D.LRH_UPDATE_DATE,	`;
            query += ` 	         T.LRH_UPDATE_BY           = D.LRH_UPDATE_BY,	`;
            query += ` 	         T.LRH_FILE_PATH           = D.LRH_FILE_PATH,	`;
            query += ` 	         T.LRH_REQ_TYPE            = D.LRH_REQ_TYPE,	`;
            query += ` 	         T.LRH_SG_NO               = D.LRH_SG_NO,	`;
            query += ` 	         T.LRH_LEADER_APP_MONTH    = D.LRH_LEADER_APP_MONTH,	`;
            query += ` 	         T.LRH_SEND_DATE           = D.LRH_SEND_DATE,	`;
            query += ` 	         T.LRH_REQ_TYPE_TEAM       = D.LRH_REQ_TYPE_TEAM	`;
            query += ` 	WHEN NOT MATCHED THEN	`;
            query += ` 	  INSERT	`;
            query += ` 	    (T.LRH_REQ_NO,	`;
            query += ` 	     T.LRH_FACTORY,	`;
            query += ` 	     T.LRH_COST_CENTER,	`;
            query += ` 	     T.LRH_REQ_DATE,	`;
            query += ` 	     T.LRH_REQ_EMP_TYPE,	`;
            query += ` 	     T.LRH_REQ_BY,	`;
            query += ` 	     T.LRH_REQ_NAME,	`;
            query += ` 	     T.LRH_REQ_SURNAME,	`;
            query += ` 	     T.LRH_REQ_PROCESS,	`;
            query += ` 	     T.LRH_REQ_POSITION,	`;
            query += ` 	     T.LRH_REQ_MANAGER,	`;
            query += ` 	     T.LRH_REQ_STATUS,	`;
            query += ` 	     T.LRH_FILENAME,	`;
            query += ` 	     T.LRH_FILESERVER,	`;
            query += ` 	     T.LRH_PROBLEM,	`;
            query += ` 	     T.LRH_DET_BEFORE,	`;
            query += ` 	     T.LRH_DET_AFTER,	`;
            query += ` 	     T.LRH_MH_OUTPUT,	`;
            query += ` 	     T.LRH_MH_FORECAST,	`;
            query += ` 	     T.LRH_MH_TSAVE,	`;
            query += ` 	     T.LRH_MC_WCODE,	`;
            query += ` 	     T.LRH_MC_WCOST,	`;
            query += ` 	     T.LRH_MC_TSAVE,	`;
            query += ` 	     T.LRH_EVALUATE_STS,	`;
            query += ` 	     T.LRH_EVALUATE_DATE,	`;
            query += ` 	     T.LRH_LEADER_RESULT,	`;
            query += ` 	     T.LRH_LEADER_APP_BY,	`;
            query += ` 	     T.LRH_LEADER_APP_DATE,	`;
            query += ` 	     T.LRH_LEADER_APP_FISCALYR,	`;
            query += ` 	     T.LRH_LEADER_COMMENT,	`;
            query += ` 	     T.LRH_SUMIT_TO_SG,	`;
            query += ` 	     T.LRH_SG_TYPE,	`;
            query += ` 	     T.LRH_CREATE_DATE,	`;
            query += ` 	     T.LRH_CREATE_BY,	`;
            query += ` 	     T.LRH_FILE_PATH,	`;
            query += ` 	     T.LRH_REQ_TYPE,	`;
            query += ` 	     T.LRH_SG_NO,	`;
            query += ` 	     T.LRH_LEADER_APP_MONTH,	`;
            query += ` 	     T.LRH_REQ_MONTH,	`;
            query += ` 	     T.LRH_SEND_DATE,	`;
            query += ` 	     T.LRH_REQ_TYPE_TEAM)	`;
            query += ` 	  VALUES	`;
            query += ` 	    (D.LRH_REQ_NO,	`;
            query += ` 	     D.LRH_FACTORY,	`;
            query += ` 	     D.LRH_COST_CENTER,	`;
            query += ` 	     D.LRH_REQ_DATE,	`;
            query += ` 	     D.LRH_REQ_EMP_TYPE,	`;
            query += ` 	     D.LRH_REQ_BY,	`;
            query += ` 	     D.LRH_REQ_NAME,	`;
            query += ` 	     D.LRH_REQ_SURNAME,	`;
            query += ` 	     D.LRH_REQ_PROCESS,	`;
            query += ` 	     D.LRH_REQ_POSITION,	`;
            query += ` 	     D.LRH_REQ_MANAGER,	`;
            query += ` 	     D.LRH_REQ_STATUS,	`;
            query += ` 	     D.LRH_FILENAME,	`;
            query += ` 	     D.LRH_FILESERVER,	`;
            query += ` 	     D.LRH_PROBLEM,	`;
            query += ` 	     D.LRH_DET_BEFORE,	`;
            query += ` 	     D.LRH_DET_AFTER,	`;
            query += ` 	     D.LRH_MH_OUTPUT,	`;
            query += ` 	     D.LRH_MH_FORECAST,	`;
            query += ` 	     D.LRH_MH_TSAVE,	`;
            query += ` 	     D.LRH_MC_WCODE,	`;
            query += ` 	     D.LRH_MC_WCOST,	`;
            query += ` 	     D.LRH_MC_TSAVE,	`;
            query += ` 	     D.LRH_EVALUATE_STS,	`;
            query += ` 	     D.LRH_EVALUATE_DATE,	`;
            query += ` 	     D.LRH_LEADER_RESULT,	`;
            query += ` 	     D.LRH_LEADER_APP_BY,	`;
            query += ` 	     D.LRH_LEADER_APP_DATE,	`;
            query += ` 	     D.LRH_LEADER_APP_FISCALYR,	`;
            query += ` 	     D.LRH_LEADER_COMMENT,	`;
            query += ` 	     D.LRH_SUMIT_TO_SG,	`;
            query += ` 	     D.LRH_SG_TYPE,	`;
            query += ` 	     D.LRH_CREATE_DATE,	`;
            query += ` 	     D.LRH_CREATE_BY,	`;
            query += ` 	     D.LRH_FILE_PATH,	`;
            query += ` 	     D.LRH_REQ_TYPE,	`;
            query += ` 	     D.LRH_SG_NO,	`;
            query += ` 	     D.LRH_LEADER_APP_MONTH,	`;
            query += ` 	     D.LRH_REQ_MONTH,	`;
            query += ` 	     D.LRH_SEND_DATE,	`;
            query += ` 	     D.LRH_REQ_TYPE_TEAM)	`;
            await connect.execute(query,
                [LOCTno,
                    LRH_FACTORY,
                    LRH_COST_CENTER,
                    LRH_REQ_DATE,
                    LRH_REQ_EMP_TYPE,
                    LRH_REQ_BY,
                    LRH_REQ_NAME,
                    LRH_REQ_SURNAME,
                    LRH_REQ_PROCESS,
                    LRH_REQ_POSITION,
                    LRH_REQ_MANAGER,
                    P_STATUS,
                    LRH_FILENAME,
                    LRH_FILESERVER,
                    Subject,
                    LRH_DET_BEFORE,
                    LRH_DET_AFTER,
                    LRH_MH_OUTPUT,
                    LRH_MH_FORECAST,
                    LRH_MH_TSAVE,
                    LRH_MC_WCODE,
                    LRH_MC_WCOST,
                    LRH_MC_TSAVE,
                    LRH_EVALUATE_STS,
                    LRH_EVALUATE_DATE,
                    LRH_LEADER_RESULT,
                    LRH_LEADER_APP_BY,
                    LRH_LEADER_APP_DATE,
                    LRH_LEADER_APP_FISCALYR,
                    LRH_LEADER_COMMENT,
                    LRH_SUMIT_TO_SG,
                    LRH_SG_TYPE.value,
                    LRH_REQ_BY,
                    LRH_REQ_BY,
                    LRH_FILE_PATH,
                    LRH_REQ_TYPE,
                    SGTno,
                    LRH_LEADER_APP_MONTH,
                    P_STATUS,
                    LRH_REQ_TYPE_TEAM]);

            if (LRH_SSH_FILE !== '') {
                await saveBase64ToFile(LRH_FILESERVER, LRH_SSH_FILE)
            }


        } else if (LRH_REQ_TYPE === '5') {
            query = ``;
            query += ` 	MERGE INTO HR.SG_SUGGESTION_HEADER T	`;
            query += ` 	USING (SELECT :1 AS SSH_REQ_NO,	`;
            query += ` 	              :2 AS SSH_FACTORY,	`;
            query += ` 	              :3 AS SSH_COST_CENTER,	`;
            query += ` 	              :4 AS SSH_DEPT,	`;
            query += ` 	              :5 AS SSH_SECTION,	`;
            query += ` 	              SYSDATE AS SSH_REQ_DATE,	`;
            query += ` 	              :6 AS SSH_EMP_TYPE,	`;
            query += ` 	              :7 AS SSH_REQ_BY,	`;
            query += ` 	              :8 AS SSH_REQ_NAME,	`;
            query += ` 	              :9 AS SSH_REQ_SURNAME,	`;
            query += ` 	              :10 AS SSH_REQ_PROCESS,	`;
            query += ` 	              :11 AS SSH_REQ_POSITION,	`;
            query += ` 	              :12 AS SSH_REQ_MANAGER,	`;
            query += ` 	              :13 AS SSH_REQ_STATUS,	`;
            query += ` 	              :14 AS SSH_SUGGESTION_TYPE,	`;
            query += ` 	              :15 AS SSH_SUBJECT,	`;
            query += ` 	              :16 AS SSH_DET_BEFORE,	`;
            query += ` 	              :17 AS SSH_DET_SUGGESTION,	`;
            query += ` 	              SYSDATE AS SSH_CREATE_DATE,	`;
            query += ` 	              'SGT' AS SSH_CREATE_BY,	`;
            query += ` 	              SYSDATE AS SSH_UPDATE_DATE,	`;
            query += ` 	              'SGT' AS SSH_UPDATE_BY,	`;
            query += ` 	              :18 AS SSH_REQ_TYPE,	`;
            query += ` 	              :19 AS SSH_FILENAME,	`;
            query += ` 	              :20 AS SSH_MH_TSAVE,	`;
            query += ` 	              :21 AS SSH_MC_TSAVE,	`;
            query += ` 	              :22 AS SSH_FILESERVER,	`;
            query += ` 	              :23 AS SSH_TEAM,	`;
            query += ` 	              :24 AS SSH_SV_APP_BY	`;
            query += ` 	         FROM DUAL) D	`;
            query += ` 	ON (T.SSH_REQ_NO = D.SSH_REQ_NO)	`;
            query += ` 	WHEN MATCHED THEN	`;
            query += ` 	  UPDATE	`;
            query += ` 	     SET T.SSH_FACTORY         = D.SSH_FACTORY,	`;
            query += ` 	         T.SSH_COST_CENTER     = D.SSH_COST_CENTER,	`;
            query += ` 	         T.SSH_DEPT            = D.SSH_DEPT,	`;
            query += ` 	         T.SSH_SECTION         = D.SSH_SECTION,	`;
            query += ` 	         T.SSH_EMP_TYPE        = D.SSH_EMP_TYPE,	`;
            query += ` 	         T.SSH_REQ_BY          = D.SSH_REQ_BY,	`;
            query += ` 	         T.SSH_REQ_NAME        = D.SSH_REQ_NAME,	`;
            query += ` 	         T.SSH_REQ_SURNAME     = D.SSH_REQ_SURNAME,	`;
            query += ` 	         T.SSH_REQ_PROCESS     = D.SSH_REQ_PROCESS,	`;
            query += ` 	         T.SSH_REQ_POSITION    = D.SSH_REQ_POSITION,	`;
            query += ` 	         T.SSH_REQ_MANAGER     = D.SSH_REQ_MANAGER,	`;
            query += ` 	         T.SSH_REQ_STATUS      = D.SSH_REQ_STATUS,	`;
            query += ` 	         T.SSH_SUGGESTION_TYPE = D.SSH_SUGGESTION_TYPE,	`;
            query += ` 	         T.SSH_SUBJECT         = D.SSH_SUBJECT,	`;
            query += ` 	         T.SSH_DET_BEFORE      = D.SSH_DET_BEFORE,	`;
            query += ` 	         T.SSH_DET_SUGGESTION  = D.SSH_DET_SUGGESTION,	`;
            query += ` 	         T.SSH_UPDATE_DATE     = D.SSH_UPDATE_DATE,	`;
            query += ` 	         T.SSH_UPDATE_BY       = D.SSH_UPDATE_BY,	`;
            query += ` 	         T.SSH_REQ_TYPE        = D.SSH_REQ_TYPE,	`;
            query += ` 	         T.SSH_FILENAME        = D.SSH_FILENAME,	`;
            query += ` 	         T.SSH_MH_TSAVE        = D.SSH_MH_TSAVE,	`;
            query += ` 	         T.SSH_MC_TSAVE        = D.SSH_MC_TSAVE,	`;
            query += ` 	         T.SSH_FILESERVER      = D.SSH_FILESERVER,	`;
            query += ` 	         T.SSH_TEAM            = D.SSH_TEAM,	`;
            query += ` 	         T.SSH_SV_APP_BY       = D.SSH_SV_APP_BY	`;
            query += ` 	WHEN NOT MATCHED THEN	`;
            query += ` 	  INSERT	`;
            query += ` 	    (T.SSH_REQ_NO,	`;
            query += ` 	     T.SSH_FACTORY,	`;
            query += ` 	     T.SSH_COST_CENTER,	`;
            query += ` 	     T.SSH_DEPT,	`;
            query += ` 	     T.SSH_SECTION,	`;
            query += ` 	     T.SSH_REQ_DATE,	`;
            query += ` 	     T.SSH_EMP_TYPE,	`;
            query += ` 	     T.SSH_REQ_BY,	`;
            query += ` 	     T.SSH_REQ_NAME,	`;
            query += ` 	     T.SSH_REQ_SURNAME,	`;
            query += ` 	     T.SSH_REQ_PROCESS,	`;
            query += ` 	     T.SSH_REQ_POSITION,	`;
            query += ` 	     T.SSH_REQ_MANAGER,	`;
            query += ` 	     T.SSH_REQ_STATUS,	`;
            query += ` 	     T.SSH_SUGGESTION_TYPE,	`;
            query += ` 	     T.SSH_SUBJECT,	`;
            query += ` 	     T.SSH_DET_BEFORE,	`;
            query += ` 	     T.SSH_DET_SUGGESTION,	`;
            query += ` 	     T.SSH_CREATE_DATE,	`;
            query += ` 	     T.SSH_CREATE_BY,	`;
            query += ` 	     T.SSH_UPDATE_DATE,	`;
            query += ` 	     T.SSH_UPDATE_BY,	`;
            query += ` 	     T.SSH_REQ_TYPE,	`;
            query += ` 	     T.SSH_FILENAME,	`;
            query += ` 	     T.SSH_MH_TSAVE,	`;
            query += ` 	     T.SSH_MC_TSAVE,	`;
            query += ` 	     T.SSH_FILESERVER,	`;
            query += ` 	     T.SSH_TEAM,	`;
            query += ` 	     T.SSH_SV_APP_BY)	`;
            query += ` 	  VALUES	`;
            query += ` 	    (D.SSH_REQ_NO,	`;
            query += ` 	     D.SSH_FACTORY,	`;
            query += ` 	     D.SSH_COST_CENTER,	`;
            query += ` 	     D.SSH_DEPT,	`;
            query += ` 	     D.SSH_SECTION,	`;
            query += ` 	     D.SSH_REQ_DATE,	`;
            query += ` 	     D.SSH_EMP_TYPE,	`;
            query += ` 	     D.SSH_REQ_BY,	`;
            query += ` 	     D.SSH_REQ_NAME,	`;
            query += ` 	     D.SSH_REQ_SURNAME,	`;
            query += ` 	     D.SSH_REQ_PROCESS,	`;
            query += ` 	     D.SSH_REQ_POSITION,	`;
            query += ` 	     D.SSH_REQ_MANAGER,	`;
            query += ` 	     D.SSH_REQ_STATUS,	`;
            query += ` 	     D.SSH_SUGGESTION_TYPE,	`;
            query += ` 	     D.SSH_SUBJECT,	`;
            query += ` 	     D.SSH_DET_BEFORE,	`;
            query += ` 	     D.SSH_DET_SUGGESTION,	`;
            query += ` 	     D.SSH_CREATE_DATE,	`;
            query += ` 	     D.SSH_CREATE_BY,	`;
            query += ` 	     D.SSH_UPDATE_DATE,	`;
            query += ` 	     D.SSH_UPDATE_BY,	`;
            query += ` 	     D.SSH_REQ_TYPE,	`;
            query += ` 	     D.SSH_FILENAME,	`;
            query += ` 	     D.SSH_MH_TSAVE,	`;
            query += ` 	     D.SSH_MC_TSAVE,	`;
            query += ` 	     D.SSH_FILESERVER,	`;
            query += ` 	     D.SSH_TEAM,	`;
            query += ` 	     D.SSH_SV_APP_BY)	`;
            await connect.execute(query, [
                SGTno,
                LRH_FACTORY_CODE,
                LRH_COST_CENTER,
                '',
                '',
                LRH_REQ_EMP_TYPE,
                LRH_REQ_BY,
                LRH_REQ_NAME,
                LRH_REQ_SURNAME,
                LRH_REQ_PROCESS,
                LRH_REQ_POSITION,
                LRH_REQ_MANAGER,
                P_STATUS_SG, //LRH_REQ_STATUS
                LRH_SG_TYPE.value,
                Subject,
                LRH_DET_BEFORE,
                LRH_DET_AFTER,
                SSH_REQ_TYPE,
                LRH_FILENAME,
                LRH_MH_TSAVE,
                LRH_MC_TSAVE,
                LRH_FILESERVER,
                SSH_TEAM_NAME,
                SSH_SV_APP_BY.value
            ]);

            query = ``;
            query += ` DELETE HR.SG_SUGGESTION_TEAM T WHERE T.SST_REQ_NO = :1 `;
            await connect.execute(query, [SGTno]);


            let calMHR = 0;
            if (SSH_MEMBER_TEAM.length > 0) {
                calMHR = LRH_MH_TSAVE / SSH_MEMBER_TEAM.length
            }

            for (const item of SSH_MEMBER_TEAM) {
                const { T_EMP_ID, T_EMP_JOBGRAD, T_EMP_CC } = item;
                query = ``;
                query += ` INSERT INTO HR.SG_SUGGESTION_TEAM T `;
                query += `   (T.SST_REQ_NO, `;
                query += `    T.SST_EMP_ID, `;
                query += `    T.SST_POS_GRADE, `;
                query += `    T.SST_COST_CENTER, `;
                query += `    T.SST_SAVE_MHR, `;
                query += `    T.SST_CREATE_DATE, `;
                query += `    T.SST_CREATE_BY, `;
                query += `    T.SST_UPDATE_DATE, `;
                query += `    T.SST_UPDATE_BY) `;
                query += ` VALUES `;
                query += `   (:1, :2, :3, :4, :5, SYSDATE, :6, SYSDATE, :6) `;
                await connect.execute(query, [SGTno, T_EMP_ID, T_EMP_JOBGRAD, T_EMP_CC, calMHR, LRH_REQ_BY]);
            }

            if (LRH_SSH_FILE !== '') {
                await uploadFileFTP(LRH_FILESERVER, LRH_SSH_FILE)
            }

        }
        console.log('Save Complete : ' + LOCTno)
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

async function uploadFileFTP(filename, filebase64) {
    const client = new ftp();
    try {
        const remotePath = `/BTP2-Application_CUSR/SuggestionSystem/File/Suggestion_File/${filename}`;
        const buffer = Buffer.from(filebase64, 'base64');
        console.log('File read successfully...');

        await new Promise((resolve, reject) => {
            client.on('ready', () => {
                console.log('Connected to FTP server');
                client.put(buffer, remotePath, (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        console.log('File uploaded successfully');
                        resolve();
                    }
                    client.end();
                });
            });

            client.on('error', (err) => {
                reject(err);
            });

            client.connect({
                host: process.env.FTP_HOST,
                port: process.env.FTP_POST,
                user: process.env.FTP_USER,
                password: process.env.FTP_PASSWORD
            });
        });

    } catch (err) {
        console.error('Error uploading file:', err);
    }
}

async function downloadFileFromFTP(fileName) {
    return new Promise((resolve, reject) => {
        const client = new ftp();
        client.on('ready', () => {
            console.log(fileName);
            console.log('Connected to FTP server');
            const remotePath = `/BTP2-Application_CUSR/SuggestionSystem/File/Suggestion_File/${fileName}`;

            client.get(remotePath, (err, stream) => {
                if (err) {
                    client.end();
                    return reject(err);
                }

                let data = [];

                stream.on('data', (chunk) => {
                    data.push(chunk);
                });

                stream.on('end', () => {
                    const buffer = Buffer.concat(data);
                    const base64String = buffer.toString('base64');
                    console.log('File downloaded and converted to Base64 successfully');
                    client.end();
                    resolve(base64String);
                });

                stream.on('error', (err) => {
                    client.end();
                    reject(err);
                });
            });
        });

        client.on('error', (err) => {
            reject(err);
        });

        client.connect({
            host: process.env.FTP_HOST,
            port: process.env.FTP_POST,
            user: process.env.FTP_USER,
            password: process.env.FTP_PASSWORD
        });
    });
}

async function saveBase64ToFile(filename, base64String) {
    // แปลง Base64 string เป็น Buffer
    const filePath = path.join(__dirname, '../File', filename);
    const buffer = Buffer.from(base64String, 'base64');
    console.log('File read successfully...');

    // เขียน Buffer ลงในไฟล์
    fs.writeFileSync(filePath, buffer);
    console.log('Save File successfully');
}

async function fileToBase64(filename) {
    // อ่านไฟล์และเปลี่ยนเป็น Base64 string
    const filePath = path.join(__dirname, '../File', filename);
    const fileContent = fs.readFileSync(filePath, { encoding: 'base64' });
    console.log('Convert File to Base64 successfully')
    return fileContent;
}

module.exports.approveLOCT_IECT = async function (req, res) {
    let connect;
    try {
        const { LRH_REQ_NO,
            LRH_REQ_STATUS,
            LRH_PROBLEM,
            LRH_DET_BEFORE,
            LRH_DET_AFTER,
            LRH_MH_TSAVE,
            LRH_MC_TSAVE,
            LRH_EVALUATE_STS,
            LRH_EVALUATE_DATE,
            LRH_LEADER_RESULT,
            LRH_LEADER_COMMENT } = req.body;
        console.log(req.body)
        connect = await ConnectOracleDB("HR");
        let query = ``;
        query += ` UPDATE HR.LOCT_REQUEST_HEADER T  `;
        query += `    SET T.LRH_PROBLEM             = '${LRH_PROBLEM}', `;
        query += `        T.LRH_DET_BEFORE          = '${LRH_DET_BEFORE}', `;
        query += `        T.LRH_DET_AFTER           = '${LRH_DET_AFTER}', `;
        query += `        T.LRH_EVALUATE_STS        = '${LRH_EVALUATE_STS}', `;
        query += `        T.LRH_EVALUATE_DATE       = TO_DATE('${LRH_EVALUATE_DATE}', 'YYYYMMDD'), `;
        query += `        T.LRH_MH_TSAVE            = '${LRH_MH_TSAVE}', `;
        query += `        T.LRH_MC_TSAVE            = '${LRH_MC_TSAVE}', `;
        query += `        T.LRH_LEADER_APP_DATE     = SYSDATE, `;
        query += `        T.LRH_LEADER_RESULT       = '${LRH_LEADER_RESULT}', `;
        query += `        T.LRH_LEADER_APP_FISCALYR = TO_CHAR(SYSDATE, 'YYYY'), `;
        query += `        T.LRH_LEADER_COMMENT      = :1, `;
        query += `        T.LRH_LEADER_APP_MONTH    = TO_CHAR(SYSDATE, 'MM_YYYY'), `;
        query += `        T.LRH_REQ_STATUS          = '${LRH_REQ_STATUS}' `;
        query += `  WHERE T.LRH_REQ_NO = '${LRH_REQ_NO}' `;
        await connect.execute(query, [LRH_LEADER_COMMENT]);

        await connect.commit();
        console.log('Commit Complete')
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


module.exports.delLOCT_IECT = async function (req, res) {
    let connect;
    const P_REQ_NO = req.query.P_REQ_NO
    try {
        connect = await ConnectOracleDB("HR");
        let query = ``;

        query = ``;
        query = ` DELETE FROM HR.LOCT_SUGGESTION_TEAM T WHERE T.LST_REQ_NO = :1 `;
        await connect.execute(query, [P_REQ_NO]);

        query = ``;
        query = ` DELETE FROM HR.LOCT_REQUEST_HEADER T WHERE T.LRH_REQ_NO = :1 `;
        await connect.execute(query, [P_REQ_NO]);

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

module.exports.ImportLOCTBB = async function (req, res) {
    let connect;
    const P_STATUS = req.query.P_STATUS
    const P_STATUS_SG = req.query.P_STATUS_SG
    try {
        const { ISS_TYPE,
            LRH_REQ_NO,
            LRH_FACTORY,
            LRH_FACTORY_CODE,
            LRH_COST_CENTER,
            LRH_REQ_DATE,
            LRH_REQ_EMP_TYPE,
            LRH_REQ_BY,
            LRH_REQ_NAME,
            LRH_REQ_SURNAME,
            LRH_REQ_NAME_FULL,
            LRH_REQ_PROCESS,
            LRH_REQ_POSITION,
            LRH_REQ_MANAGER,
            LRH_REQ_MANAGER_NANE,
            LRH_REQ_STATUS,
            LRH_REQ_STATUS_DESC,
            LRH_FILENAME,
            LRH_FILESERVER,
            LRH_FILE_BL,
            LRH_FILE_URL,
            LRH_PROBLEM,
            LRH_DET_BEFORE,
            LRH_DET_AFTER,
            LRH_MH_OUTPUT,
            LRH_MH_FORECAST,
            LRH_MH_TSAVE,
            LRH_MC_WCODE,
            LRH_MC_WCOST,
            LRH_MC_TSAVE,
            LRH_EVALUATE_STS,
            LRH_EVALUATE_DATE,
            LRH_LEADER_RESULT,
            LRH_LEADER_APP_BY,
            LRH_LEADER_APP_NAME,
            LRH_LEADER_APP_DATE,
            LRH_LEADER_APP_FISCALYR,
            LRH_LEADER_COMMENT,
            LRH_SUMIT_TO_SG,
            LRH_SUMIT_TO_SG_BL,
            LRH_SG_TYPE,
            LRH_FILE_PATH,
            LRH_REQ_TYPE,
            LRH_SG_NO,
            LRH_LEADER_APP_MONTH,
            LRH_REQ_MONTH,
            LRH_SEND_DATE,
            LRH_REQ_TYPE_TEAM,
            SSH_SV_APP_BY,
            SSH_REQ_TYPE,
            SSH_TEAM_NAME,
            SSH_TEAM_BL,
            SSH_MEMBER_TEAM,
            LRH_SSH_FILE } = req.body;

        let LOCTno = '';
        let SGTno = '';
        let Subject = '';

        if (LRH_REQ_NO.trim() === '' || LRH_REQ_NO === null) {
            LOCTno = await getMaxLOCT(LRH_FACTORY, LRH_COST_CENTER)
        } else {
            LOCTno = LRH_REQ_NO
        }

        if (LRH_REQ_TYPE === '1' || LRH_REQ_TYPE === '3') {
            if (LRH_SG_NO.trim() === '' || LRH_SG_NO === null) {
                SGTno = await getMaxSGT(LRH_FACTORY_CODE, LRH_COST_CENTER)
            } else {
                SGTno = LRH_SG_NO
            }
        } else {
            SGTno = LRH_SG_NO
        }

        if (LRH_REQ_TYPE === '1') {
            Subject = '(SL)' + LRH_PROBLEM;
        } else if (LRH_REQ_TYPE === '2') {
            Subject = '(L)' + LRH_PROBLEM;
        } else if (LRH_REQ_TYPE === '3') {
            Subject = '(SI)' + LRH_PROBLEM;
        } else if (LRH_REQ_TYPE === '4') {
            Subject = '(I)' + LRH_PROBLEM;
        } else if (LRH_REQ_TYPE === '5') {
            Subject = '(S)' + LRH_PROBLEM;
        }
        connect = await ConnectOracleDB("HR");
        // await saveBase64ToFile(LRH_FILESERVER,LRH_SSH_FILE)
        let query = ``;
        if (LRH_REQ_TYPE === '1' || LRH_REQ_TYPE === '3') {
            query = ``;
            query += ` 	MERGE INTO HR.LOCT_REQUEST_HEADER T	`;
            query += ` 	USING (SELECT :1 AS LRH_REQ_NO,	`;
            query += ` 	              :2 AS LRH_FACTORY,	`;
            query += ` 	              :3 AS LRH_COST_CENTER,	`;
            query += ` 	              TO_DATE(:4, 'DD/MM/YYYY HH24:MI:SS') AS LRH_REQ_DATE,	`;
            query += ` 	              :5 AS LRH_REQ_EMP_TYPE,	`;
            query += ` 	              :6 AS LRH_REQ_BY,	`;
            query += ` 	              :7 AS LRH_REQ_NAME,	`;
            query += ` 	              :8 AS LRH_REQ_SURNAME,	`;
            query += ` 	              :9 AS LRH_REQ_PROCESS,	`;
            query += ` 	              :10 AS LRH_REQ_POSITION,	`;
            query += ` 	              :11 AS LRH_REQ_MANAGER,	`;
            query += ` 	              :12 AS LRH_REQ_STATUS,	`;
            query += ` 	              :13 AS LRH_FILENAME,	`;
            query += ` 	              :14 AS LRH_FILESERVER,	`;
            query += ` 	              :15 AS LRH_PROBLEM,	`;
            query += ` 	              :16 AS LRH_DET_BEFORE,	`;
            query += ` 	              :17 AS LRH_DET_AFTER,	`;
            query += ` 	              :18 AS LRH_MH_OUTPUT,	`;
            query += ` 	              :19 AS LRH_MH_FORECAST,	`;
            query += ` 	              :20 AS LRH_MH_TSAVE,	`;
            query += ` 	              :21 AS LRH_MC_WCODE,	`;
            query += ` 	              :22 AS LRH_MC_WCOST,	`;
            query += ` 	              :23 AS LRH_MC_TSAVE,	`;
            query += ` 	              :24 AS LRH_EVALUATE_STS,	`;
            query += ` 	              :25 AS LRH_EVALUATE_DATE,	`;
            query += ` 	              :26 AS LRH_LEADER_RESULT,	`;
            query += ` 	              :27 AS LRH_LEADER_APP_BY,	`;
            query += ` 	              :28 AS LRH_LEADER_APP_DATE,	`;
            query += ` 	              :29 AS LRH_LEADER_APP_FISCALYR,	`;
            query += ` 	              :30 AS LRH_LEADER_COMMENT,	`;
            query += ` 	              :31 AS LRH_SUMIT_TO_SG,	`;
            query += ` 	              :32 AS LRH_SG_TYPE,	`;
            query += ` 	              SYSDATE AS LRH_CREATE_DATE,	`;
            query += ` 	              :33 AS LRH_CREATE_BY,	`;
            query += ` 	              SYSDATE AS LRH_UPDATE_DATE,	`;
            query += ` 	              :34 AS LRH_UPDATE_BY,	`;
            query += ` 	              :35 AS LRH_FILE_PATH,	`;
            query += ` 	              :36 AS LRH_REQ_TYPE,	`;
            query += ` 	              :37 AS LRH_SG_NO,	`;
            query += ` 	              :38 AS LRH_LEADER_APP_MONTH,	`;
            query += ` 	              TO_CHAR(SYSDATE, 'MM_YYYY') AS LRH_REQ_MONTH,	`;
            query += ` 	              DECODE(:39, 'WT', SYSDATE, '') AS LRH_SEND_DATE,	`;
            query += ` 	              :40 AS LRH_REQ_TYPE_TEAM	`;
            query += ` 	         FROM DUAL) D	`;
            query += ` 	ON (T.LRH_REQ_NO = D.LRH_REQ_NO)	`;
            query += ` 	WHEN MATCHED THEN	`;
            query += ` 	  UPDATE	`;
            query += ` 	     SET T.LRH_FACTORY             = D.LRH_FACTORY,	`;
            query += ` 	         T.LRH_COST_CENTER         = D.LRH_COST_CENTER,	`;
            query += ` 	         T.LRH_REQ_EMP_TYPE        = D.LRH_REQ_EMP_TYPE,	`;
            query += ` 	         T.LRH_REQ_BY              = D.LRH_REQ_BY,	`;
            query += ` 	         T.LRH_REQ_NAME            = D.LRH_REQ_NAME,	`;
            query += ` 	         T.LRH_REQ_SURNAME         = D.LRH_REQ_SURNAME,	`;
            query += ` 	         T.LRH_REQ_PROCESS         = D.LRH_REQ_PROCESS,	`;
            query += ` 	         T.LRH_REQ_POSITION        = D.LRH_REQ_POSITION,	`;
            query += ` 	         T.LRH_REQ_MANAGER         = D.LRH_REQ_MANAGER,	`;
            query += ` 	         T.LRH_REQ_STATUS          = D.LRH_REQ_STATUS,	`;
            query += ` 	         T.LRH_FILENAME            = D.LRH_FILENAME,	`;
            query += ` 	         T.LRH_FILESERVER          = D.LRH_FILESERVER,	`;
            query += ` 	         T.LRH_PROBLEM             = D.LRH_PROBLEM,	`;
            query += ` 	         T.LRH_DET_BEFORE          = D.LRH_DET_BEFORE,	`;
            query += ` 	         T.LRH_DET_AFTER           = D.LRH_DET_AFTER,	`;
            query += ` 	         T.LRH_MH_OUTPUT           = D.LRH_MH_OUTPUT,	`;
            query += ` 	         T.LRH_MH_FORECAST         = D.LRH_MH_FORECAST,	`;
            query += ` 	         T.LRH_MH_TSAVE            = D.LRH_MH_TSAVE,	`;
            query += ` 	         T.LRH_MC_WCODE            = D.LRH_MC_WCODE,	`;
            query += ` 	         T.LRH_MC_WCOST            = D.LRH_MC_WCOST,	`;
            query += ` 	         T.LRH_MC_TSAVE            = D.LRH_MC_TSAVE,	`;
            query += ` 	         T.LRH_EVALUATE_STS        = D.LRH_EVALUATE_STS,	`;
            query += ` 	         T.LRH_EVALUATE_DATE       = D.LRH_EVALUATE_DATE,	`;
            query += ` 	         T.LRH_LEADER_RESULT       = D.LRH_LEADER_RESULT,	`;
            query += ` 	         T.LRH_LEADER_APP_BY       = D.LRH_LEADER_APP_BY,	`;
            query += ` 	         T.LRH_LEADER_APP_DATE     = D.LRH_LEADER_APP_DATE,	`;
            query += ` 	         T.LRH_LEADER_APP_FISCALYR = D.LRH_LEADER_APP_FISCALYR,	`;
            query += ` 	         T.LRH_LEADER_COMMENT      = D.LRH_LEADER_COMMENT,	`;
            query += ` 	         T.LRH_SUMIT_TO_SG         = D.LRH_SUMIT_TO_SG,	`;
            query += ` 	         T.LRH_SG_TYPE             = D.LRH_SG_TYPE,	`;
            query += ` 	         T.LRH_UPDATE_DATE         = D.LRH_UPDATE_DATE,	`;
            query += ` 	         T.LRH_UPDATE_BY           = D.LRH_UPDATE_BY,	`;
            query += ` 	         T.LRH_FILE_PATH           = D.LRH_FILE_PATH,	`;
            query += ` 	         T.LRH_REQ_TYPE            = D.LRH_REQ_TYPE,	`;
            query += ` 	         T.LRH_SG_NO               = D.LRH_SG_NO,	`;
            query += ` 	         T.LRH_LEADER_APP_MONTH    = D.LRH_LEADER_APP_MONTH,	`;
            query += ` 	         T.LRH_SEND_DATE           = D.LRH_SEND_DATE,	`;
            query += ` 	         T.LRH_REQ_TYPE_TEAM       = D.LRH_REQ_TYPE_TEAM	`;
            query += ` 	WHEN NOT MATCHED THEN	`;
            query += ` 	  INSERT	`;
            query += ` 	    (T.LRH_REQ_NO,	`;
            query += ` 	     T.LRH_FACTORY,	`;
            query += ` 	     T.LRH_COST_CENTER,	`;
            query += ` 	     T.LRH_REQ_DATE,	`;
            query += ` 	     T.LRH_REQ_EMP_TYPE,	`;
            query += ` 	     T.LRH_REQ_BY,	`;
            query += ` 	     T.LRH_REQ_NAME,	`;
            query += ` 	     T.LRH_REQ_SURNAME,	`;
            query += ` 	     T.LRH_REQ_PROCESS,	`;
            query += ` 	     T.LRH_REQ_POSITION,	`;
            query += ` 	     T.LRH_REQ_MANAGER,	`;
            query += ` 	     T.LRH_REQ_STATUS,	`;
            query += ` 	     T.LRH_FILENAME,	`;
            query += ` 	     T.LRH_FILESERVER,	`;
            query += ` 	     T.LRH_PROBLEM,	`;
            query += ` 	     T.LRH_DET_BEFORE,	`;
            query += ` 	     T.LRH_DET_AFTER,	`;
            query += ` 	     T.LRH_MH_OUTPUT,	`;
            query += ` 	     T.LRH_MH_FORECAST,	`;
            query += ` 	     T.LRH_MH_TSAVE,	`;
            query += ` 	     T.LRH_MC_WCODE,	`;
            query += ` 	     T.LRH_MC_WCOST,	`;
            query += ` 	     T.LRH_MC_TSAVE,	`;
            query += ` 	     T.LRH_EVALUATE_STS,	`;
            query += ` 	     T.LRH_EVALUATE_DATE,	`;
            query += ` 	     T.LRH_LEADER_RESULT,	`;
            query += ` 	     T.LRH_LEADER_APP_BY,	`;
            query += ` 	     T.LRH_LEADER_APP_DATE,	`;
            query += ` 	     T.LRH_LEADER_APP_FISCALYR,	`;
            query += ` 	     T.LRH_LEADER_COMMENT,	`;
            query += ` 	     T.LRH_SUMIT_TO_SG,	`;
            query += ` 	     T.LRH_SG_TYPE,	`;
            query += ` 	     T.LRH_CREATE_DATE,	`;
            query += ` 	     T.LRH_CREATE_BY,	`;
            query += ` 	     T.LRH_FILE_PATH,	`;
            query += ` 	     T.LRH_REQ_TYPE,	`;
            query += ` 	     T.LRH_SG_NO,	`;
            query += ` 	     T.LRH_LEADER_APP_MONTH,	`;
            query += ` 	     T.LRH_REQ_MONTH,	`;
            query += ` 	     T.LRH_SEND_DATE,	`;
            query += ` 	     T.LRH_REQ_TYPE_TEAM)	`;
            query += ` 	  VALUES	`;
            query += ` 	    (D.LRH_REQ_NO,	`;
            query += ` 	     D.LRH_FACTORY,	`;
            query += ` 	     D.LRH_COST_CENTER,	`;
            query += ` 	     D.LRH_REQ_DATE,	`;
            query += ` 	     D.LRH_REQ_EMP_TYPE,	`;
            query += ` 	     D.LRH_REQ_BY,	`;
            query += ` 	     D.LRH_REQ_NAME,	`;
            query += ` 	     D.LRH_REQ_SURNAME,	`;
            query += ` 	     D.LRH_REQ_PROCESS,	`;
            query += ` 	     D.LRH_REQ_POSITION,	`;
            query += ` 	     D.LRH_REQ_MANAGER,	`;
            query += ` 	     D.LRH_REQ_STATUS,	`;
            query += ` 	     D.LRH_FILENAME,	`;
            query += ` 	     D.LRH_FILESERVER,	`;
            query += ` 	     D.LRH_PROBLEM,	`;
            query += ` 	     D.LRH_DET_BEFORE,	`;
            query += ` 	     D.LRH_DET_AFTER,	`;
            query += ` 	     D.LRH_MH_OUTPUT,	`;
            query += ` 	     D.LRH_MH_FORECAST,	`;
            query += ` 	     D.LRH_MH_TSAVE,	`;
            query += ` 	     D.LRH_MC_WCODE,	`;
            query += ` 	     D.LRH_MC_WCOST,	`;
            query += ` 	     D.LRH_MC_TSAVE,	`;
            query += ` 	     D.LRH_EVALUATE_STS,	`;
            query += ` 	     D.LRH_EVALUATE_DATE,	`;
            query += ` 	     D.LRH_LEADER_RESULT,	`;
            query += ` 	     D.LRH_LEADER_APP_BY,	`;
            query += ` 	     D.LRH_LEADER_APP_DATE,	`;
            query += ` 	     D.LRH_LEADER_APP_FISCALYR,	`;
            query += ` 	     D.LRH_LEADER_COMMENT,	`;
            query += ` 	     D.LRH_SUMIT_TO_SG,	`;
            query += ` 	     D.LRH_SG_TYPE,	`;
            query += ` 	     D.LRH_CREATE_DATE,	`;
            query += ` 	     D.LRH_CREATE_BY,	`;
            query += ` 	     D.LRH_FILE_PATH,	`;
            query += ` 	     D.LRH_REQ_TYPE,	`;
            query += ` 	     D.LRH_SG_NO,	`;
            query += ` 	     D.LRH_LEADER_APP_MONTH,	`;
            query += ` 	     D.LRH_REQ_MONTH,	`;
            query += ` 	     D.LRH_SEND_DATE,	`;
            query += ` 	     D.LRH_REQ_TYPE_TEAM)	`;
            await connect.execute(query,
                [LOCTno,
                    LRH_FACTORY,
                    LRH_COST_CENTER,
                    LRH_REQ_DATE,
                    LRH_REQ_EMP_TYPE,
                    LRH_REQ_BY,
                    LRH_REQ_NAME,
                    LRH_REQ_SURNAME,
                    LRH_REQ_PROCESS,
                    LRH_REQ_POSITION,
                    LRH_REQ_MANAGER,
                    P_STATUS, //LRH_REQ_STATUS
                    LRH_FILENAME,
                    LRH_FILESERVER,
                    Subject,
                    LRH_DET_BEFORE,
                    LRH_DET_AFTER,
                    LRH_MH_OUTPUT,
                    LRH_MH_FORECAST,
                    LRH_MH_TSAVE,
                    LRH_MC_WCODE,
                    LRH_MC_WCOST,
                    LRH_MC_TSAVE,
                    LRH_EVALUATE_STS,
                    LRH_EVALUATE_DATE,
                    LRH_LEADER_RESULT,
                    LRH_LEADER_APP_BY,
                    LRH_LEADER_APP_DATE,
                    LRH_LEADER_APP_FISCALYR,
                    LRH_LEADER_COMMENT,
                    LRH_SUMIT_TO_SG,
                    LRH_SG_TYPE.value,
                    LRH_REQ_BY,
                    LRH_REQ_BY,
                    LRH_FILE_PATH,
                    LRH_REQ_TYPE,
                    SGTno,
                    LRH_LEADER_APP_MONTH,
                    P_STATUS,
                    LRH_REQ_TYPE_TEAM]);

            query = ``;
            query += ` DELETE HR.LOCT_SUGGESTION_TEAM T WHERE T.LST_REQ_NO = :1 `;
            await connect.execute(query, [LOCTno]);


            let calMHR = 0;
            if (SSH_MEMBER_TEAM.length > 0) {
                calMHR = LRH_MH_TSAVE / SSH_MEMBER_TEAM.length
            }

            for (const item of SSH_MEMBER_TEAM) {
                const { T_EMP_ID, T_EMP_JOBGRAD, T_EMP_CC } = item;
                query = ``;
                query += ` INSERT INTO HR.LOCT_SUGGESTION_TEAM T `;
                query += `   (T.LST_REQ_NO, `;
                query += `    T.LST_EMP_ID, `;
                query += `    T.LST_POS_GRADE, `;
                query += `    T.LST_COST_CENTER, `;
                query += `    T.LST_SAVE_MHR, `;
                query += `    T.LST_CREATE_DATE, `;
                query += `    T.LST_CREATE_BY, `;
                query += `    T.LST_UPDATE_DATE, `;
                query += `    T.LST_UPDATE_BY) `;
                query += ` VALUES `;
                query += `   (:1, :2, :3, :4, :5, SYSDATE, :6, SYSDATE, :7) `;
                await connect.execute(query, [LOCTno, T_EMP_ID, T_EMP_JOBGRAD, T_EMP_CC, calMHR, LRH_REQ_BY, LRH_REQ_BY]);
            }
            query = ``;
            query += ` 	MERGE INTO HR.SG_SUGGESTION_HEADER T	`;
            query += ` 	USING (SELECT :1 AS SSH_REQ_NO,	`;
            query += ` 	              :2 AS SSH_FACTORY,	`;
            query += ` 	              :3 AS SSH_COST_CENTER,	`;
            query += ` 	              :4 AS SSH_DEPT,	`;
            query += ` 	              :5 AS SSH_SECTION,	`;
            query += ` 	              SYSDATE AS SSH_REQ_DATE,	`;
            query += ` 	              :6 AS SSH_EMP_TYPE,	`;
            query += ` 	              :7 AS SSH_REQ_BY,	`;
            query += ` 	              :8 AS SSH_REQ_NAME,	`;
            query += ` 	              :9 AS SSH_REQ_SURNAME,	`;
            query += ` 	              :10 AS SSH_REQ_PROCESS,	`;
            query += ` 	              :11 AS SSH_REQ_POSITION,	`;
            query += ` 	              :12 AS SSH_REQ_MANAGER,	`;
            query += ` 	              :13 AS SSH_REQ_STATUS,	`;
            query += ` 	              :14 AS SSH_SUGGESTION_TYPE,	`;
            query += ` 	              :15 AS SSH_SUBJECT,	`;
            query += ` 	              :16 AS SSH_DET_BEFORE,	`;
            query += ` 	              :17 AS SSH_DET_SUGGESTION,	`;
            query += ` 	              SYSDATE AS SSH_CREATE_DATE,	`;
            query += ` 	              'SGT' AS SSH_CREATE_BY,	`;
            query += ` 	              SYSDATE AS SSH_UPDATE_DATE,	`;
            query += ` 	              'SGT' AS SSH_UPDATE_BY,	`;
            query += ` 	              :18 AS SSH_REQ_TYPE,	`;
            query += ` 	              :19 AS SSH_FILENAME,	`;
            query += ` 	              :20 AS SSH_MH_TSAVE,	`;
            query += ` 	              :21 AS SSH_MC_TSAVE,	`;
            query += ` 	              :22 AS SSH_FILESERVER,	`;
            query += ` 	              :23 AS SSH_TEAM,	`;
            query += ` 	              :24 AS SSH_SV_APP_BY	`;
            query += ` 	         FROM DUAL) D	`;
            query += ` 	ON (T.SSH_REQ_NO = D.SSH_REQ_NO)	`;
            query += ` 	WHEN MATCHED THEN	`;
            query += ` 	  UPDATE	`;
            query += ` 	     SET T.SSH_FACTORY         = D.SSH_FACTORY,	`;
            query += ` 	         T.SSH_COST_CENTER     = D.SSH_COST_CENTER,	`;
            query += ` 	         T.SSH_DEPT            = D.SSH_DEPT,	`;
            query += ` 	         T.SSH_SECTION         = D.SSH_SECTION,	`;
            query += ` 	         T.SSH_EMP_TYPE        = D.SSH_EMP_TYPE,	`;
            query += ` 	         T.SSH_REQ_BY          = D.SSH_REQ_BY,	`;
            query += ` 	         T.SSH_REQ_NAME        = D.SSH_REQ_NAME,	`;
            query += ` 	         T.SSH_REQ_SURNAME     = D.SSH_REQ_SURNAME,	`;
            query += ` 	         T.SSH_REQ_PROCESS     = D.SSH_REQ_PROCESS,	`;
            query += ` 	         T.SSH_REQ_POSITION    = D.SSH_REQ_POSITION,	`;
            query += ` 	         T.SSH_REQ_MANAGER     = D.SSH_REQ_MANAGER,	`;
            query += ` 	         T.SSH_REQ_STATUS      = D.SSH_REQ_STATUS,	`;
            query += ` 	         T.SSH_SUGGESTION_TYPE = D.SSH_SUGGESTION_TYPE,	`;
            query += ` 	         T.SSH_SUBJECT         = D.SSH_SUBJECT,	`;
            query += ` 	         T.SSH_DET_BEFORE      = D.SSH_DET_BEFORE,	`;
            query += ` 	         T.SSH_DET_SUGGESTION  = D.SSH_DET_SUGGESTION,	`;
            query += ` 	         T.SSH_UPDATE_DATE     = D.SSH_UPDATE_DATE,	`;
            query += ` 	         T.SSH_UPDATE_BY       = D.SSH_UPDATE_BY,	`;
            query += ` 	         T.SSH_REQ_TYPE        = D.SSH_REQ_TYPE,	`;
            query += ` 	         T.SSH_FILENAME        = D.SSH_FILENAME,	`;
            query += ` 	         T.SSH_MH_TSAVE        = D.SSH_MH_TSAVE,	`;
            query += ` 	         T.SSH_MC_TSAVE        = D.SSH_MC_TSAVE,	`;
            query += ` 	         T.SSH_FILESERVER      = D.SSH_FILESERVER,	`;
            query += ` 	         T.SSH_TEAM            = D.SSH_TEAM,	`;
            query += ` 	         T.SSH_SV_APP_BY       = D.SSH_SV_APP_BY	`;
            query += ` 	WHEN NOT MATCHED THEN	`;
            query += ` 	  INSERT	`;
            query += ` 	    (T.SSH_REQ_NO,	`;
            query += ` 	     T.SSH_FACTORY,	`;
            query += ` 	     T.SSH_COST_CENTER,	`;
            query += ` 	     T.SSH_DEPT,	`;
            query += ` 	     T.SSH_SECTION,	`;
            query += ` 	     T.SSH_REQ_DATE,	`;
            query += ` 	     T.SSH_EMP_TYPE,	`;
            query += ` 	     T.SSH_REQ_BY,	`;
            query += ` 	     T.SSH_REQ_NAME,	`;
            query += ` 	     T.SSH_REQ_SURNAME,	`;
            query += ` 	     T.SSH_REQ_PROCESS,	`;
            query += ` 	     T.SSH_REQ_POSITION,	`;
            query += ` 	     T.SSH_REQ_MANAGER,	`;
            query += ` 	     T.SSH_REQ_STATUS,	`;
            query += ` 	     T.SSH_SUGGESTION_TYPE,	`;
            query += ` 	     T.SSH_SUBJECT,	`;
            query += ` 	     T.SSH_DET_BEFORE,	`;
            query += ` 	     T.SSH_DET_SUGGESTION,	`;
            query += ` 	     T.SSH_CREATE_DATE,	`;
            query += ` 	     T.SSH_CREATE_BY,	`;
            query += ` 	     T.SSH_UPDATE_DATE,	`;
            query += ` 	     T.SSH_UPDATE_BY,	`;
            query += ` 	     T.SSH_REQ_TYPE,	`;
            query += ` 	     T.SSH_FILENAME,	`;
            query += ` 	     T.SSH_MH_TSAVE,	`;
            query += ` 	     T.SSH_MC_TSAVE,	`;
            query += ` 	     T.SSH_FILESERVER,	`;
            query += ` 	     T.SSH_TEAM,	`;
            query += ` 	     T.SSH_SV_APP_BY)	`;
            query += ` 	  VALUES	`;
            query += ` 	    (D.SSH_REQ_NO,	`;
            query += ` 	     D.SSH_FACTORY,	`;
            query += ` 	     D.SSH_COST_CENTER,	`;
            query += ` 	     D.SSH_DEPT,	`;
            query += ` 	     D.SSH_SECTION,	`;
            query += ` 	     D.SSH_REQ_DATE,	`;
            query += ` 	     D.SSH_EMP_TYPE,	`;
            query += ` 	     D.SSH_REQ_BY,	`;
            query += ` 	     D.SSH_REQ_NAME,	`;
            query += ` 	     D.SSH_REQ_SURNAME,	`;
            query += ` 	     D.SSH_REQ_PROCESS,	`;
            query += ` 	     D.SSH_REQ_POSITION,	`;
            query += ` 	     D.SSH_REQ_MANAGER,	`;
            query += ` 	     D.SSH_REQ_STATUS,	`;
            query += ` 	     D.SSH_SUGGESTION_TYPE,	`;
            query += ` 	     D.SSH_SUBJECT,	`;
            query += ` 	     D.SSH_DET_BEFORE,	`;
            query += ` 	     D.SSH_DET_SUGGESTION,	`;
            query += ` 	     D.SSH_CREATE_DATE,	`;
            query += ` 	     D.SSH_CREATE_BY,	`;
            query += ` 	     D.SSH_UPDATE_DATE,	`;
            query += ` 	     D.SSH_UPDATE_BY,	`;
            query += ` 	     D.SSH_REQ_TYPE,	`;
            query += ` 	     D.SSH_FILENAME,	`;
            query += ` 	     D.SSH_MH_TSAVE,	`;
            query += ` 	     D.SSH_MC_TSAVE,	`;
            query += ` 	     D.SSH_FILESERVER,	`;
            query += ` 	     D.SSH_TEAM,	`;
            query += ` 	     D.SSH_SV_APP_BY)	`;
            await connect.execute(query, [
                SGTno,
                LRH_FACTORY_CODE,
                LRH_COST_CENTER,
                '',
                '',
                LRH_REQ_EMP_TYPE,
                LRH_REQ_BY,
                LRH_REQ_NAME,
                LRH_REQ_SURNAME,
                LRH_REQ_PROCESS,
                LRH_REQ_POSITION,
                LRH_REQ_MANAGER,
                P_STATUS_SG, //LRH_REQ_STATUS
                LRH_SG_TYPE.value,
                Subject,
                LRH_DET_BEFORE,
                LRH_DET_AFTER,
                SSH_REQ_TYPE,
                LRH_FILENAME,
                LRH_MH_TSAVE,
                LRH_MC_TSAVE,
                LRH_FILESERVER,
                SSH_TEAM_NAME,
                SSH_SV_APP_BY.value
            ]);

            query = ``;
            query += ` DELETE HR.SG_SUGGESTION_TEAM T WHERE T.SST_REQ_NO = :1 `;
            await connect.execute(query, [SGTno]);

            for (const item of SSH_MEMBER_TEAM) {
                const { T_EMP_ID, T_EMP_JOBGRAD, T_EMP_CC } = item;
                query = ``;
                query += ` INSERT INTO HR.SG_SUGGESTION_TEAM T `;
                query += `   (T.SST_REQ_NO, `;
                query += `    T.SST_EMP_ID, `;
                query += `    T.SST_POS_GRADE, `;
                query += `    T.SST_COST_CENTER, `;
                query += `    T.SST_SAVE_MHR, `;
                query += `    T.SST_CREATE_DATE, `;
                query += `    T.SST_CREATE_BY, `;
                query += `    T.SST_UPDATE_DATE, `;
                query += `    T.SST_UPDATE_BY) `;
                query += ` VALUES `;
                query += `   (:1, :2, :3, :4, :5, SYSDATE, :6, SYSDATE, :7) `;
                await connect.execute(query, [SGTno, T_EMP_ID, T_EMP_JOBGRAD, T_EMP_CC, calMHR, LRH_REQ_BY, LRH_REQ_BY]);
            }

            if (LRH_SSH_FILE !== '') {
                await uploadFileFTP(LRH_FILESERVER, LRH_SSH_FILE)
            }

        } else if (LRH_REQ_TYPE === '2' || LRH_REQ_TYPE === '4') {
            query = ``;
            query += ` DELETE HR.LOCT_SUGGESTION_TEAM T WHERE T.LST_REQ_NO = :1 `;
            await connect.execute(query, [LOCTno]);

            query = ``;
            query += ` DELETE HR.SG_SUGGESTION_TEAM T WHERE T.SST_REQ_NO = :1 `;
            await connect.execute(query, [SGTno]);

            SGTno = ``;
            query = ``;
            query += ` 	MERGE INTO HR.LOCT_REQUEST_HEADER T	`;
            query += ` 	USING (SELECT :1 AS LRH_REQ_NO,	`;
            query += ` 	              :2 AS LRH_FACTORY,	`;
            query += ` 	              :3 AS LRH_COST_CENTER,	`;
            query += ` 	              TO_DATE(:4, 'DD/MM/YYYY HH24:MI:SS') AS LRH_REQ_DATE,	`;
            query += ` 	              :5 AS LRH_REQ_EMP_TYPE,	`;
            query += ` 	              :6 AS LRH_REQ_BY,	`;
            query += ` 	              :7 AS LRH_REQ_NAME,	`;
            query += ` 	              :8 AS LRH_REQ_SURNAME,	`;
            query += ` 	              :9 AS LRH_REQ_PROCESS,	`;
            query += ` 	              :10 AS LRH_REQ_POSITION,	`;
            query += ` 	              :11 AS LRH_REQ_MANAGER,	`;
            query += ` 	              :12 AS LRH_REQ_STATUS,	`;
            query += ` 	              :13 AS LRH_FILENAME,	`;
            query += ` 	              :14 AS LRH_FILESERVER,	`;
            query += ` 	              :15 AS LRH_PROBLEM,	`;
            query += ` 	              :16 AS LRH_DET_BEFORE,	`;
            query += ` 	              :17 AS LRH_DET_AFTER,	`;
            query += ` 	              :18 AS LRH_MH_OUTPUT,	`;
            query += ` 	              :19 AS LRH_MH_FORECAST,	`;
            query += ` 	              :20 AS LRH_MH_TSAVE,	`;
            query += ` 	              :21 AS LRH_MC_WCODE,	`;
            query += ` 	              :22 AS LRH_MC_WCOST,	`;
            query += ` 	              :23 AS LRH_MC_TSAVE,	`;
            query += ` 	              :24 AS LRH_EVALUATE_STS,	`;
            query += ` 	              :25 AS LRH_EVALUATE_DATE,	`;
            query += ` 	              :26 AS LRH_LEADER_RESULT,	`;
            query += ` 	              :27 AS LRH_LEADER_APP_BY,	`;
            query += ` 	              :28 AS LRH_LEADER_APP_DATE,	`;
            query += ` 	              :29 AS LRH_LEADER_APP_FISCALYR,	`;
            query += ` 	              :30 AS LRH_LEADER_COMMENT,	`;
            query += ` 	              :31 AS LRH_SUMIT_TO_SG,	`;
            query += ` 	              :32 AS LRH_SG_TYPE,	`;
            query += ` 	              SYSDATE AS LRH_CREATE_DATE,	`;
            query += ` 	              :33 AS LRH_CREATE_BY,	`;
            query += ` 	              SYSDATE AS LRH_UPDATE_DATE,	`;
            query += ` 	              :34 AS LRH_UPDATE_BY,	`;
            query += ` 	              :35 AS LRH_FILE_PATH,	`;
            query += ` 	              :36 AS LRH_REQ_TYPE,	`;
            query += ` 	              :37 AS LRH_SG_NO,	`;
            query += ` 	              :38 AS LRH_LEADER_APP_MONTH,	`;
            query += ` 	              TO_CHAR(SYSDATE, 'MM_YYYY') AS LRH_REQ_MONTH,	`;
            query += ` 	              DECODE(:39, 'WT', SYSDATE, '') AS LRH_SEND_DATE,	`;
            query += ` 	              :40 AS LRH_REQ_TYPE_TEAM	`;
            query += ` 	         FROM DUAL) D	`;
            query += ` 	ON (T.LRH_REQ_NO = D.LRH_REQ_NO)	`;
            query += ` 	WHEN MATCHED THEN	`;
            query += ` 	  UPDATE	`;
            query += ` 	     SET T.LRH_FACTORY             = D.LRH_FACTORY,	`;
            query += ` 	         T.LRH_COST_CENTER         = D.LRH_COST_CENTER,	`;
            query += ` 	         T.LRH_REQ_EMP_TYPE        = D.LRH_REQ_EMP_TYPE,	`;
            query += ` 	         T.LRH_REQ_BY              = D.LRH_REQ_BY,	`;
            query += ` 	         T.LRH_REQ_NAME            = D.LRH_REQ_NAME,	`;
            query += ` 	         T.LRH_REQ_SURNAME         = D.LRH_REQ_SURNAME,	`;
            query += ` 	         T.LRH_REQ_PROCESS         = D.LRH_REQ_PROCESS,	`;
            query += ` 	         T.LRH_REQ_POSITION        = D.LRH_REQ_POSITION,	`;
            query += ` 	         T.LRH_REQ_MANAGER         = D.LRH_REQ_MANAGER,	`;
            query += ` 	         T.LRH_REQ_STATUS          = D.LRH_REQ_STATUS,	`;
            query += ` 	         T.LRH_FILENAME            = D.LRH_FILENAME,	`;
            query += ` 	         T.LRH_FILESERVER          = D.LRH_FILESERVER,	`;
            query += ` 	         T.LRH_PROBLEM             = D.LRH_PROBLEM,	`;
            query += ` 	         T.LRH_DET_BEFORE          = D.LRH_DET_BEFORE,	`;
            query += ` 	         T.LRH_DET_AFTER           = D.LRH_DET_AFTER,	`;
            query += ` 	         T.LRH_MH_OUTPUT           = D.LRH_MH_OUTPUT,	`;
            query += ` 	         T.LRH_MH_FORECAST         = D.LRH_MH_FORECAST,	`;
            query += ` 	         T.LRH_MH_TSAVE            = D.LRH_MH_TSAVE,	`;
            query += ` 	         T.LRH_MC_WCODE            = D.LRH_MC_WCODE,	`;
            query += ` 	         T.LRH_MC_WCOST            = D.LRH_MC_WCOST,	`;
            query += ` 	         T.LRH_MC_TSAVE            = D.LRH_MC_TSAVE,	`;
            query += ` 	         T.LRH_EVALUATE_STS        = D.LRH_EVALUATE_STS,	`;
            query += ` 	         T.LRH_EVALUATE_DATE       = D.LRH_EVALUATE_DATE,	`;
            query += ` 	         T.LRH_LEADER_RESULT       = D.LRH_LEADER_RESULT,	`;
            query += ` 	         T.LRH_LEADER_APP_BY       = D.LRH_LEADER_APP_BY,	`;
            query += ` 	         T.LRH_LEADER_APP_DATE     = D.LRH_LEADER_APP_DATE,	`;
            query += ` 	         T.LRH_LEADER_APP_FISCALYR = D.LRH_LEADER_APP_FISCALYR,	`;
            query += ` 	         T.LRH_LEADER_COMMENT      = D.LRH_LEADER_COMMENT,	`;
            query += ` 	         T.LRH_SUMIT_TO_SG         = D.LRH_SUMIT_TO_SG,	`;
            query += ` 	         T.LRH_SG_TYPE             = D.LRH_SG_TYPE,	`;
            query += ` 	         T.LRH_UPDATE_DATE         = D.LRH_UPDATE_DATE,	`;
            query += ` 	         T.LRH_UPDATE_BY           = D.LRH_UPDATE_BY,	`;
            query += ` 	         T.LRH_FILE_PATH           = D.LRH_FILE_PATH,	`;
            query += ` 	         T.LRH_REQ_TYPE            = D.LRH_REQ_TYPE,	`;
            query += ` 	         T.LRH_SG_NO               = D.LRH_SG_NO,	`;
            query += ` 	         T.LRH_LEADER_APP_MONTH    = D.LRH_LEADER_APP_MONTH,	`;
            query += ` 	         T.LRH_SEND_DATE           = D.LRH_SEND_DATE,	`;
            query += ` 	         T.LRH_REQ_TYPE_TEAM       = D.LRH_REQ_TYPE_TEAM	`;
            query += ` 	WHEN NOT MATCHED THEN	`;
            query += ` 	  INSERT	`;
            query += ` 	    (T.LRH_REQ_NO,	`;
            query += ` 	     T.LRH_FACTORY,	`;
            query += ` 	     T.LRH_COST_CENTER,	`;
            query += ` 	     T.LRH_REQ_DATE,	`;
            query += ` 	     T.LRH_REQ_EMP_TYPE,	`;
            query += ` 	     T.LRH_REQ_BY,	`;
            query += ` 	     T.LRH_REQ_NAME,	`;
            query += ` 	     T.LRH_REQ_SURNAME,	`;
            query += ` 	     T.LRH_REQ_PROCESS,	`;
            query += ` 	     T.LRH_REQ_POSITION,	`;
            query += ` 	     T.LRH_REQ_MANAGER,	`;
            query += ` 	     T.LRH_REQ_STATUS,	`;
            query += ` 	     T.LRH_FILENAME,	`;
            query += ` 	     T.LRH_FILESERVER,	`;
            query += ` 	     T.LRH_PROBLEM,	`;
            query += ` 	     T.LRH_DET_BEFORE,	`;
            query += ` 	     T.LRH_DET_AFTER,	`;
            query += ` 	     T.LRH_MH_OUTPUT,	`;
            query += ` 	     T.LRH_MH_FORECAST,	`;
            query += ` 	     T.LRH_MH_TSAVE,	`;
            query += ` 	     T.LRH_MC_WCODE,	`;
            query += ` 	     T.LRH_MC_WCOST,	`;
            query += ` 	     T.LRH_MC_TSAVE,	`;
            query += ` 	     T.LRH_EVALUATE_STS,	`;
            query += ` 	     T.LRH_EVALUATE_DATE,	`;
            query += ` 	     T.LRH_LEADER_RESULT,	`;
            query += ` 	     T.LRH_LEADER_APP_BY,	`;
            query += ` 	     T.LRH_LEADER_APP_DATE,	`;
            query += ` 	     T.LRH_LEADER_APP_FISCALYR,	`;
            query += ` 	     T.LRH_LEADER_COMMENT,	`;
            query += ` 	     T.LRH_SUMIT_TO_SG,	`;
            query += ` 	     T.LRH_SG_TYPE,	`;
            query += ` 	     T.LRH_CREATE_DATE,	`;
            query += ` 	     T.LRH_CREATE_BY,	`;
            query += ` 	     T.LRH_FILE_PATH,	`;
            query += ` 	     T.LRH_REQ_TYPE,	`;
            query += ` 	     T.LRH_SG_NO,	`;
            query += ` 	     T.LRH_LEADER_APP_MONTH,	`;
            query += ` 	     T.LRH_REQ_MONTH,	`;
            query += ` 	     T.LRH_SEND_DATE,	`;
            query += ` 	     T.LRH_REQ_TYPE_TEAM)	`;
            query += ` 	  VALUES	`;
            query += ` 	    (D.LRH_REQ_NO,	`;
            query += ` 	     D.LRH_FACTORY,	`;
            query += ` 	     D.LRH_COST_CENTER,	`;
            query += ` 	     D.LRH_REQ_DATE,	`;
            query += ` 	     D.LRH_REQ_EMP_TYPE,	`;
            query += ` 	     D.LRH_REQ_BY,	`;
            query += ` 	     D.LRH_REQ_NAME,	`;
            query += ` 	     D.LRH_REQ_SURNAME,	`;
            query += ` 	     D.LRH_REQ_PROCESS,	`;
            query += ` 	     D.LRH_REQ_POSITION,	`;
            query += ` 	     D.LRH_REQ_MANAGER,	`;
            query += ` 	     D.LRH_REQ_STATUS,	`;
            query += ` 	     D.LRH_FILENAME,	`;
            query += ` 	     D.LRH_FILESERVER,	`;
            query += ` 	     D.LRH_PROBLEM,	`;
            query += ` 	     D.LRH_DET_BEFORE,	`;
            query += ` 	     D.LRH_DET_AFTER,	`;
            query += ` 	     D.LRH_MH_OUTPUT,	`;
            query += ` 	     D.LRH_MH_FORECAST,	`;
            query += ` 	     D.LRH_MH_TSAVE,	`;
            query += ` 	     D.LRH_MC_WCODE,	`;
            query += ` 	     D.LRH_MC_WCOST,	`;
            query += ` 	     D.LRH_MC_TSAVE,	`;
            query += ` 	     D.LRH_EVALUATE_STS,	`;
            query += ` 	     D.LRH_EVALUATE_DATE,	`;
            query += ` 	     D.LRH_LEADER_RESULT,	`;
            query += ` 	     D.LRH_LEADER_APP_BY,	`;
            query += ` 	     D.LRH_LEADER_APP_DATE,	`;
            query += ` 	     D.LRH_LEADER_APP_FISCALYR,	`;
            query += ` 	     D.LRH_LEADER_COMMENT,	`;
            query += ` 	     D.LRH_SUMIT_TO_SG,	`;
            query += ` 	     D.LRH_SG_TYPE,	`;
            query += ` 	     D.LRH_CREATE_DATE,	`;
            query += ` 	     D.LRH_CREATE_BY,	`;
            query += ` 	     D.LRH_FILE_PATH,	`;
            query += ` 	     D.LRH_REQ_TYPE,	`;
            query += ` 	     D.LRH_SG_NO,	`;
            query += ` 	     D.LRH_LEADER_APP_MONTH,	`;
            query += ` 	     D.LRH_REQ_MONTH,	`;
            query += ` 	     D.LRH_SEND_DATE,	`;
            query += ` 	     D.LRH_REQ_TYPE_TEAM)	`;
            await connect.execute(query,
                [LOCTno,
                    LRH_FACTORY,
                    LRH_COST_CENTER,
                    LRH_REQ_DATE,
                    LRH_REQ_EMP_TYPE,
                    LRH_REQ_BY,
                    LRH_REQ_NAME,
                    LRH_REQ_SURNAME,
                    LRH_REQ_PROCESS,
                    LRH_REQ_POSITION,
                    LRH_REQ_MANAGER,
                    P_STATUS,
                    LRH_FILENAME,
                    LRH_FILESERVER,
                    Subject,
                    LRH_DET_BEFORE,
                    LRH_DET_AFTER,
                    LRH_MH_OUTPUT,
                    LRH_MH_FORECAST,
                    LRH_MH_TSAVE,
                    LRH_MC_WCODE,
                    LRH_MC_WCOST,
                    LRH_MC_TSAVE,
                    LRH_EVALUATE_STS,
                    LRH_EVALUATE_DATE,
                    LRH_LEADER_RESULT,
                    LRH_LEADER_APP_BY,
                    LRH_LEADER_APP_DATE,
                    LRH_LEADER_APP_FISCALYR,
                    LRH_LEADER_COMMENT,
                    LRH_SUMIT_TO_SG,
                    LRH_SG_TYPE.value,
                    LRH_REQ_BY,
                    LRH_REQ_BY,
                    LRH_FILE_PATH,
                    LRH_REQ_TYPE,
                    SGTno,
                    LRH_LEADER_APP_MONTH,
                    P_STATUS,
                    LRH_REQ_TYPE_TEAM]);

            if (LRH_SSH_FILE !== '') {
                await saveBase64ToFile(LRH_FILESERVER, LRH_SSH_FILE)
            }


        } else if (LRH_REQ_TYPE === '5') {
            query = ``;
            query += ` 	MERGE INTO HR.SG_SUGGESTION_HEADER T	`;
            query += ` 	USING (SELECT :1 AS SSH_REQ_NO,	`;
            query += ` 	              :2 AS SSH_FACTORY,	`;
            query += ` 	              :3 AS SSH_COST_CENTER,	`;
            query += ` 	              :4 AS SSH_DEPT,	`;
            query += ` 	              :5 AS SSH_SECTION,	`;
            query += ` 	              SYSDATE AS SSH_REQ_DATE,	`;
            query += ` 	              :6 AS SSH_EMP_TYPE,	`;
            query += ` 	              :7 AS SSH_REQ_BY,	`;
            query += ` 	              :8 AS SSH_REQ_NAME,	`;
            query += ` 	              :9 AS SSH_REQ_SURNAME,	`;
            query += ` 	              :10 AS SSH_REQ_PROCESS,	`;
            query += ` 	              :11 AS SSH_REQ_POSITION,	`;
            query += ` 	              :12 AS SSH_REQ_MANAGER,	`;
            query += ` 	              :13 AS SSH_REQ_STATUS,	`;
            query += ` 	              :14 AS SSH_SUGGESTION_TYPE,	`;
            query += ` 	              :15 AS SSH_SUBJECT,	`;
            query += ` 	              :16 AS SSH_DET_BEFORE,	`;
            query += ` 	              :17 AS SSH_DET_SUGGESTION,	`;
            query += ` 	              SYSDATE AS SSH_CREATE_DATE,	`;
            query += ` 	              'SGT' AS SSH_CREATE_BY,	`;
            query += ` 	              SYSDATE AS SSH_UPDATE_DATE,	`;
            query += ` 	              'SGT' AS SSH_UPDATE_BY,	`;
            query += ` 	              :18 AS SSH_REQ_TYPE,	`;
            query += ` 	              :19 AS SSH_FILENAME,	`;
            query += ` 	              :20 AS SSH_MH_TSAVE,	`;
            query += ` 	              :21 AS SSH_MC_TSAVE,	`;
            query += ` 	              :22 AS SSH_FILESERVER,	`;
            query += ` 	              :23 AS SSH_TEAM,	`;
            query += ` 	              :24 AS SSH_SV_APP_BY	`;
            query += ` 	         FROM DUAL) D	`;
            query += ` 	ON (T.SSH_REQ_NO = D.SSH_REQ_NO)	`;
            query += ` 	WHEN MATCHED THEN	`;
            query += ` 	  UPDATE	`;
            query += ` 	     SET T.SSH_FACTORY         = D.SSH_FACTORY,	`;
            query += ` 	         T.SSH_COST_CENTER     = D.SSH_COST_CENTER,	`;
            query += ` 	         T.SSH_DEPT            = D.SSH_DEPT,	`;
            query += ` 	         T.SSH_SECTION         = D.SSH_SECTION,	`;
            query += ` 	         T.SSH_EMP_TYPE        = D.SSH_EMP_TYPE,	`;
            query += ` 	         T.SSH_REQ_BY          = D.SSH_REQ_BY,	`;
            query += ` 	         T.SSH_REQ_NAME        = D.SSH_REQ_NAME,	`;
            query += ` 	         T.SSH_REQ_SURNAME     = D.SSH_REQ_SURNAME,	`;
            query += ` 	         T.SSH_REQ_PROCESS     = D.SSH_REQ_PROCESS,	`;
            query += ` 	         T.SSH_REQ_POSITION    = D.SSH_REQ_POSITION,	`;
            query += ` 	         T.SSH_REQ_MANAGER     = D.SSH_REQ_MANAGER,	`;
            query += ` 	         T.SSH_REQ_STATUS      = D.SSH_REQ_STATUS,	`;
            query += ` 	         T.SSH_SUGGESTION_TYPE = D.SSH_SUGGESTION_TYPE,	`;
            query += ` 	         T.SSH_SUBJECT         = D.SSH_SUBJECT,	`;
            query += ` 	         T.SSH_DET_BEFORE      = D.SSH_DET_BEFORE,	`;
            query += ` 	         T.SSH_DET_SUGGESTION  = D.SSH_DET_SUGGESTION,	`;
            query += ` 	         T.SSH_UPDATE_DATE     = D.SSH_UPDATE_DATE,	`;
            query += ` 	         T.SSH_UPDATE_BY       = D.SSH_UPDATE_BY,	`;
            query += ` 	         T.SSH_REQ_TYPE        = D.SSH_REQ_TYPE,	`;
            query += ` 	         T.SSH_FILENAME        = D.SSH_FILENAME,	`;
            query += ` 	         T.SSH_MH_TSAVE        = D.SSH_MH_TSAVE,	`;
            query += ` 	         T.SSH_MC_TSAVE        = D.SSH_MC_TSAVE,	`;
            query += ` 	         T.SSH_FILESERVER      = D.SSH_FILESERVER,	`;
            query += ` 	         T.SSH_TEAM            = D.SSH_TEAM,	`;
            query += ` 	         T.SSH_SV_APP_BY       = D.SSH_SV_APP_BY	`;
            query += ` 	WHEN NOT MATCHED THEN	`;
            query += ` 	  INSERT	`;
            query += ` 	    (T.SSH_REQ_NO,	`;
            query += ` 	     T.SSH_FACTORY,	`;
            query += ` 	     T.SSH_COST_CENTER,	`;
            query += ` 	     T.SSH_DEPT,	`;
            query += ` 	     T.SSH_SECTION,	`;
            query += ` 	     T.SSH_REQ_DATE,	`;
            query += ` 	     T.SSH_EMP_TYPE,	`;
            query += ` 	     T.SSH_REQ_BY,	`;
            query += ` 	     T.SSH_REQ_NAME,	`;
            query += ` 	     T.SSH_REQ_SURNAME,	`;
            query += ` 	     T.SSH_REQ_PROCESS,	`;
            query += ` 	     T.SSH_REQ_POSITION,	`;
            query += ` 	     T.SSH_REQ_MANAGER,	`;
            query += ` 	     T.SSH_REQ_STATUS,	`;
            query += ` 	     T.SSH_SUGGESTION_TYPE,	`;
            query += ` 	     T.SSH_SUBJECT,	`;
            query += ` 	     T.SSH_DET_BEFORE,	`;
            query += ` 	     T.SSH_DET_SUGGESTION,	`;
            query += ` 	     T.SSH_CREATE_DATE,	`;
            query += ` 	     T.SSH_CREATE_BY,	`;
            query += ` 	     T.SSH_UPDATE_DATE,	`;
            query += ` 	     T.SSH_UPDATE_BY,	`;
            query += ` 	     T.SSH_REQ_TYPE,	`;
            query += ` 	     T.SSH_FILENAME,	`;
            query += ` 	     T.SSH_MH_TSAVE,	`;
            query += ` 	     T.SSH_MC_TSAVE,	`;
            query += ` 	     T.SSH_FILESERVER,	`;
            query += ` 	     T.SSH_TEAM,	`;
            query += ` 	     T.SSH_SV_APP_BY)	`;
            query += ` 	  VALUES	`;
            query += ` 	    (D.SSH_REQ_NO,	`;
            query += ` 	     D.SSH_FACTORY,	`;
            query += ` 	     D.SSH_COST_CENTER,	`;
            query += ` 	     D.SSH_DEPT,	`;
            query += ` 	     D.SSH_SECTION,	`;
            query += ` 	     D.SSH_REQ_DATE,	`;
            query += ` 	     D.SSH_EMP_TYPE,	`;
            query += ` 	     D.SSH_REQ_BY,	`;
            query += ` 	     D.SSH_REQ_NAME,	`;
            query += ` 	     D.SSH_REQ_SURNAME,	`;
            query += ` 	     D.SSH_REQ_PROCESS,	`;
            query += ` 	     D.SSH_REQ_POSITION,	`;
            query += ` 	     D.SSH_REQ_MANAGER,	`;
            query += ` 	     D.SSH_REQ_STATUS,	`;
            query += ` 	     D.SSH_SUGGESTION_TYPE,	`;
            query += ` 	     D.SSH_SUBJECT,	`;
            query += ` 	     D.SSH_DET_BEFORE,	`;
            query += ` 	     D.SSH_DET_SUGGESTION,	`;
            query += ` 	     D.SSH_CREATE_DATE,	`;
            query += ` 	     D.SSH_CREATE_BY,	`;
            query += ` 	     D.SSH_UPDATE_DATE,	`;
            query += ` 	     D.SSH_UPDATE_BY,	`;
            query += ` 	     D.SSH_REQ_TYPE,	`;
            query += ` 	     D.SSH_FILENAME,	`;
            query += ` 	     D.SSH_MH_TSAVE,	`;
            query += ` 	     D.SSH_MC_TSAVE,	`;
            query += ` 	     D.SSH_FILESERVER,	`;
            query += ` 	     D.SSH_TEAM,	`;
            query += ` 	     D.SSH_SV_APP_BY)	`;
            await connect.execute(query, [
                SGTno,
                LRH_FACTORY_CODE,
                LRH_COST_CENTER,
                '',
                '',
                LRH_REQ_EMP_TYPE,
                LRH_REQ_BY,
                LRH_REQ_NAME,
                LRH_REQ_SURNAME,
                LRH_REQ_PROCESS,
                LRH_REQ_POSITION,
                LRH_REQ_MANAGER,
                P_STATUS_SG, //LRH_REQ_STATUS
                LRH_SG_TYPE.value,
                Subject,
                LRH_DET_BEFORE,
                LRH_DET_AFTER,
                SSH_REQ_TYPE,
                LRH_FILENAME,
                LRH_MH_TSAVE,
                LRH_MC_TSAVE,
                LRH_FILESERVER,
                SSH_TEAM_NAME,
                SSH_SV_APP_BY.value
            ]);

            query = ``;
            query += ` DELETE HR.SG_SUGGESTION_TEAM T WHERE T.SST_REQ_NO = :1 `;
            await connect.execute(query, [SGTno]);


            let calMHR = 0;
            if (SSH_MEMBER_TEAM.length > 0) {
                calMHR = LRH_MH_TSAVE / SSH_MEMBER_TEAM.length
            }

            for (const item of SSH_MEMBER_TEAM) {
                const { T_EMP_ID, T_EMP_JOBGRAD, T_EMP_CC } = item;
                query = ``;
                query += ` INSERT INTO HR.SG_SUGGESTION_TEAM T `;
                query += `   (T.SST_REQ_NO, `;
                query += `    T.SST_EMP_ID, `;
                query += `    T.SST_POS_GRADE, `;
                query += `    T.SST_COST_CENTER, `;
                query += `    T.SST_SAVE_MHR, `;
                query += `    T.SST_CREATE_DATE, `;
                query += `    T.SST_CREATE_BY, `;
                query += `    T.SST_UPDATE_DATE, `;
                query += `    T.SST_UPDATE_BY) `;
                query += ` VALUES `;
                query += `   (:1, :2, :3, :4, :5, SYSDATE, :6, SYSDATE, :6) `;
                await connect.execute(query, [SGTno, T_EMP_ID, T_EMP_JOBGRAD, T_EMP_CC, calMHR, LRH_REQ_BY]);
            }

            if (LRH_SSH_FILE !== '') {
                await uploadFileFTP(LRH_FILESERVER, LRH_SSH_FILE)
            }

        }
        console.log('Save Complete : ' + LOCTno)
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

module.exports.ImportLOCT = async function (req, res) {
    let connect;
    let STS_HEADER = '';
    try {
        const STC_IMPORT = req.body;
        connect = await ConnectOracleDB("HR");
        let query = ``;
        let prun = 1;
        for (const item of STC_IMPORT) {
            const { LRH_REQ_NO,
                LRH_FACTORY,
                LRH_COST_CENTER,
                LRH_REQ_DATE,
                LRH_REQ_EMP_TYPE,
                LRH_REQ_BY,
                LRH_REQ_NAME,
                LRH_REQ_SURNAME,
                LRH_REQ_PROCESS,
                LRH_REQ_POSITION,
                LRH_REQ_MANAGER,
                LRH_REQ_STATUS,
                LRH_FILENAME,
                LRH_FILESERVER,
                LRH_PROBLEM,
                LRH_DET_BEFORE,
                LRH_DET_AFTER,
                LRH_MH_OUTPUT,
                LRH_MH_FORECAST,
                LRH_MH_TSAVE,
                LRH_MC_WCODE,
                LRH_MC_WCOST,
                LRH_MC_TSAVE,
                LRH_EVALUATE_STS,
                LRH_EVALUATE_DATE,
                LRH_LEADER_RESULT,
                LRH_LEADER_APP_BY,
                LRH_LEADER_APP_DATE,
                LRH_LEADER_APP_FISCALYR,
                LRH_LEADER_COMMENT,
                LRH_SUMIT_TO_SG,
                LRH_SG_TYPE,
                LRH_FILE_PATH,
                LRH_REQ_TYPE,
                LRH_LEADER_APP_MONTH,
                LRH_REQ_TYPE_TEAM } = item;

            let LOCTno = '';
            let Subject = '';

            Subject = '(L)' + LRH_PROBLEM;

            if (LRH_REQ_NO.trim() === '' || LRH_REQ_NO === null) {
                LOCTno = await getMaxLOCTLoop(LRH_FACTORY, LRH_COST_CENTER, prun)
                prun += 1;
            } else {
                LOCTno = LRH_REQ_NO
            }

            query = ``;
            query += ` DELETE HR.LOCT_SUGGESTION_TEAM T WHERE T.LST_REQ_NO = :1 `;
            await connect.execute(query, [LOCTno]);


            SGTno = ``;
            query = ``;
            query += ` 	MERGE INTO HR.LOCT_REQUEST_HEADER T	`;
            query += ` 	USING (SELECT :1 AS LRH_REQ_NO,	`;
            query += ` 	              :2 AS LRH_FACTORY,	`;
            query += ` 	              :3 AS LRH_COST_CENTER,	`;
            query += ` 	              TO_DATE(:4, 'DD/MM/YYYY HH12:MI:SS AM') AS LRH_REQ_DATE,	`;
            query += ` 	              :5 AS LRH_REQ_EMP_TYPE,	`;
            query += ` 	              :6 AS LRH_REQ_BY,	`;
            query += ` 	              :7 AS LRH_REQ_NAME,	`;
            query += ` 	              :8 AS LRH_REQ_SURNAME,	`;
            query += ` 	              :9 AS LRH_REQ_PROCESS,	`;
            query += ` 	              :10 AS LRH_REQ_POSITION,	`;
            query += ` 	              :11 AS LRH_REQ_MANAGER,	`;
            query += ` 	              :12 AS LRH_REQ_STATUS,	`;
            query += ` 	              :13 AS LRH_FILENAME,	`;
            query += ` 	              :14 AS LRH_FILESERVER,	`;
            query += ` 	              :15 AS LRH_PROBLEM,	`;
            query += ` 	              :16 AS LRH_DET_BEFORE,	`;
            query += ` 	              :17 AS LRH_DET_AFTER,	`;
            query += ` 	              :18 AS LRH_MH_OUTPUT,	`;
            query += ` 	              :19 AS LRH_MH_FORECAST,	`;
            query += ` 	              :20 AS LRH_MH_TSAVE,	`;
            query += ` 	              :21 AS LRH_MC_WCODE,	`;
            query += ` 	              :22 AS LRH_MC_WCOST,	`;
            query += ` 	              :23 AS LRH_MC_TSAVE,	`;
            query += ` 	              :24 AS LRH_EVALUATE_STS,	`;
            query += ` 	              :25 AS LRH_EVALUATE_DATE,	`;
            query += ` 	              :26 AS LRH_LEADER_RESULT,	`;
            query += ` 	              :27 AS LRH_LEADER_APP_BY,	`;
            query += ` 	              :28 AS LRH_LEADER_APP_DATE,	`;
            query += ` 	              :29 AS LRH_LEADER_APP_FISCALYR,	`;
            query += ` 	              :30 AS LRH_LEADER_COMMENT,	`;
            query += ` 	              :31 AS LRH_SUMIT_TO_SG,	`;
            query += ` 	              :32 AS LRH_SG_TYPE,	`;
            query += ` 	              SYSDATE AS LRH_CREATE_DATE,	`;
            query += ` 	              :33 AS LRH_CREATE_BY,	`;
            query += ` 	              SYSDATE AS LRH_UPDATE_DATE,	`;
            query += ` 	              :34 AS LRH_UPDATE_BY,	`;
            query += ` 	              :35 AS LRH_FILE_PATH,	`;
            query += ` 	              :36 AS LRH_REQ_TYPE,	`;
            query += ` 	              :37 AS LRH_SG_NO,	`;
            query += ` 	              :38 AS LRH_LEADER_APP_MONTH,	`;
            query += ` 	              TO_CHAR(SYSDATE, 'MM_YYYY') AS LRH_REQ_MONTH,	`;
            query += ` 	              DECODE(:39, 'WT', SYSDATE, '') AS LRH_SEND_DATE,	`;
            query += ` 	              :40 AS LRH_REQ_TYPE_TEAM	`;
            query += ` 	         FROM DUAL) D	`;
            query += ` 	ON (T.LRH_REQ_NO = D.LRH_REQ_NO)	`;
            query += ` 	WHEN MATCHED THEN	`;
            query += ` 	  UPDATE	`;
            query += ` 	     SET T.LRH_FACTORY             = D.LRH_FACTORY,	`;
            query += ` 	         T.LRH_COST_CENTER         = D.LRH_COST_CENTER,	`;
            query += ` 	         T.LRH_REQ_EMP_TYPE        = D.LRH_REQ_EMP_TYPE,	`;
            query += ` 	         T.LRH_REQ_BY              = D.LRH_REQ_BY,	`;
            query += ` 	         T.LRH_REQ_NAME            = D.LRH_REQ_NAME,	`;
            query += ` 	         T.LRH_REQ_SURNAME         = D.LRH_REQ_SURNAME,	`;
            query += ` 	         T.LRH_REQ_PROCESS         = D.LRH_REQ_PROCESS,	`;
            query += ` 	         T.LRH_REQ_POSITION        = D.LRH_REQ_POSITION,	`;
            query += ` 	         T.LRH_REQ_MANAGER         = D.LRH_REQ_MANAGER,	`;
            query += ` 	         T.LRH_REQ_STATUS          = D.LRH_REQ_STATUS,	`;
            query += ` 	         T.LRH_FILENAME            = D.LRH_FILENAME,	`;
            query += ` 	         T.LRH_FILESERVER          = D.LRH_FILESERVER,	`;
            query += ` 	         T.LRH_PROBLEM             = D.LRH_PROBLEM,	`;
            query += ` 	         T.LRH_DET_BEFORE          = D.LRH_DET_BEFORE,	`;
            query += ` 	         T.LRH_DET_AFTER           = D.LRH_DET_AFTER,	`;
            query += ` 	         T.LRH_MH_OUTPUT           = D.LRH_MH_OUTPUT,	`;
            query += ` 	         T.LRH_MH_FORECAST         = D.LRH_MH_FORECAST,	`;
            query += ` 	         T.LRH_MH_TSAVE            = D.LRH_MH_TSAVE,	`;
            query += ` 	         T.LRH_MC_WCODE            = D.LRH_MC_WCODE,	`;
            query += ` 	         T.LRH_MC_WCOST            = D.LRH_MC_WCOST,	`;
            query += ` 	         T.LRH_MC_TSAVE            = D.LRH_MC_TSAVE,	`;
            query += ` 	         T.LRH_EVALUATE_STS        = D.LRH_EVALUATE_STS,	`;
            query += ` 	         T.LRH_EVALUATE_DATE       = D.LRH_EVALUATE_DATE,	`;
            query += ` 	         T.LRH_LEADER_RESULT       = D.LRH_LEADER_RESULT,	`;
            query += ` 	         T.LRH_LEADER_APP_BY       = D.LRH_LEADER_APP_BY,	`;
            query += ` 	         T.LRH_LEADER_APP_DATE     = D.LRH_LEADER_APP_DATE,	`;
            query += ` 	         T.LRH_LEADER_APP_FISCALYR = D.LRH_LEADER_APP_FISCALYR,	`;
            query += ` 	         T.LRH_LEADER_COMMENT      = D.LRH_LEADER_COMMENT,	`;
            query += ` 	         T.LRH_SUMIT_TO_SG         = D.LRH_SUMIT_TO_SG,	`;
            query += ` 	         T.LRH_SG_TYPE             = D.LRH_SG_TYPE,	`;
            query += ` 	         T.LRH_UPDATE_DATE         = D.LRH_UPDATE_DATE,	`;
            query += ` 	         T.LRH_UPDATE_BY           = D.LRH_UPDATE_BY,	`;
            query += ` 	         T.LRH_FILE_PATH           = D.LRH_FILE_PATH,	`;
            query += ` 	         T.LRH_REQ_TYPE            = D.LRH_REQ_TYPE,	`;
            query += ` 	         T.LRH_SG_NO               = D.LRH_SG_NO,	`;
            query += ` 	         T.LRH_LEADER_APP_MONTH    = D.LRH_LEADER_APP_MONTH,	`;
            query += ` 	         T.LRH_SEND_DATE           = D.LRH_SEND_DATE,	`;
            query += ` 	         T.LRH_REQ_TYPE_TEAM       = D.LRH_REQ_TYPE_TEAM	`;
            query += ` 	WHEN NOT MATCHED THEN	`;
            query += ` 	  INSERT	`;
            query += ` 	    (T.LRH_REQ_NO,	`;
            query += ` 	     T.LRH_FACTORY,	`;
            query += ` 	     T.LRH_COST_CENTER,	`;
            query += ` 	     T.LRH_REQ_DATE,	`;
            query += ` 	     T.LRH_REQ_EMP_TYPE,	`;
            query += ` 	     T.LRH_REQ_BY,	`;
            query += ` 	     T.LRH_REQ_NAME,	`;
            query += ` 	     T.LRH_REQ_SURNAME,	`;
            query += ` 	     T.LRH_REQ_PROCESS,	`;
            query += ` 	     T.LRH_REQ_POSITION,	`;
            query += ` 	     T.LRH_REQ_MANAGER,	`;
            query += ` 	     T.LRH_REQ_STATUS,	`;
            query += ` 	     T.LRH_FILENAME,	`;
            query += ` 	     T.LRH_FILESERVER,	`;
            query += ` 	     T.LRH_PROBLEM,	`;
            query += ` 	     T.LRH_DET_BEFORE,	`;
            query += ` 	     T.LRH_DET_AFTER,	`;
            query += ` 	     T.LRH_MH_OUTPUT,	`;
            query += ` 	     T.LRH_MH_FORECAST,	`;
            query += ` 	     T.LRH_MH_TSAVE,	`;
            query += ` 	     T.LRH_MC_WCODE,	`;
            query += ` 	     T.LRH_MC_WCOST,	`;
            query += ` 	     T.LRH_MC_TSAVE,	`;
            query += ` 	     T.LRH_EVALUATE_STS,	`;
            query += ` 	     T.LRH_EVALUATE_DATE,	`;
            query += ` 	     T.LRH_LEADER_RESULT,	`;
            query += ` 	     T.LRH_LEADER_APP_BY,	`;
            query += ` 	     T.LRH_LEADER_APP_DATE,	`;
            query += ` 	     T.LRH_LEADER_APP_FISCALYR,	`;
            query += ` 	     T.LRH_LEADER_COMMENT,	`;
            query += ` 	     T.LRH_SUMIT_TO_SG,	`;
            query += ` 	     T.LRH_SG_TYPE,	`;
            query += ` 	     T.LRH_CREATE_DATE,	`;
            query += ` 	     T.LRH_CREATE_BY,	`;
            query += ` 	     T.LRH_FILE_PATH,	`;
            query += ` 	     T.LRH_REQ_TYPE,	`;
            query += ` 	     T.LRH_SG_NO,	`;
            query += ` 	     T.LRH_LEADER_APP_MONTH,	`;
            query += ` 	     T.LRH_REQ_MONTH,	`;
            query += ` 	     T.LRH_SEND_DATE,	`;
            query += ` 	     T.LRH_REQ_TYPE_TEAM)	`;
            query += ` 	  VALUES	`;
            query += ` 	    (D.LRH_REQ_NO,	`;
            query += ` 	     D.LRH_FACTORY,	`;
            query += ` 	     D.LRH_COST_CENTER,	`;
            query += ` 	     D.LRH_REQ_DATE,	`;
            query += ` 	     D.LRH_REQ_EMP_TYPE,	`;
            query += ` 	     D.LRH_REQ_BY,	`;
            query += ` 	     D.LRH_REQ_NAME,	`;
            query += ` 	     D.LRH_REQ_SURNAME,	`;
            query += ` 	     D.LRH_REQ_PROCESS,	`;
            query += ` 	     D.LRH_REQ_POSITION,	`;
            query += ` 	     D.LRH_REQ_MANAGER,	`;
            query += ` 	     D.LRH_REQ_STATUS,	`;
            query += ` 	     D.LRH_FILENAME,	`;
            query += ` 	     D.LRH_FILESERVER,	`;
            query += ` 	     D.LRH_PROBLEM,	`;
            query += ` 	     D.LRH_DET_BEFORE,	`;
            query += ` 	     D.LRH_DET_AFTER,	`;
            query += ` 	     D.LRH_MH_OUTPUT,	`;
            query += ` 	     D.LRH_MH_FORECAST,	`;
            query += ` 	     D.LRH_MH_TSAVE,	`;
            query += ` 	     D.LRH_MC_WCODE,	`;
            query += ` 	     D.LRH_MC_WCOST,	`;
            query += ` 	     D.LRH_MC_TSAVE,	`;
            query += ` 	     D.LRH_EVALUATE_STS,	`;
            query += ` 	     D.LRH_EVALUATE_DATE,	`;
            query += ` 	     D.LRH_LEADER_RESULT,	`;
            query += ` 	     D.LRH_LEADER_APP_BY,	`;
            query += ` 	     D.LRH_LEADER_APP_DATE,	`;
            query += ` 	     D.LRH_LEADER_APP_FISCALYR,	`;
            query += ` 	     D.LRH_LEADER_COMMENT,	`;
            query += ` 	     D.LRH_SUMIT_TO_SG,	`;
            query += ` 	     D.LRH_SG_TYPE,	`;
            query += ` 	     D.LRH_CREATE_DATE,	`;
            query += ` 	     D.LRH_CREATE_BY,	`;
            query += ` 	     D.LRH_FILE_PATH,	`;
            query += ` 	     D.LRH_REQ_TYPE,	`;
            query += ` 	     D.LRH_SG_NO,	`;
            query += ` 	     D.LRH_LEADER_APP_MONTH,	`;
            query += ` 	     D.LRH_REQ_MONTH,	`;
            query += ` 	     D.LRH_SEND_DATE,	`;
            query += ` 	     D.LRH_REQ_TYPE_TEAM)	`;
            await connect.execute(query,
                [LOCTno,
                    LRH_FACTORY,
                    LRH_COST_CENTER,
                    LRH_REQ_DATE,
                    LRH_REQ_EMP_TYPE,
                    LRH_REQ_BY,
                    LRH_REQ_NAME,
                    LRH_REQ_SURNAME,
                    LRH_REQ_PROCESS,
                    LRH_REQ_POSITION,
                    LRH_REQ_MANAGER,
                    LRH_REQ_STATUS,
                    LRH_FILENAME,
                    LRH_FILESERVER,
                    Subject,
                    LRH_DET_BEFORE,
                    LRH_DET_AFTER,
                    LRH_MH_OUTPUT,
                    LRH_MH_FORECAST,
                    LRH_MH_TSAVE,
                    LRH_MC_WCODE,
                    LRH_MC_WCOST,
                    LRH_MC_TSAVE,
                    LRH_EVALUATE_STS,
                    LRH_EVALUATE_DATE,
                    LRH_LEADER_RESULT,
                    LRH_LEADER_APP_BY,
                    LRH_LEADER_APP_DATE,
                    LRH_LEADER_APP_FISCALYR,
                    LRH_LEADER_COMMENT,
                    LRH_SUMIT_TO_SG,
                    LRH_SG_TYPE,
                    LRH_REQ_BY,
                    LRH_REQ_BY,
                    LRH_FILE_PATH,
                    LRH_REQ_TYPE,
                    '',
                    LRH_LEADER_APP_MONTH,
                    LRH_REQ_STATUS,
                    LRH_REQ_TYPE_TEAM]);

        }


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

module.exports.ImportLOCTV2 = async function (req, res) {
    let connect;
    let STS_HEADER = '';
    try {
        const STC_IMPORT = req.body;
        connect = await ConnectOracleDB("HR");
        let query = ``;
        let prun = 1;
        for (const item of STC_IMPORT) {
            const { LRH_REQ_NO,
                LRH_FACTORY,
                LRH_FACTORY_CODE,
                LRH_COST_CENTER,
                LRH_REQ_DATE,
                LRH_REQ_EMP_TYPE,
                LRH_REQ_BY,
                LRH_REQ_NAME,
                LRH_REQ_SURNAME,
                LRH_REQ_PROCESS,
                LRH_REQ_POSITION,
                LRH_REQ_MANAGER,
                LRH_REQ_MANAGER_NAME,
                LRH_REQ_STATUS,
                LRH_FILENAME,
                LRH_FILESERVER,
                LRH_PROBLEM,
                LRH_DET_BEFORE,
                LRH_DET_AFTER,
                LRH_MH_OUTPUT,
                LRH_MH_FORECAST,
                LRH_MH_TSAVE,
                LRH_MC_WCODE,
                LRH_MC_WCOST,
                LRH_MC_TSAVE,
                LRH_EVALUATE_STS,
                LRH_EVALUATE_DATE,
                LRH_LEADER_RESULT,
                LRH_LEADER_APP_BY,
                LRH_LEADER_APP_DATE,
                LRH_LEADER_APP_FISCALYR,
                LRH_LEADER_COMMENT,
                LRH_SUMIT_TO_SG,
                LRH_SG_TYPE,
                LRH_FILE_PATH,
                LRH_REQ_TYPE,
                LRH_SG_NO,
                LRH_LEADER_APP_MONTH,
                LRH_REQ_TYPE_TEAM,
                SSH_SV_APP_BY,
                SSH_REQ_TYPE,
                SSH_TEAM_NAME,
                SSH_MEMBER_TEAM } = item;
            //P_STATUS_SG, //LRH_REQ_STATUS

            let LOCTno = '';
            let SGTno = '';
            let Subject = '';

            if (LRH_REQ_NO.trim() === '' || LRH_REQ_NO === null) {
                LOCTno = await getMaxLOCTLoop(LRH_FACTORY, LRH_COST_CENTER, prun)
                prun += 1;
            } else {
                LOCTno = LRH_REQ_NO
            }

            if (LRH_REQ_TYPE === '1' || LRH_REQ_TYPE === '3') {
                if (LRH_SG_NO.trim() === '' || LRH_SG_NO === null) {
                    SGTno = await getMaxSGTLoop(LRH_FACTORY_CODE, LRH_COST_CENTER, prun)
                } else {
                    SGTno = LRH_SG_NO
                }
            } else {
                SGTno = LRH_SG_NO
            }

            if (LRH_REQ_TYPE === '1') {
                Subject = '(SL)' + LRH_PROBLEM;
            } else if (LRH_REQ_TYPE === '2') {
                Subject = '(L)' + LRH_PROBLEM;
            } else if (LRH_REQ_TYPE === '3') {
                Subject = '(SI)' + LRH_PROBLEM;
            } else if (LRH_REQ_TYPE === '4') {
                Subject = '(I)' + LRH_PROBLEM;
            } else if (LRH_REQ_TYPE === '5') {
                Subject = '(S)' + LRH_PROBLEM;
            }

            query = ``;
            if (LRH_REQ_TYPE === '1' || LRH_REQ_TYPE === '3') {
                query = ``;
                query += ` 	MERGE INTO HR.LOCT_REQUEST_HEADER T	`;
                query += ` 	USING (SELECT :1 AS LRH_REQ_NO,	`;
                query += ` 	              :2 AS LRH_FACTORY,	`;
                query += ` 	              :3 AS LRH_COST_CENTER,	`;
                query += ` 	              TO_DATE(:4, 'DD/MM/YYYY HH24:MI:SS') AS LRH_REQ_DATE,	`;
                query += ` 	              :5 AS LRH_REQ_EMP_TYPE,	`;
                query += ` 	              :6 AS LRH_REQ_BY,	`;
                query += ` 	              :7 AS LRH_REQ_NAME,	`;
                query += ` 	              :8 AS LRH_REQ_SURNAME,	`;
                query += ` 	              :9 AS LRH_REQ_PROCESS,	`;
                query += ` 	              :10 AS LRH_REQ_POSITION,	`;
                query += ` 	              :11 AS LRH_REQ_MANAGER,	`;
                query += ` 	              :12 AS LRH_REQ_STATUS,	`;
                query += ` 	              :13 AS LRH_FILENAME,	`;
                query += ` 	              :14 AS LRH_FILESERVER,	`;
                query += ` 	              :15 AS LRH_PROBLEM,	`;
                query += ` 	              :16 AS LRH_DET_BEFORE,	`;
                query += ` 	              :17 AS LRH_DET_AFTER,	`;
                query += ` 	              :18 AS LRH_MH_OUTPUT,	`;
                query += ` 	              :19 AS LRH_MH_FORECAST,	`;
                query += ` 	              :20 AS LRH_MH_TSAVE,	`;
                query += ` 	              :21 AS LRH_MC_WCODE,	`;
                query += ` 	              :22 AS LRH_MC_WCOST,	`;
                query += ` 	              :23 AS LRH_MC_TSAVE,	`;
                query += ` 	              :24 AS LRH_EVALUATE_STS,	`;
                query += ` 	              :25 AS LRH_EVALUATE_DATE,	`;
                query += ` 	              :26 AS LRH_LEADER_RESULT,	`;
                query += ` 	              :27 AS LRH_LEADER_APP_BY,	`;
                query += ` 	              :28 AS LRH_LEADER_APP_DATE,	`;
                query += ` 	              :29 AS LRH_LEADER_APP_FISCALYR,	`;
                query += ` 	              :30 AS LRH_LEADER_COMMENT,	`;
                query += ` 	              :31 AS LRH_SUMIT_TO_SG,	`;
                query += ` 	              :32 AS LRH_SG_TYPE,	`;
                query += ` 	              SYSDATE AS LRH_CREATE_DATE,	`;
                query += ` 	              :33 AS LRH_CREATE_BY,	`;
                query += ` 	              SYSDATE AS LRH_UPDATE_DATE,	`;
                query += ` 	              :34 AS LRH_UPDATE_BY,	`;
                query += ` 	              :35 AS LRH_FILE_PATH,	`;
                query += ` 	              :36 AS LRH_REQ_TYPE,	`;
                query += ` 	              :37 AS LRH_SG_NO,	`;
                query += ` 	              :38 AS LRH_LEADER_APP_MONTH,	`;
                query += ` 	              TO_CHAR(SYSDATE, 'MM_YYYY') AS LRH_REQ_MONTH,	`;
                query += ` 	              DECODE(:39, 'WT', SYSDATE, '') AS LRH_SEND_DATE,	`;
                query += ` 	              :40 AS LRH_REQ_TYPE_TEAM	`;
                query += ` 	         FROM DUAL) D	`;
                query += ` 	ON (T.LRH_REQ_NO = D.LRH_REQ_NO)	`;
                query += ` 	WHEN MATCHED THEN	`;
                query += ` 	  UPDATE	`;
                query += ` 	     SET T.LRH_FACTORY             = D.LRH_FACTORY,	`;
                query += ` 	         T.LRH_COST_CENTER         = D.LRH_COST_CENTER,	`;
                query += ` 	         T.LRH_REQ_EMP_TYPE        = D.LRH_REQ_EMP_TYPE,	`;
                query += ` 	         T.LRH_REQ_BY              = D.LRH_REQ_BY,	`;
                query += ` 	         T.LRH_REQ_NAME            = D.LRH_REQ_NAME,	`;
                query += ` 	         T.LRH_REQ_SURNAME         = D.LRH_REQ_SURNAME,	`;
                query += ` 	         T.LRH_REQ_PROCESS         = D.LRH_REQ_PROCESS,	`;
                query += ` 	         T.LRH_REQ_POSITION        = D.LRH_REQ_POSITION,	`;
                query += ` 	         T.LRH_REQ_MANAGER         = D.LRH_REQ_MANAGER,	`;
                query += ` 	         T.LRH_REQ_STATUS          = D.LRH_REQ_STATUS,	`;
                query += ` 	         T.LRH_FILENAME            = D.LRH_FILENAME,	`;
                query += ` 	         T.LRH_FILESERVER          = D.LRH_FILESERVER,	`;
                query += ` 	         T.LRH_PROBLEM             = D.LRH_PROBLEM,	`;
                query += ` 	         T.LRH_DET_BEFORE          = D.LRH_DET_BEFORE,	`;
                query += ` 	         T.LRH_DET_AFTER           = D.LRH_DET_AFTER,	`;
                query += ` 	         T.LRH_MH_OUTPUT           = D.LRH_MH_OUTPUT,	`;
                query += ` 	         T.LRH_MH_FORECAST         = D.LRH_MH_FORECAST,	`;
                query += ` 	         T.LRH_MH_TSAVE            = D.LRH_MH_TSAVE,	`;
                query += ` 	         T.LRH_MC_WCODE            = D.LRH_MC_WCODE,	`;
                query += ` 	         T.LRH_MC_WCOST            = D.LRH_MC_WCOST,	`;
                query += ` 	         T.LRH_MC_TSAVE            = D.LRH_MC_TSAVE,	`;
                query += ` 	         T.LRH_EVALUATE_STS        = D.LRH_EVALUATE_STS,	`;
                query += ` 	         T.LRH_EVALUATE_DATE       = D.LRH_EVALUATE_DATE,	`;
                query += ` 	         T.LRH_LEADER_RESULT       = D.LRH_LEADER_RESULT,	`;
                query += ` 	         T.LRH_LEADER_APP_BY       = D.LRH_LEADER_APP_BY,	`;
                query += ` 	         T.LRH_LEADER_APP_DATE     = D.LRH_LEADER_APP_DATE,	`;
                query += ` 	         T.LRH_LEADER_APP_FISCALYR = D.LRH_LEADER_APP_FISCALYR,	`;
                query += ` 	         T.LRH_LEADER_COMMENT      = D.LRH_LEADER_COMMENT,	`;
                query += ` 	         T.LRH_SUMIT_TO_SG         = D.LRH_SUMIT_TO_SG,	`;
                query += ` 	         T.LRH_SG_TYPE             = D.LRH_SG_TYPE,	`;
                query += ` 	         T.LRH_UPDATE_DATE         = D.LRH_UPDATE_DATE,	`;
                query += ` 	         T.LRH_UPDATE_BY           = D.LRH_UPDATE_BY,	`;
                query += ` 	         T.LRH_FILE_PATH           = D.LRH_FILE_PATH,	`;
                query += ` 	         T.LRH_REQ_TYPE            = D.LRH_REQ_TYPE,	`;
                query += ` 	         T.LRH_SG_NO               = D.LRH_SG_NO,	`;
                query += ` 	         T.LRH_LEADER_APP_MONTH    = D.LRH_LEADER_APP_MONTH,	`;
                query += ` 	         T.LRH_SEND_DATE           = D.LRH_SEND_DATE,	`;
                query += ` 	         T.LRH_REQ_TYPE_TEAM       = D.LRH_REQ_TYPE_TEAM	`;
                query += ` 	WHEN NOT MATCHED THEN	`;
                query += ` 	  INSERT	`;
                query += ` 	    (T.LRH_REQ_NO,	`;
                query += ` 	     T.LRH_FACTORY,	`;
                query += ` 	     T.LRH_COST_CENTER,	`;
                query += ` 	     T.LRH_REQ_DATE,	`;
                query += ` 	     T.LRH_REQ_EMP_TYPE,	`;
                query += ` 	     T.LRH_REQ_BY,	`;
                query += ` 	     T.LRH_REQ_NAME,	`;
                query += ` 	     T.LRH_REQ_SURNAME,	`;
                query += ` 	     T.LRH_REQ_PROCESS,	`;
                query += ` 	     T.LRH_REQ_POSITION,	`;
                query += ` 	     T.LRH_REQ_MANAGER,	`;
                query += ` 	     T.LRH_REQ_STATUS,	`;
                query += ` 	     T.LRH_FILENAME,	`;
                query += ` 	     T.LRH_FILESERVER,	`;
                query += ` 	     T.LRH_PROBLEM,	`;
                query += ` 	     T.LRH_DET_BEFORE,	`;
                query += ` 	     T.LRH_DET_AFTER,	`;
                query += ` 	     T.LRH_MH_OUTPUT,	`;
                query += ` 	     T.LRH_MH_FORECAST,	`;
                query += ` 	     T.LRH_MH_TSAVE,	`;
                query += ` 	     T.LRH_MC_WCODE,	`;
                query += ` 	     T.LRH_MC_WCOST,	`;
                query += ` 	     T.LRH_MC_TSAVE,	`;
                query += ` 	     T.LRH_EVALUATE_STS,	`;
                query += ` 	     T.LRH_EVALUATE_DATE,	`;
                query += ` 	     T.LRH_LEADER_RESULT,	`;
                query += ` 	     T.LRH_LEADER_APP_BY,	`;
                query += ` 	     T.LRH_LEADER_APP_DATE,	`;
                query += ` 	     T.LRH_LEADER_APP_FISCALYR,	`;
                query += ` 	     T.LRH_LEADER_COMMENT,	`;
                query += ` 	     T.LRH_SUMIT_TO_SG,	`;
                query += ` 	     T.LRH_SG_TYPE,	`;
                query += ` 	     T.LRH_CREATE_DATE,	`;
                query += ` 	     T.LRH_CREATE_BY,	`;
                query += ` 	     T.LRH_FILE_PATH,	`;
                query += ` 	     T.LRH_REQ_TYPE,	`;
                query += ` 	     T.LRH_SG_NO,	`;
                query += ` 	     T.LRH_LEADER_APP_MONTH,	`;
                query += ` 	     T.LRH_REQ_MONTH,	`;
                query += ` 	     T.LRH_SEND_DATE,	`;
                query += ` 	     T.LRH_REQ_TYPE_TEAM)	`;
                query += ` 	  VALUES	`;
                query += ` 	    (D.LRH_REQ_NO,	`;
                query += ` 	     D.LRH_FACTORY,	`;
                query += ` 	     D.LRH_COST_CENTER,	`;
                query += ` 	     D.LRH_REQ_DATE,	`;
                query += ` 	     D.LRH_REQ_EMP_TYPE,	`;
                query += ` 	     D.LRH_REQ_BY,	`;
                query += ` 	     D.LRH_REQ_NAME,	`;
                query += ` 	     D.LRH_REQ_SURNAME,	`;
                query += ` 	     D.LRH_REQ_PROCESS,	`;
                query += ` 	     D.LRH_REQ_POSITION,	`;
                query += ` 	     D.LRH_REQ_MANAGER,	`;
                query += ` 	     D.LRH_REQ_STATUS,	`;
                query += ` 	     D.LRH_FILENAME,	`;
                query += ` 	     D.LRH_FILESERVER,	`;
                query += ` 	     D.LRH_PROBLEM,	`;
                query += ` 	     D.LRH_DET_BEFORE,	`;
                query += ` 	     D.LRH_DET_AFTER,	`;
                query += ` 	     D.LRH_MH_OUTPUT,	`;
                query += ` 	     D.LRH_MH_FORECAST,	`;
                query += ` 	     D.LRH_MH_TSAVE,	`;
                query += ` 	     D.LRH_MC_WCODE,	`;
                query += ` 	     D.LRH_MC_WCOST,	`;
                query += ` 	     D.LRH_MC_TSAVE,	`;
                query += ` 	     D.LRH_EVALUATE_STS,	`;
                query += ` 	     D.LRH_EVALUATE_DATE,	`;
                query += ` 	     D.LRH_LEADER_RESULT,	`;
                query += ` 	     D.LRH_LEADER_APP_BY,	`;
                query += ` 	     D.LRH_LEADER_APP_DATE,	`;
                query += ` 	     D.LRH_LEADER_APP_FISCALYR,	`;
                query += ` 	     D.LRH_LEADER_COMMENT,	`;
                query += ` 	     D.LRH_SUMIT_TO_SG,	`;
                query += ` 	     D.LRH_SG_TYPE,	`;
                query += ` 	     D.LRH_CREATE_DATE,	`;
                query += ` 	     D.LRH_CREATE_BY,	`;
                query += ` 	     D.LRH_FILE_PATH,	`;
                query += ` 	     D.LRH_REQ_TYPE,	`;
                query += ` 	     D.LRH_SG_NO,	`;
                query += ` 	     D.LRH_LEADER_APP_MONTH,	`;
                query += ` 	     D.LRH_REQ_MONTH,	`;
                query += ` 	     D.LRH_SEND_DATE,	`;
                query += ` 	     D.LRH_REQ_TYPE_TEAM)	`;
                await connect.execute(query,
                    [LOCTno,
                        LRH_FACTORY,
                        LRH_COST_CENTER,
                        LRH_REQ_DATE,
                        LRH_REQ_EMP_TYPE,
                        LRH_REQ_BY,
                        LRH_REQ_NAME,
                        LRH_REQ_SURNAME,
                        LRH_REQ_PROCESS,
                        LRH_REQ_POSITION,
                        LRH_REQ_MANAGER,
                        LRH_REQ_STATUS,
                        LRH_FILENAME,
                        LRH_FILESERVER,
                        Subject,
                        LRH_DET_BEFORE,
                        LRH_DET_AFTER,
                        LRH_MH_OUTPUT,
                        LRH_MH_FORECAST,
                        LRH_MH_TSAVE,
                        LRH_MC_WCODE,
                        LRH_MC_WCOST,
                        LRH_MC_TSAVE,
                        LRH_EVALUATE_STS,
                        LRH_EVALUATE_DATE,
                        LRH_LEADER_RESULT,
                        LRH_LEADER_APP_BY,
                        LRH_LEADER_APP_DATE,
                        LRH_LEADER_APP_FISCALYR,
                        LRH_LEADER_COMMENT,
                        LRH_SUMIT_TO_SG,
                        LRH_SG_TYPE,
                        LRH_REQ_BY,
                        LRH_REQ_BY,
                        LRH_FILE_PATH,
                        LRH_REQ_TYPE,
                        SGTno,
                        LRH_LEADER_APP_MONTH,
                        LRH_REQ_STATUS,
                        LRH_REQ_TYPE_TEAM]);

                query = ``;
                query += ` DELETE HR.LOCT_SUGGESTION_TEAM T WHERE T.LST_REQ_NO = :1 `;
                await connect.execute(query, [LOCTno]);


                let calMHR = 0;
                if (SSH_MEMBER_TEAM.length > 0) {
                    calMHR = LRH_MH_TSAVE / SSH_MEMBER_TEAM.length
                }

                for (const item of SSH_MEMBER_TEAM) {
                    const { T_EMP_ID, T_EMP_JOBGRAD, T_EMP_CC } = item;
                    query = ``;
                    query += ` INSERT INTO HR.LOCT_SUGGESTION_TEAM T `;
                    query += `   (T.LST_REQ_NO, `;
                    query += `    T.LST_EMP_ID, `;
                    query += `    T.LST_POS_GRADE, `;
                    query += `    T.LST_COST_CENTER, `;
                    query += `    T.LST_SAVE_MHR, `;
                    query += `    T.LST_CREATE_DATE, `;
                    query += `    T.LST_CREATE_BY, `;
                    query += `    T.LST_UPDATE_DATE, `;
                    query += `    T.LST_UPDATE_BY) `;
                    query += ` VALUES `;
                    query += `   (:1, :2, :3, :4, :5, SYSDATE, :6, SYSDATE, :7) `;
                    await connect.execute(query, [LOCTno, T_EMP_ID, T_EMP_JOBGRAD, T_EMP_CC, calMHR, LRH_REQ_BY, LRH_REQ_BY]);
                }
                query = ``;
                query += ` 	MERGE INTO HR.SG_SUGGESTION_HEADER T	`;
                query += ` 	USING (SELECT :1 AS SSH_REQ_NO,	`;
                query += ` 	              :2 AS SSH_FACTORY,	`;
                query += ` 	              :3 AS SSH_COST_CENTER,	`;
                query += ` 	              :4 AS SSH_DEPT,	`;
                query += ` 	              :5 AS SSH_SECTION,	`;
                query += ` 	              SYSDATE AS SSH_REQ_DATE,	`;
                query += ` 	              :6 AS SSH_EMP_TYPE,	`;
                query += ` 	              :7 AS SSH_REQ_BY,	`;
                query += ` 	              :8 AS SSH_REQ_NAME,	`;
                query += ` 	              :9 AS SSH_REQ_SURNAME,	`;
                query += ` 	              :10 AS SSH_REQ_PROCESS,	`;
                query += ` 	              :11 AS SSH_REQ_POSITION,	`;
                query += ` 	              :12 AS SSH_REQ_MANAGER,	`;
                query += ` 	              :13 AS SSH_REQ_STATUS,	`;
                query += ` 	              :14 AS SSH_SUGGESTION_TYPE,	`;
                query += ` 	              :15 AS SSH_SUBJECT,	`;
                query += ` 	              :16 AS SSH_DET_BEFORE,	`;
                query += ` 	              :17 AS SSH_DET_SUGGESTION,	`;
                query += ` 	              SYSDATE AS SSH_CREATE_DATE,	`;
                query += ` 	              'SGT' AS SSH_CREATE_BY,	`;
                query += ` 	              SYSDATE AS SSH_UPDATE_DATE,	`;
                query += ` 	              'SGT' AS SSH_UPDATE_BY,	`;
                query += ` 	              :18 AS SSH_REQ_TYPE,	`;
                query += ` 	              :19 AS SSH_FILENAME,	`;
                query += ` 	              :20 AS SSH_MH_TSAVE,	`;
                query += ` 	              :21 AS SSH_MC_TSAVE,	`;
                query += ` 	              :22 AS SSH_FILESERVER,	`;
                query += ` 	              :23 AS SSH_TEAM,	`;
                query += ` 	              :24 AS SSH_SV_APP_BY	`;
                query += ` 	         FROM DUAL) D	`;
                query += ` 	ON (T.SSH_REQ_NO = D.SSH_REQ_NO)	`;
                query += ` 	WHEN MATCHED THEN	`;
                query += ` 	  UPDATE	`;
                query += ` 	     SET T.SSH_FACTORY         = D.SSH_FACTORY,	`;
                query += ` 	         T.SSH_COST_CENTER     = D.SSH_COST_CENTER,	`;
                query += ` 	         T.SSH_DEPT            = D.SSH_DEPT,	`;
                query += ` 	         T.SSH_SECTION         = D.SSH_SECTION,	`;
                query += ` 	         T.SSH_EMP_TYPE        = D.SSH_EMP_TYPE,	`;
                query += ` 	         T.SSH_REQ_BY          = D.SSH_REQ_BY,	`;
                query += ` 	         T.SSH_REQ_NAME        = D.SSH_REQ_NAME,	`;
                query += ` 	         T.SSH_REQ_SURNAME     = D.SSH_REQ_SURNAME,	`;
                query += ` 	         T.SSH_REQ_PROCESS     = D.SSH_REQ_PROCESS,	`;
                query += ` 	         T.SSH_REQ_POSITION    = D.SSH_REQ_POSITION,	`;
                query += ` 	         T.SSH_REQ_MANAGER     = D.SSH_REQ_MANAGER,	`;
                query += ` 	         T.SSH_REQ_STATUS      = D.SSH_REQ_STATUS,	`;
                query += ` 	         T.SSH_SUGGESTION_TYPE = D.SSH_SUGGESTION_TYPE,	`;
                query += ` 	         T.SSH_SUBJECT         = D.SSH_SUBJECT,	`;
                query += ` 	         T.SSH_DET_BEFORE      = D.SSH_DET_BEFORE,	`;
                query += ` 	         T.SSH_DET_SUGGESTION  = D.SSH_DET_SUGGESTION,	`;
                query += ` 	         T.SSH_UPDATE_DATE     = D.SSH_UPDATE_DATE,	`;
                query += ` 	         T.SSH_UPDATE_BY       = D.SSH_UPDATE_BY,	`;
                query += ` 	         T.SSH_REQ_TYPE        = D.SSH_REQ_TYPE,	`;
                query += ` 	         T.SSH_FILENAME        = D.SSH_FILENAME,	`;
                query += ` 	         T.SSH_MH_TSAVE        = D.SSH_MH_TSAVE,	`;
                query += ` 	         T.SSH_MC_TSAVE        = D.SSH_MC_TSAVE,	`;
                query += ` 	         T.SSH_FILESERVER      = D.SSH_FILESERVER,	`;
                query += ` 	         T.SSH_TEAM            = D.SSH_TEAM,	`;
                query += ` 	         T.SSH_SV_APP_BY       = D.SSH_SV_APP_BY	`;
                query += ` 	WHEN NOT MATCHED THEN	`;
                query += ` 	  INSERT	`;
                query += ` 	    (T.SSH_REQ_NO,	`;
                query += ` 	     T.SSH_FACTORY,	`;
                query += ` 	     T.SSH_COST_CENTER,	`;
                query += ` 	     T.SSH_DEPT,	`;
                query += ` 	     T.SSH_SECTION,	`;
                query += ` 	     T.SSH_REQ_DATE,	`;
                query += ` 	     T.SSH_EMP_TYPE,	`;
                query += ` 	     T.SSH_REQ_BY,	`;
                query += ` 	     T.SSH_REQ_NAME,	`;
                query += ` 	     T.SSH_REQ_SURNAME,	`;
                query += ` 	     T.SSH_REQ_PROCESS,	`;
                query += ` 	     T.SSH_REQ_POSITION,	`;
                query += ` 	     T.SSH_REQ_MANAGER,	`;
                query += ` 	     T.SSH_REQ_STATUS,	`;
                query += ` 	     T.SSH_SUGGESTION_TYPE,	`;
                query += ` 	     T.SSH_SUBJECT,	`;
                query += ` 	     T.SSH_DET_BEFORE,	`;
                query += ` 	     T.SSH_DET_SUGGESTION,	`;
                query += ` 	     T.SSH_CREATE_DATE,	`;
                query += ` 	     T.SSH_CREATE_BY,	`;
                query += ` 	     T.SSH_UPDATE_DATE,	`;
                query += ` 	     T.SSH_UPDATE_BY,	`;
                query += ` 	     T.SSH_REQ_TYPE,	`;
                query += ` 	     T.SSH_FILENAME,	`;
                query += ` 	     T.SSH_MH_TSAVE,	`;
                query += ` 	     T.SSH_MC_TSAVE,	`;
                query += ` 	     T.SSH_FILESERVER,	`;
                query += ` 	     T.SSH_TEAM,	`;
                query += ` 	     T.SSH_SV_APP_BY)	`;
                query += ` 	  VALUES	`;
                query += ` 	    (D.SSH_REQ_NO,	`;
                query += ` 	     D.SSH_FACTORY,	`;
                query += ` 	     D.SSH_COST_CENTER,	`;
                query += ` 	     D.SSH_DEPT,	`;
                query += ` 	     D.SSH_SECTION,	`;
                query += ` 	     D.SSH_REQ_DATE,	`;
                query += ` 	     D.SSH_EMP_TYPE,	`;
                query += ` 	     D.SSH_REQ_BY,	`;
                query += ` 	     D.SSH_REQ_NAME,	`;
                query += ` 	     D.SSH_REQ_SURNAME,	`;
                query += ` 	     D.SSH_REQ_PROCESS,	`;
                query += ` 	     D.SSH_REQ_POSITION,	`;
                query += ` 	     D.SSH_REQ_MANAGER,	`;
                query += ` 	     D.SSH_REQ_STATUS,	`;
                query += ` 	     D.SSH_SUGGESTION_TYPE,	`;
                query += ` 	     D.SSH_SUBJECT,	`;
                query += ` 	     D.SSH_DET_BEFORE,	`;
                query += ` 	     D.SSH_DET_SUGGESTION,	`;
                query += ` 	     D.SSH_CREATE_DATE,	`;
                query += ` 	     D.SSH_CREATE_BY,	`;
                query += ` 	     D.SSH_UPDATE_DATE,	`;
                query += ` 	     D.SSH_UPDATE_BY,	`;
                query += ` 	     D.SSH_REQ_TYPE,	`;
                query += ` 	     D.SSH_FILENAME,	`;
                query += ` 	     D.SSH_MH_TSAVE,	`;
                query += ` 	     D.SSH_MC_TSAVE,	`;
                query += ` 	     D.SSH_FILESERVER,	`;
                query += ` 	     D.SSH_TEAM,	`;
                query += ` 	     D.SSH_SV_APP_BY)	`;
                await connect.execute(query, [
                    SGTno,
                    LRH_FACTORY_CODE,
                    LRH_COST_CENTER,
                    '',
                    '',
                    LRH_REQ_EMP_TYPE,
                    LRH_REQ_BY,
                    LRH_REQ_NAME,
                    LRH_REQ_SURNAME,
                    LRH_REQ_PROCESS,
                    LRH_REQ_POSITION,
                    LRH_REQ_MANAGER_NAME,
                    LRH_REQ_STATUS,
                    LRH_SG_TYPE,
                    Subject,
                    LRH_DET_BEFORE,
                    LRH_DET_AFTER,
                    SSH_REQ_TYPE,
                    LRH_FILENAME,
                    LRH_MH_TSAVE,
                    LRH_MC_TSAVE,
                    LRH_FILESERVER,
                    SSH_TEAM_NAME,
                    SSH_SV_APP_BY
                ]);

                query = ``;
                query += ` DELETE HR.SG_SUGGESTION_TEAM T WHERE T.SST_REQ_NO = :1 `;
                await connect.execute(query, [SGTno]);

                for (const item of SSH_MEMBER_TEAM) {
                    const { T_EMP_ID, T_EMP_JOBGRAD, T_EMP_CC } = item;
                    query = ``;
                    query += ` INSERT INTO HR.SG_SUGGESTION_TEAM T `;
                    query += `   (T.SST_REQ_NO, `;
                    query += `    T.SST_EMP_ID, `;
                    query += `    T.SST_POS_GRADE, `;
                    query += `    T.SST_COST_CENTER, `;
                    query += `    T.SST_SAVE_MHR, `;
                    query += `    T.SST_CREATE_DATE, `;
                    query += `    T.SST_CREATE_BY, `;
                    query += `    T.SST_UPDATE_DATE, `;
                    query += `    T.SST_UPDATE_BY) `;
                    query += ` VALUES `;
                    query += `   (:1, :2, :3, :4, :5, SYSDATE, :6, SYSDATE, :7) `;
                    await connect.execute(query, [SGTno, T_EMP_ID, T_EMP_JOBGRAD, T_EMP_CC, calMHR, LRH_REQ_BY, LRH_REQ_BY]);
                }

                // if (LRH_SSH_FILE !== '') {
                //     await uploadFileFTP(LRH_FILESERVER, LRH_SSH_FILE)
                // }

            } else if (LRH_REQ_TYPE === '2' || LRH_REQ_TYPE === '4') {
                query = ``;
                query += ` DELETE HR.LOCT_SUGGESTION_TEAM T WHERE T.LST_REQ_NO = :1 `;
                await connect.execute(query, [LOCTno]);

                query = ``;
                query += ` DELETE HR.SG_SUGGESTION_TEAM T WHERE T.SST_REQ_NO = :1 `;
                await connect.execute(query, [SGTno]);

                SGTno = ``;
                query = ``;
                query += ` 	MERGE INTO HR.LOCT_REQUEST_HEADER T	`;
                query += ` 	USING (SELECT :1 AS LRH_REQ_NO,	`;
                query += ` 	              :2 AS LRH_FACTORY,	`;
                query += ` 	              :3 AS LRH_COST_CENTER,	`;
                query += ` 	              TO_DATE(:4, 'DD/MM/YYYY HH24:MI:SS') AS LRH_REQ_DATE,	`;
                query += ` 	              :5 AS LRH_REQ_EMP_TYPE,	`;
                query += ` 	              :6 AS LRH_REQ_BY,	`;
                query += ` 	              :7 AS LRH_REQ_NAME,	`;
                query += ` 	              :8 AS LRH_REQ_SURNAME,	`;
                query += ` 	              :9 AS LRH_REQ_PROCESS,	`;
                query += ` 	              :10 AS LRH_REQ_POSITION,	`;
                query += ` 	              :11 AS LRH_REQ_MANAGER,	`;
                query += ` 	              :12 AS LRH_REQ_STATUS,	`;
                query += ` 	              :13 AS LRH_FILENAME,	`;
                query += ` 	              :14 AS LRH_FILESERVER,	`;
                query += ` 	              :15 AS LRH_PROBLEM,	`;
                query += ` 	              :16 AS LRH_DET_BEFORE,	`;
                query += ` 	              :17 AS LRH_DET_AFTER,	`;
                query += ` 	              :18 AS LRH_MH_OUTPUT,	`;
                query += ` 	              :19 AS LRH_MH_FORECAST,	`;
                query += ` 	              :20 AS LRH_MH_TSAVE,	`;
                query += ` 	              :21 AS LRH_MC_WCODE,	`;
                query += ` 	              :22 AS LRH_MC_WCOST,	`;
                query += ` 	              :23 AS LRH_MC_TSAVE,	`;
                query += ` 	              :24 AS LRH_EVALUATE_STS,	`;
                query += ` 	              :25 AS LRH_EVALUATE_DATE,	`;
                query += ` 	              :26 AS LRH_LEADER_RESULT,	`;
                query += ` 	              :27 AS LRH_LEADER_APP_BY,	`;
                query += ` 	              :28 AS LRH_LEADER_APP_DATE,	`;
                query += ` 	              :29 AS LRH_LEADER_APP_FISCALYR,	`;
                query += ` 	              :30 AS LRH_LEADER_COMMENT,	`;
                query += ` 	              :31 AS LRH_SUMIT_TO_SG,	`;
                query += ` 	              :32 AS LRH_SG_TYPE,	`;
                query += ` 	              SYSDATE AS LRH_CREATE_DATE,	`;
                query += ` 	              :33 AS LRH_CREATE_BY,	`;
                query += ` 	              SYSDATE AS LRH_UPDATE_DATE,	`;
                query += ` 	              :34 AS LRH_UPDATE_BY,	`;
                query += ` 	              :35 AS LRH_FILE_PATH,	`;
                query += ` 	              :36 AS LRH_REQ_TYPE,	`;
                query += ` 	              :37 AS LRH_SG_NO,	`;
                query += ` 	              :38 AS LRH_LEADER_APP_MONTH,	`;
                query += ` 	              TO_CHAR(SYSDATE, 'MM_YYYY') AS LRH_REQ_MONTH,	`;
                query += ` 	              DECODE(:39, 'WT', SYSDATE, '') AS LRH_SEND_DATE,	`;
                query += ` 	              :40 AS LRH_REQ_TYPE_TEAM	`;
                query += ` 	         FROM DUAL) D	`;
                query += ` 	ON (T.LRH_REQ_NO = D.LRH_REQ_NO)	`;
                query += ` 	WHEN MATCHED THEN	`;
                query += ` 	  UPDATE	`;
                query += ` 	     SET T.LRH_FACTORY             = D.LRH_FACTORY,	`;
                query += ` 	         T.LRH_COST_CENTER         = D.LRH_COST_CENTER,	`;
                query += ` 	         T.LRH_REQ_EMP_TYPE        = D.LRH_REQ_EMP_TYPE,	`;
                query += ` 	         T.LRH_REQ_BY              = D.LRH_REQ_BY,	`;
                query += ` 	         T.LRH_REQ_NAME            = D.LRH_REQ_NAME,	`;
                query += ` 	         T.LRH_REQ_SURNAME         = D.LRH_REQ_SURNAME,	`;
                query += ` 	         T.LRH_REQ_PROCESS         = D.LRH_REQ_PROCESS,	`;
                query += ` 	         T.LRH_REQ_POSITION        = D.LRH_REQ_POSITION,	`;
                query += ` 	         T.LRH_REQ_MANAGER         = D.LRH_REQ_MANAGER,	`;
                query += ` 	         T.LRH_REQ_STATUS          = D.LRH_REQ_STATUS,	`;
                query += ` 	         T.LRH_FILENAME            = D.LRH_FILENAME,	`;
                query += ` 	         T.LRH_FILESERVER          = D.LRH_FILESERVER,	`;
                query += ` 	         T.LRH_PROBLEM             = D.LRH_PROBLEM,	`;
                query += ` 	         T.LRH_DET_BEFORE          = D.LRH_DET_BEFORE,	`;
                query += ` 	         T.LRH_DET_AFTER           = D.LRH_DET_AFTER,	`;
                query += ` 	         T.LRH_MH_OUTPUT           = D.LRH_MH_OUTPUT,	`;
                query += ` 	         T.LRH_MH_FORECAST         = D.LRH_MH_FORECAST,	`;
                query += ` 	         T.LRH_MH_TSAVE            = D.LRH_MH_TSAVE,	`;
                query += ` 	         T.LRH_MC_WCODE            = D.LRH_MC_WCODE,	`;
                query += ` 	         T.LRH_MC_WCOST            = D.LRH_MC_WCOST,	`;
                query += ` 	         T.LRH_MC_TSAVE            = D.LRH_MC_TSAVE,	`;
                query += ` 	         T.LRH_EVALUATE_STS        = D.LRH_EVALUATE_STS,	`;
                query += ` 	         T.LRH_EVALUATE_DATE       = D.LRH_EVALUATE_DATE,	`;
                query += ` 	         T.LRH_LEADER_RESULT       = D.LRH_LEADER_RESULT,	`;
                query += ` 	         T.LRH_LEADER_APP_BY       = D.LRH_LEADER_APP_BY,	`;
                query += ` 	         T.LRH_LEADER_APP_DATE     = D.LRH_LEADER_APP_DATE,	`;
                query += ` 	         T.LRH_LEADER_APP_FISCALYR = D.LRH_LEADER_APP_FISCALYR,	`;
                query += ` 	         T.LRH_LEADER_COMMENT      = D.LRH_LEADER_COMMENT,	`;
                query += ` 	         T.LRH_SUMIT_TO_SG         = D.LRH_SUMIT_TO_SG,	`;
                query += ` 	         T.LRH_SG_TYPE             = D.LRH_SG_TYPE,	`;
                query += ` 	         T.LRH_UPDATE_DATE         = D.LRH_UPDATE_DATE,	`;
                query += ` 	         T.LRH_UPDATE_BY           = D.LRH_UPDATE_BY,	`;
                query += ` 	         T.LRH_FILE_PATH           = D.LRH_FILE_PATH,	`;
                query += ` 	         T.LRH_REQ_TYPE            = D.LRH_REQ_TYPE,	`;
                query += ` 	         T.LRH_SG_NO               = D.LRH_SG_NO,	`;
                query += ` 	         T.LRH_LEADER_APP_MONTH    = D.LRH_LEADER_APP_MONTH,	`;
                query += ` 	         T.LRH_SEND_DATE           = D.LRH_SEND_DATE,	`;
                query += ` 	         T.LRH_REQ_TYPE_TEAM       = D.LRH_REQ_TYPE_TEAM	`;
                query += ` 	WHEN NOT MATCHED THEN	`;
                query += ` 	  INSERT	`;
                query += ` 	    (T.LRH_REQ_NO,	`;
                query += ` 	     T.LRH_FACTORY,	`;
                query += ` 	     T.LRH_COST_CENTER,	`;
                query += ` 	     T.LRH_REQ_DATE,	`;
                query += ` 	     T.LRH_REQ_EMP_TYPE,	`;
                query += ` 	     T.LRH_REQ_BY,	`;
                query += ` 	     T.LRH_REQ_NAME,	`;
                query += ` 	     T.LRH_REQ_SURNAME,	`;
                query += ` 	     T.LRH_REQ_PROCESS,	`;
                query += ` 	     T.LRH_REQ_POSITION,	`;
                query += ` 	     T.LRH_REQ_MANAGER,	`;
                query += ` 	     T.LRH_REQ_STATUS,	`;
                query += ` 	     T.LRH_FILENAME,	`;
                query += ` 	     T.LRH_FILESERVER,	`;
                query += ` 	     T.LRH_PROBLEM,	`;
                query += ` 	     T.LRH_DET_BEFORE,	`;
                query += ` 	     T.LRH_DET_AFTER,	`;
                query += ` 	     T.LRH_MH_OUTPUT,	`;
                query += ` 	     T.LRH_MH_FORECAST,	`;
                query += ` 	     T.LRH_MH_TSAVE,	`;
                query += ` 	     T.LRH_MC_WCODE,	`;
                query += ` 	     T.LRH_MC_WCOST,	`;
                query += ` 	     T.LRH_MC_TSAVE,	`;
                query += ` 	     T.LRH_EVALUATE_STS,	`;
                query += ` 	     T.LRH_EVALUATE_DATE,	`;
                query += ` 	     T.LRH_LEADER_RESULT,	`;
                query += ` 	     T.LRH_LEADER_APP_BY,	`;
                query += ` 	     T.LRH_LEADER_APP_DATE,	`;
                query += ` 	     T.LRH_LEADER_APP_FISCALYR,	`;
                query += ` 	     T.LRH_LEADER_COMMENT,	`;
                query += ` 	     T.LRH_SUMIT_TO_SG,	`;
                query += ` 	     T.LRH_SG_TYPE,	`;
                query += ` 	     T.LRH_CREATE_DATE,	`;
                query += ` 	     T.LRH_CREATE_BY,	`;
                query += ` 	     T.LRH_FILE_PATH,	`;
                query += ` 	     T.LRH_REQ_TYPE,	`;
                query += ` 	     T.LRH_SG_NO,	`;
                query += ` 	     T.LRH_LEADER_APP_MONTH,	`;
                query += ` 	     T.LRH_REQ_MONTH,	`;
                query += ` 	     T.LRH_SEND_DATE,	`;
                query += ` 	     T.LRH_REQ_TYPE_TEAM)	`;
                query += ` 	  VALUES	`;
                query += ` 	    (D.LRH_REQ_NO,	`;
                query += ` 	     D.LRH_FACTORY,	`;
                query += ` 	     D.LRH_COST_CENTER,	`;
                query += ` 	     D.LRH_REQ_DATE,	`;
                query += ` 	     D.LRH_REQ_EMP_TYPE,	`;
                query += ` 	     D.LRH_REQ_BY,	`;
                query += ` 	     D.LRH_REQ_NAME,	`;
                query += ` 	     D.LRH_REQ_SURNAME,	`;
                query += ` 	     D.LRH_REQ_PROCESS,	`;
                query += ` 	     D.LRH_REQ_POSITION,	`;
                query += ` 	     D.LRH_REQ_MANAGER,	`;
                query += ` 	     D.LRH_REQ_STATUS,	`;
                query += ` 	     D.LRH_FILENAME,	`;
                query += ` 	     D.LRH_FILESERVER,	`;
                query += ` 	     D.LRH_PROBLEM,	`;
                query += ` 	     D.LRH_DET_BEFORE,	`;
                query += ` 	     D.LRH_DET_AFTER,	`;
                query += ` 	     D.LRH_MH_OUTPUT,	`;
                query += ` 	     D.LRH_MH_FORECAST,	`;
                query += ` 	     D.LRH_MH_TSAVE,	`;
                query += ` 	     D.LRH_MC_WCODE,	`;
                query += ` 	     D.LRH_MC_WCOST,	`;
                query += ` 	     D.LRH_MC_TSAVE,	`;
                query += ` 	     D.LRH_EVALUATE_STS,	`;
                query += ` 	     D.LRH_EVALUATE_DATE,	`;
                query += ` 	     D.LRH_LEADER_RESULT,	`;
                query += ` 	     D.LRH_LEADER_APP_BY,	`;
                query += ` 	     D.LRH_LEADER_APP_DATE,	`;
                query += ` 	     D.LRH_LEADER_APP_FISCALYR,	`;
                query += ` 	     D.LRH_LEADER_COMMENT,	`;
                query += ` 	     D.LRH_SUMIT_TO_SG,	`;
                query += ` 	     D.LRH_SG_TYPE,	`;
                query += ` 	     D.LRH_CREATE_DATE,	`;
                query += ` 	     D.LRH_CREATE_BY,	`;
                query += ` 	     D.LRH_FILE_PATH,	`;
                query += ` 	     D.LRH_REQ_TYPE,	`;
                query += ` 	     D.LRH_SG_NO,	`;
                query += ` 	     D.LRH_LEADER_APP_MONTH,	`;
                query += ` 	     D.LRH_REQ_MONTH,	`;
                query += ` 	     D.LRH_SEND_DATE,	`;
                query += ` 	     D.LRH_REQ_TYPE_TEAM)	`;
                await connect.execute(query,
                    [LOCTno,
                        LRH_FACTORY,
                        LRH_COST_CENTER,
                        LRH_REQ_DATE,
                        LRH_REQ_EMP_TYPE,
                        LRH_REQ_BY,
                        LRH_REQ_NAME,
                        LRH_REQ_SURNAME,
                        LRH_REQ_PROCESS,
                        LRH_REQ_POSITION,
                        LRH_REQ_MANAGER,
                        LRH_REQ_STATUS,
                        LRH_FILENAME,
                        LRH_FILESERVER,
                        Subject,
                        LRH_DET_BEFORE,
                        LRH_DET_AFTER,
                        LRH_MH_OUTPUT,
                        LRH_MH_FORECAST,
                        LRH_MH_TSAVE,
                        LRH_MC_WCODE,
                        LRH_MC_WCOST,
                        LRH_MC_TSAVE,
                        LRH_EVALUATE_STS,
                        LRH_EVALUATE_DATE,
                        LRH_LEADER_RESULT,
                        LRH_LEADER_APP_BY,
                        LRH_LEADER_APP_DATE,
                        LRH_LEADER_APP_FISCALYR,
                        LRH_LEADER_COMMENT,
                        LRH_SUMIT_TO_SG,
                        LRH_SG_TYPE,
                        LRH_REQ_BY,
                        LRH_REQ_BY,
                        LRH_FILE_PATH,
                        LRH_REQ_TYPE,
                        SGTno,
                        LRH_LEADER_APP_MONTH,
                        LRH_REQ_STATUS,
                        LRH_REQ_TYPE_TEAM]);

                // if (LRH_SSH_FILE !== '') {
                //     await saveBase64ToFile(LRH_FILESERVER, LRH_SSH_FILE)
                // }


            } else if (LRH_REQ_TYPE === '5') {
                query = ``;
                query += ` 	MERGE INTO HR.SG_SUGGESTION_HEADER T	`;
                query += ` 	USING (SELECT :1 AS SSH_REQ_NO,	`;
                query += ` 	              :2 AS SSH_FACTORY,	`;
                query += ` 	              :3 AS SSH_COST_CENTER,	`;
                query += ` 	              :4 AS SSH_DEPT,	`;
                query += ` 	              :5 AS SSH_SECTION,	`;
                query += ` 	              SYSDATE AS SSH_REQ_DATE,	`;
                query += ` 	              :6 AS SSH_EMP_TYPE,	`;
                query += ` 	              :7 AS SSH_REQ_BY,	`;
                query += ` 	              :8 AS SSH_REQ_NAME,	`;
                query += ` 	              :9 AS SSH_REQ_SURNAME,	`;
                query += ` 	              :10 AS SSH_REQ_PROCESS,	`;
                query += ` 	              :11 AS SSH_REQ_POSITION,	`;
                query += ` 	              :12 AS SSH_REQ_MANAGER,	`;
                query += ` 	              :13 AS SSH_REQ_STATUS,	`;
                query += ` 	              :14 AS SSH_SUGGESTION_TYPE,	`;
                query += ` 	              :15 AS SSH_SUBJECT,	`;
                query += ` 	              :16 AS SSH_DET_BEFORE,	`;
                query += ` 	              :17 AS SSH_DET_SUGGESTION,	`;
                query += ` 	              SYSDATE AS SSH_CREATE_DATE,	`;
                query += ` 	              'SGT' AS SSH_CREATE_BY,	`;
                query += ` 	              SYSDATE AS SSH_UPDATE_DATE,	`;
                query += ` 	              'SGT' AS SSH_UPDATE_BY,	`;
                query += ` 	              :18 AS SSH_REQ_TYPE,	`;
                query += ` 	              :19 AS SSH_FILENAME,	`;
                query += ` 	              :20 AS SSH_MH_TSAVE,	`;
                query += ` 	              :21 AS SSH_MC_TSAVE,	`;
                query += ` 	              :22 AS SSH_FILESERVER,	`;
                query += ` 	              :23 AS SSH_TEAM,	`;
                query += ` 	              :24 AS SSH_SV_APP_BY	`;
                query += ` 	         FROM DUAL) D	`;
                query += ` 	ON (T.SSH_REQ_NO = D.SSH_REQ_NO)	`;
                query += ` 	WHEN MATCHED THEN	`;
                query += ` 	  UPDATE	`;
                query += ` 	     SET T.SSH_FACTORY         = D.SSH_FACTORY,	`;
                query += ` 	         T.SSH_COST_CENTER     = D.SSH_COST_CENTER,	`;
                query += ` 	         T.SSH_DEPT            = D.SSH_DEPT,	`;
                query += ` 	         T.SSH_SECTION         = D.SSH_SECTION,	`;
                query += ` 	         T.SSH_EMP_TYPE        = D.SSH_EMP_TYPE,	`;
                query += ` 	         T.SSH_REQ_BY          = D.SSH_REQ_BY,	`;
                query += ` 	         T.SSH_REQ_NAME        = D.SSH_REQ_NAME,	`;
                query += ` 	         T.SSH_REQ_SURNAME     = D.SSH_REQ_SURNAME,	`;
                query += ` 	         T.SSH_REQ_PROCESS     = D.SSH_REQ_PROCESS,	`;
                query += ` 	         T.SSH_REQ_POSITION    = D.SSH_REQ_POSITION,	`;
                query += ` 	         T.SSH_REQ_MANAGER     = D.SSH_REQ_MANAGER,	`;
                query += ` 	         T.SSH_REQ_STATUS      = D.SSH_REQ_STATUS,	`;
                query += ` 	         T.SSH_SUGGESTION_TYPE = D.SSH_SUGGESTION_TYPE,	`;
                query += ` 	         T.SSH_SUBJECT         = D.SSH_SUBJECT,	`;
                query += ` 	         T.SSH_DET_BEFORE      = D.SSH_DET_BEFORE,	`;
                query += ` 	         T.SSH_DET_SUGGESTION  = D.SSH_DET_SUGGESTION,	`;
                query += ` 	         T.SSH_UPDATE_DATE     = D.SSH_UPDATE_DATE,	`;
                query += ` 	         T.SSH_UPDATE_BY       = D.SSH_UPDATE_BY,	`;
                query += ` 	         T.SSH_REQ_TYPE        = D.SSH_REQ_TYPE,	`;
                query += ` 	         T.SSH_FILENAME        = D.SSH_FILENAME,	`;
                query += ` 	         T.SSH_MH_TSAVE        = D.SSH_MH_TSAVE,	`;
                query += ` 	         T.SSH_MC_TSAVE        = D.SSH_MC_TSAVE,	`;
                query += ` 	         T.SSH_FILESERVER      = D.SSH_FILESERVER,	`;
                query += ` 	         T.SSH_TEAM            = D.SSH_TEAM,	`;
                query += ` 	         T.SSH_SV_APP_BY       = D.SSH_SV_APP_BY	`;
                query += ` 	WHEN NOT MATCHED THEN	`;
                query += ` 	  INSERT	`;
                query += ` 	    (T.SSH_REQ_NO,	`;
                query += ` 	     T.SSH_FACTORY,	`;
                query += ` 	     T.SSH_COST_CENTER,	`;
                query += ` 	     T.SSH_DEPT,	`;
                query += ` 	     T.SSH_SECTION,	`;
                query += ` 	     T.SSH_REQ_DATE,	`;
                query += ` 	     T.SSH_EMP_TYPE,	`;
                query += ` 	     T.SSH_REQ_BY,	`;
                query += ` 	     T.SSH_REQ_NAME,	`;
                query += ` 	     T.SSH_REQ_SURNAME,	`;
                query += ` 	     T.SSH_REQ_PROCESS,	`;
                query += ` 	     T.SSH_REQ_POSITION,	`;
                query += ` 	     T.SSH_REQ_MANAGER,	`;
                query += ` 	     T.SSH_REQ_STATUS,	`;
                query += ` 	     T.SSH_SUGGESTION_TYPE,	`;
                query += ` 	     T.SSH_SUBJECT,	`;
                query += ` 	     T.SSH_DET_BEFORE,	`;
                query += ` 	     T.SSH_DET_SUGGESTION,	`;
                query += ` 	     T.SSH_CREATE_DATE,	`;
                query += ` 	     T.SSH_CREATE_BY,	`;
                query += ` 	     T.SSH_UPDATE_DATE,	`;
                query += ` 	     T.SSH_UPDATE_BY,	`;
                query += ` 	     T.SSH_REQ_TYPE,	`;
                query += ` 	     T.SSH_FILENAME,	`;
                query += ` 	     T.SSH_MH_TSAVE,	`;
                query += ` 	     T.SSH_MC_TSAVE,	`;
                query += ` 	     T.SSH_FILESERVER,	`;
                query += ` 	     T.SSH_TEAM,	`;
                query += ` 	     T.SSH_SV_APP_BY)	`;
                query += ` 	  VALUES	`;
                query += ` 	    (D.SSH_REQ_NO,	`;
                query += ` 	     D.SSH_FACTORY,	`;
                query += ` 	     D.SSH_COST_CENTER,	`;
                query += ` 	     D.SSH_DEPT,	`;
                query += ` 	     D.SSH_SECTION,	`;
                query += ` 	     D.SSH_REQ_DATE,	`;
                query += ` 	     D.SSH_EMP_TYPE,	`;
                query += ` 	     D.SSH_REQ_BY,	`;
                query += ` 	     D.SSH_REQ_NAME,	`;
                query += ` 	     D.SSH_REQ_SURNAME,	`;
                query += ` 	     D.SSH_REQ_PROCESS,	`;
                query += ` 	     D.SSH_REQ_POSITION,	`;
                query += ` 	     D.SSH_REQ_MANAGER,	`;
                query += ` 	     D.SSH_REQ_STATUS,	`;
                query += ` 	     D.SSH_SUGGESTION_TYPE,	`;
                query += ` 	     D.SSH_SUBJECT,	`;
                query += ` 	     D.SSH_DET_BEFORE,	`;
                query += ` 	     D.SSH_DET_SUGGESTION,	`;
                query += ` 	     D.SSH_CREATE_DATE,	`;
                query += ` 	     D.SSH_CREATE_BY,	`;
                query += ` 	     D.SSH_UPDATE_DATE,	`;
                query += ` 	     D.SSH_UPDATE_BY,	`;
                query += ` 	     D.SSH_REQ_TYPE,	`;
                query += ` 	     D.SSH_FILENAME,	`;
                query += ` 	     D.SSH_MH_TSAVE,	`;
                query += ` 	     D.SSH_MC_TSAVE,	`;
                query += ` 	     D.SSH_FILESERVER,	`;
                query += ` 	     D.SSH_TEAM,	`;
                query += ` 	     D.SSH_SV_APP_BY)	`;
                await connect.execute(query, [
                    SGTno,
                    LRH_FACTORY_CODE,
                    LRH_COST_CENTER,
                    '',
                    '',
                    LRH_REQ_EMP_TYPE,
                    LRH_REQ_BY,
                    LRH_REQ_NAME,
                    LRH_REQ_SURNAME,
                    LRH_REQ_PROCESS,
                    LRH_REQ_POSITION,
                    LRH_REQ_MANAGER_NAME,
                    LRH_REQ_STATUS,
                    LRH_SG_TYPE,
                    Subject,
                    LRH_DET_BEFORE,
                    LRH_DET_AFTER,
                    SSH_REQ_TYPE,
                    LRH_FILENAME,
                    LRH_MH_TSAVE,
                    LRH_MC_TSAVE,
                    LRH_FILESERVER,
                    SSH_TEAM_NAME,
                    SSH_SV_APP_BY
                ]);

                query = ``;
                query += ` DELETE HR.SG_SUGGESTION_TEAM T WHERE T.SST_REQ_NO = :1 `;
                await connect.execute(query, [SGTno]);


                let calMHR = 0;
                if (SSH_MEMBER_TEAM.length > 0) {
                    calMHR = LRH_MH_TSAVE / SSH_MEMBER_TEAM.length
                }

                for (const item of SSH_MEMBER_TEAM) {
                    const { T_EMP_ID, T_EMP_JOBGRAD, T_EMP_CC } = item;
                    query = ``;
                    query += ` INSERT INTO HR.SG_SUGGESTION_TEAM T `;
                    query += `   (T.SST_REQ_NO, `;
                    query += `    T.SST_EMP_ID, `;
                    query += `    T.SST_POS_GRADE, `;
                    query += `    T.SST_COST_CENTER, `;
                    query += `    T.SST_SAVE_MHR, `;
                    query += `    T.SST_CREATE_DATE, `;
                    query += `    T.SST_CREATE_BY, `;
                    query += `    T.SST_UPDATE_DATE, `;
                    query += `    T.SST_UPDATE_BY) `;
                    query += ` VALUES `;
                    query += `   (:1, :2, :3, :4, :5, SYSDATE, :6, SYSDATE, :6) `;
                    await connect.execute(query, [SGTno, T_EMP_ID, T_EMP_JOBGRAD, T_EMP_CC, calMHR, LRH_REQ_BY]);
                }

                // if (LRH_SSH_FILE !== '') {
                //     await uploadFileFTP(LRH_FILESERVER, LRH_SSH_FILE)
                // }

            }
        }

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


async function getMaxLOCTLoop(P_FACTORY, P_CC, P_RUN) {
    try {

        const connect = await ConnectOracleDB("HR");
        let query = "";
        query += ` 	SELECT CASE MAX(SUBSTR(T.LRH_REQ_NO, 5, 2))	`;
        query += ` 	         WHEN TO_CHAR(SYSDATE, 'YY') THEN		`;
        query += ` 	          CASE		`;
        query += ` 	           LENGTH(TO_NUMBER(MAX(SUBSTR(T.LRH_REQ_NO, LENGTH(T.LRH_REQ_NO) - 5))) + ${P_RUN})		`;
        query += ` 	            WHEN 1 THEN		`;
        query += ` 	             'L' || '${P_FACTORY}' || '-' || TO_CHAR(SYSDATE, 'YY') || '-' || '${P_CC}' || '-' ||'00000' ||		`;
        query += ` 	             TO_NUMBER(MAX(SUBSTR(T.LRH_REQ_NO, LENGTH(T.LRH_REQ_NO) - 5)) + ${P_RUN})		`;
        query += ` 	            WHEN 2 THEN		`;
        query += ` 	             'L' || '${P_FACTORY}' || '-' || TO_CHAR(SYSDATE, 'YY') || '-' || '${P_CC}' || '-' ||'0000' ||		`;
        query += ` 	             TO_NUMBER(MAX(SUBSTR(T.LRH_REQ_NO, LENGTH(T.LRH_REQ_NO) - 5)) + ${P_RUN})		`;
        query += ` 	            WHEN 3 THEN		`;
        query += ` 	             'L' || '${P_FACTORY}' || '-' || TO_CHAR(SYSDATE, 'YY') || '-' || '${P_CC}' || '-' ||'000' ||		`;
        query += ` 	             TO_NUMBER(MAX(SUBSTR(T.LRH_REQ_NO, LENGTH(T.LRH_REQ_NO) - 5)) + ${P_RUN})		`;
        query += ` 	            WHEN 4 THEN		`;
        query += ` 	             'L' || '${P_FACTORY}' || '-' || TO_CHAR(SYSDATE, 'YY') || '-' || '${P_CC}' || '-' || '00' ||		`;
        query += ` 	             TO_NUMBER(MAX(SUBSTR(T.LRH_REQ_NO, LENGTH(T.LRH_REQ_NO) - 5)) + ${P_RUN})		`;
        query += ` 	            WHEN 5 THEN		`;
        query += ` 	             'L' || '${P_FACTORY}' || '-' || TO_CHAR(SYSDATE, 'YY') || '-' || '${P_CC}' || '-' || '0' ||		`;
        query += ` 	             TO_NUMBER(MAX(SUBSTR(T.LRH_REQ_NO, LENGTH(T.LRH_REQ_NO) - 5)) + ${P_RUN})		`;
        query += ` 	            ELSE		`;
        query += ` 	             'L' || '${P_FACTORY}' || '-' || TO_CHAR(SYSDATE, 'YY') || '-' || '${P_CC}' || '-' ||		`;
        query += ` 	             TO_NUMBER(MAX(SUBSTR(T.LRH_REQ_NO, LENGTH(T.LRH_REQ_NO) - 5)) + ${P_RUN})		`;
        query += ` 	          END		`;
        query += ` 	         ELSE		`;
        query += ` 	          'L' || '${P_FACTORY}' || '-' || TO_CHAR(SYSDATE, 'YY') || '-' || '${P_CC}' || '-' || '000001'		`;
        query += ` 	       END AS MAX_RUNNING_LOCT		`;
        query += ` 	  FROM LOCT_REQUEST_HEADER T		`;
        query += ` 	 WHERE T.LRH_FACTORY = '${P_FACTORY}'		`;
        query += ` 	   AND T.LRH_COST_CENTER = '${P_CC}'		`;
        const result = await connect.execute(query);
        DisconnectOracleDB(connect);
        const row = result.rows[0];
        return row[0];
    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        return '';
    }
};

async function getMaxSGTLoop(P_FACTORY_CODE, P_CC, P_RUN) {
    try {

        const connect = await ConnectOracleDB("HR");
        let query = "";
        query += `   SELECT CASE MAX(SUBSTR(T.SSH_REQ_NO, LENGTH(T.SSH_REQ_NO) - 9, 4))  `;
        query += `            WHEN TO_CHAR(SYSDATE, 'YYYY') THEN `;
        query += `             CASE  `;
        query += `              LENGTH(TO_NUMBER(MAX(SUBSTR(T.SSH_REQ_NO, LENGTH(T.SSH_REQ_NO) - 4))) + ${P_RUN}) `;
        query += `               WHEN 1 THEN `;
        query += `                '${P_FACTORY_CODE}' || '/' || '${P_CC}' || '/' || TO_CHAR(SYSDATE, 'YYYY') || '/' || '0000' || `;
        query += `                TO_NUMBER(MAX(SUBSTR(T.SSH_REQ_NO, LENGTH(T.SSH_REQ_NO) - 4)) + ${P_RUN}) `;
        query += `               WHEN 2 THEN `;
        query += `                '${P_FACTORY_CODE}' || '/' || '${P_CC}' || '/' || TO_CHAR(SYSDATE, 'YYYY') || '/' || '000' ||  `;
        query += `                TO_NUMBER(MAX(SUBSTR(T.SSH_REQ_NO, LENGTH(T.SSH_REQ_NO) - 4)) + ${P_RUN}) `;
        query += `               WHEN 3 THEN `;
        query += `                '${P_FACTORY_CODE}' || '/' || '${P_CC}' || '/' || TO_CHAR(SYSDATE, 'YYYY') || '/' || '00' || `;
        query += `                TO_NUMBER(MAX(SUBSTR(T.SSH_REQ_NO, LENGTH(T.SSH_REQ_NO) - 4)) + ${P_RUN}) `;
        query += `               WHEN 4 THEN `;
        query += `                '${P_FACTORY_CODE}' || '/' || '${P_CC}' || '/' || TO_CHAR(SYSDATE, 'YYYY') || '/' || '0' ||  `;
        query += `                TO_NUMBER(MAX(SUBSTR(T.SSH_REQ_NO, LENGTH(T.SSH_REQ_NO) - 4)) + ${P_RUN}) `;
        query += `               ELSE  `;
        query += `                '${P_FACTORY_CODE}' || '/' || '${P_CC}' || '/' || TO_CHAR(SYSDATE, 'YYYY') || '/' || '-' ||  `;
        query += `                TO_NUMBER(MAX(SUBSTR(T.SSH_REQ_NO, LENGTH(T.SSH_REQ_NO) - 4)) + ${P_RUN}) `;
        query += `             END `;
        query += `            ELSE `;
        query += `             '${P_FACTORY_CODE}' || '/' || '${P_CC}' || '/' || TO_CHAR(SYSDATE, 'YYYY') || '/' || '00001'  `;
        query += `          END AS MAX_RUNNING `;
        query += `     FROM SG_SUGGESTION_HEADER T `;
        query += `    WHERE T.SSH_FACTORY = '${P_FACTORY_CODE}' `;
        query += `      AND T.SSH_COST_CENTER = '${P_CC}'   `;
        query += `      AND (SUBSTR(T.SSH_REQ_NO, LENGTH(T.SSH_REQ_NO) - 9, 4)) = TO_CHAR(SYSDATE, 'YYYY')`;
        const result = await connect.execute(query);
        DisconnectOracleDB(connect);
        const row = result.rows[0];
        return row[0];

    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        return '';
    }
};

module.exports.getSup_SGTCheck = async function (req, res) {
    try {
        const P_FACTORY = req.query.P_FACTORY
        const P_CC = req.query.P_CC
        const P_EMP = req.query.P_EMP
        const connect = await ConnectOracleDB("HR");
        let query = "";
        query += ` SELECT T.SPM_USER_LOGIN `;
        query += `   FROM SG_PERSON_MASTER T, CUSR.CU_USER_M CU `;
        query += `  WHERE T.SPM_EMP_ID = CU.USER_EMP_ID `;
        query += `    AND T.SPM_PERSON_STS = 'A' `;
        query += `    AND T.SPM_LEVEL = 'PLV001' `;
        query += `    AND T.SPM_FACTORY = '${P_FACTORY}' `;
        query += `    AND T.SPM_COSTCENTER = '${P_CC}' `;
        query += `    AND T.SPM_EMP_ID = '${P_EMP}' `;
        query += `  ORDER BY CU.USER_FNAME `;


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