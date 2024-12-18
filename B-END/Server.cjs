const express = require("express");
const bodyParser = require('body-parser');
const { Client } = require("pg");
const cors = require('cors');
const app = express();
const port = 3001;
require('dotenv').config();

const serverLogin = require("./Login/Login.cjs");
const serverCommon = require("./Common/Common.cjs");
const serverTransaction = require("./Transaction/Transaction.cjs");
const serverReportSummary = require("./Report/SummaryRPT.cjs");
const serverReportDetail = require("./Report/DetailRPT.cjs");

function checkBasicAuth(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).send('Authorization header is missing');
    }
  
    const [type, credentials] = authHeader.split(' ');
  
    if (type !== 'Basic' || !credentials) {
        return res.status(401).send('Invalid authorization header format');
    }
  
    const decodedCredentials = Buffer.from(credentials, 'base64').toString('utf8');
    const [username, password] = decodedCredentials.split(':');
  
    // ตรวจสอบ username และ password ที่ได้รับจาก Basic Auth
    if (username !== process.env.BASIC_AUTHORIZATION_USER || password !== process.env.BASIC_AUTHORIZATION_PASS) {
        return res.status(401).send('Invalid credentials');
    }
  
    next();
  }
  app.use(cors());
  app.use(checkBasicAuth);
  app.use(bodyParser.urlencoded({ limit: '50mb',extended: true }));
  app.use(bodyParser.json({ limit: '50mb' }));
  
  app.use(express.json());
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader('Content-Type', 'application/json');
    next();
  });

  app.get("/login/getLoginHR", serverLogin.getLoginHR);

  app.get("/common/getFactory", serverCommon.getFactory);
  app.get("/common/getCostCenter", serverCommon.getCostCenterLOCT);
  app.get("/common/getStatusLOCT", serverCommon.getStatusLOCT);

  app.get("/transaction/getDataMain", serverTransaction.getDataMain);
  app.get("/transaction/getSGT_Type", serverTransaction.getSGT_Type);
  app.get("/transaction/getDataEmp", serverTransaction.getDataEmp);
  app.get("/transaction/getSup_SGT", serverTransaction.getSup_SGT);
  app.get("/transaction/getDataDetail", serverTransaction.getDataDetail);


  app.post("/transaction/MergHeader", serverTransaction.MergHeader);
  app.post("/transaction/delLOCT_IECT", serverTransaction.delLOCT_IECT);
  app.post("/transaction/approveLOCT_IECT", serverTransaction.approveLOCT_IECT);
  //app.post("/transaction/testSFTP", serverTransaction.testFTP);
  // app.get("/transaction/getDataDetailTeam", serverTransaction.getDataDetailTeam);
  app.get("/transaction/getSup_SGTCheck", serverTransaction.getSup_SGTCheck);
  app.post("/transaction/ImportLOCT", serverTransaction.ImportLOCTV2);


  app.get("/report/rptSummaryFactory", serverReportSummary.rptSummaryFactory);
  app.get("/report/rptSummaryCC", serverReportSummary.rptSummaryCC);
  app.get("/report/rptSummaryCenter", serverReportSummary.rptSummaryCenter);
  app.get("/report/rptSummaryLeader", serverReportSummary.rptSummaryLeader);

  app.get("/report/rptDetailLeader", serverReportDetail.rptDetailLeader);
  app.get("/report/rptDetailOperator", serverReportDetail.rptDetailOperator);
  app.get("/report/getTeamDetail", serverReportDetail.getTeamDetail);
  app.get("/report/getCheckRole", serverReportDetail.getCheckRole);
  app.get("/report/dataHeaderPrint", serverReportDetail.dataHeaderPrint);
  app.get("/report/dataDetailPrint", serverReportDetail.dataDetailPrint);

  app.post("/report/setTeamDetail", serverReportDetail.setTeamDetail);

  
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });