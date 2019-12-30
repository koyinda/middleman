require('dotenv').config();
const express = require("express");
const app = express();
const bodyParser = require('body-parser')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const middleware = require("./middleware");
const connection = require("./config/database");
const {checkToken} = require("./auth/token_validation");

app.set("view engine", "ejs");
app.use(express.static(__dirname+"/public"));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());


app.get("/", function(req, res){
  res.render("landing");
});

app.get("/register", function(req, res){
  res.render("register");
});
app.post("/register", function(req, res){
  const eKey = req.body.key;
  if(eKey && eKey.toLowerCase() === process.env.secretkey.toLowerCase() )
  {
    const salt = bcrypt.genSaltSync(10);
    req.body.password = bcrypt.hashSync(req.body.password, salt);
    const newUser = [
      req.body.username,
      req.body.password,
      1,
    ];
    const insertSql = 'INSERT INTO authUsers (USERNAME, PASSWORD, USERACTIVE, DateCreated) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR))'
    connection.query({sql: insertSql,timeout: 40000 },newUser, function (error, results, fields) {
      if (error)
      {
        console.log(error)
        console.log("something is not right");
        return res.redirect("/register");
      }
      else
      {
        console.log(results);
        return res.redirect("/");
        //res.send( JSON.parse(JSON.stringify(results)));
      }
        
    });
  }
  else
  {
    res.send("no key mehn! or maybe you are not an Harry Potter Fan");
  }
  //res.send("register");
});

app.get("/login", function(req, res){
  res.render("login");
});

app.post("/login", function(req, res){
    const querySql = 'select * from authUsers where username = ?'
    connection.query({sql: querySql,timeout: 40000 },req.body.username, function (error, results, fields) {
      if (error || results.length == 0)
      {
        console.log(error)
        console.log("something is not right");
        return res.json({
          status: 99,
          message: "login in failed"
        });
        
      }
      else
      {
        const match = bcrypt.compareSync(req.body.password, results[0].PASSWORD);
        if(match)
        {
          results[0].PASSWORD=undefined;
          const jt = jwt.sign({match: results}, process.env.keysecond, {
            expiresIn: '1h'
          });
          return res.json({
            status: 00,
            message: "login successful",
            token: jt
          });
        }
        else{
          return res.json({
            status: 99,
            message: "login in failed"
          });
        }

      }
        
    });
});


app.get("/api/getuserdet/:id", checkToken, function(req, res){
    const querySql = 'select * from users, userdetails, autoregaccounts where users.USERINDEX = userdetails.USERINDEX and users.PRODUCTINDEX = autoregaccounts.AUTOREGACCOUNTINDEX and users.USERID = ?'
    connection.query({sql: querySql,timeout: 40000 },req.params.id, function (error, results, fields) {
      if (error)
      {
        console.log(error)
        console.log("something is not right");
          return res.json({
            status: 99,
            message: "please check that user id, it seems invalid"
        });
      }
      else
      {
        //res.redirect("/");
        res.send( JSON.parse(JSON.stringify(results)));
      }
        
    });
});


app.get("/api/getbankdet/:id", checkToken, function(req, res){
  const querySql = 'select users.USERID, bankinstances.BANKTYPEINDEX, bankinstances.BALANCE, bankinstances.ACCUMULATEDUSAGE, bankinstances.VALIDITYDATE from users, bankinstances, autoregaccounts where bankinstances.CRMSYSTEMID = users.USERINDEX and SUBSTRING_INDEX(autoregaccounts.BANK1, ":", 1) = bankinstances.BANKTYPEINDEX and users.PRODUCTINDEX = autoregaccounts.AUTOREGACCOUNTINDEX and users.USERID = ? order by bankinstances.VALIDITYDATE desc'
  connection.query({sql: querySql,timeout: 40000 },req.params.id, function (error, results, fields) {
    if (error || results.length ==0)
    {
      console.log(error)
        return res.json({
          status: 99,
          message: "please check that user id, it seems invalid"
      });
    }
    else
    {
      //res.redirect("/");
      return res.send( JSON.parse(JSON.stringify(results)));
    }
      
  });
});

app.get("/api/getfreebankdet/:id", checkToken, function(req, res){
  const querySql = 'select users.USERID, bankinstances.BANKTYPEINDEX, bankinstances.BALANCE, bankinstances.ACCUMULATEDUSAGE, bankinstances.VALIDITYDATE from users, bankinstances where bankinstances.CRMSYSTEMID = users.USERINDEX and bankinstances.BANKTYPEINDEX = 114 and users.USERID = ? order by bankinstances.VALIDITYDATE desc'
  connection.query({sql: querySql,timeout: 40000 },req.params.id, function (error, results, fields) {
    if (error || results.length ==0)
    {
      console.log(error)
        return res.json({
          status: 99,
          message: "please check that user id, it seems invalid"
      });
    }
    else
    {
      //res.redirect("/");
      return res.send( JSON.parse(JSON.stringify(results)));
    }
      
  });
});


app.post("/api/updateuserdet/:id", checkToken, function(req, res){
    
    middleware.getuserindex(req.params.id, (err, results) =>{
        if(err || results.length ==0) 
        {
          return res.json({
                status: 99,
                message: "please check that user id, it seems invalid"
            });
        }
        else
        {
          //console.log("2")
          const update = [
            req.body.dnd,
            req.body.email,
            req.body.number,
            req.body.address,
            results[0].USERINDEX
          ];
          //console.log(update)
          const querySql = 'update userdetails set custominfo27=?, email=?, mobile=?, address1=? where userindex = ?'
          connection.query({sql: querySql,timeout: 40000 },update, function (error, results, fields) {
              if (error)
              {
                console.log(error || results.length ==0)
                console.log("something is not right");
                  return res.json({
                    status: 99,
                    message: "please check that user id, it seems invalid"
                });
              }
              else
              {
                return res.json({
                  status: 00,
                  message: "entry successfully updated"
              });

              }
                
            });
        }

    });
});

app.get("/api/getplanlist/:id", checkToken, function(req, res){
  const querySql = 'select autoregaccounts.AUTOREGACCOUNTINDEX, autoregaccounts.AUTOREGACCOUNTNAME,autoregaccounts.description from users, accountsswitchfees, autoregaccounts where users.PRODUCTINDEX = accountsswitchfees.ORIGACCOUNTINDEX and accountsswitchfees.USERIMMEDIATE = 1 and autoregaccounts.AUTOREGACCOUNTINDEX = accountsswitchfees.DESTACCOUNTINDEX and users.USERID = ?'
  connection.query({sql: querySql,timeout: 40000 },req.params.id, function (error, results, fields) {
    if (error || results.length ==0)
    {
      console.log(error)
      console.log("something is not right");
      return res.json({
        status: 99,
        message: "please check that user id, it seems invalid"
      });
    }
    else
    {
      res.send( JSON.parse(JSON.stringify(results)));
    }
      
  });
});

app.get("/api/usagehistory/:id", checkToken, function(req, res){
    
  middleware.getuserindex(req.params.id, (err, results) =>{
      if(err || results.length ==0) 
      {
        return res.json({
              status: 99,
              message: "please check that user id, it seems invalid"
          });
      }
      else
      {
        //console.log("2")
        const update = [
          req.body.start,
          req.body.end,
          results[0].USERINDEX
        ];
        //console.log(update)
        const querySql = 'Select DATE_SUB(aclog.ACCTDATE, INTERVAL (aclog.ACCTSESSIONTIME) SECOND) StartDate, aclog.ACCTDATE EndDate, users.USERID USERID, aclog.IMSI IMSI, INET_NTOA(aclog.framedaddress) IP, round((aclog.ACCTTOTALOCTETS)/(1024*1024),2) MBUsed FROM accountinglog aclog JOIN users ON users.USERINDEX=aclog.USERID where 1=1 and date(aclog.ACCTDATE) between date(?) and date(?) and aclog.userid= ? order by aclog.ACCTDATE desc'
        connection.query({sql: querySql,timeout: 40000 },update, function (error, results, fields) {
            if (error || results.length ==0)
            {
              console.log(error)
              console.log("something is not right");
                return res.json({
                  status: 99,
                  message: "please check that user id, it seems invalid"
              });
            }
            else
            {
              res.send( JSON.parse(JSON.stringify(results)));

            }
              
          });
      }

  });
});

app.get("/api/paymenthistory/:id", checkToken, function(req, res){
    
  middleware.getuserindex(req.params.id, (err, results) =>{
      if(err || results.length ==0) 
      {
        return res.json({
              status: 99,
              message: "please check that user id, it seems invalid"
          });
      }
      else
      {
       // console.log(results)
        const update = [
          results[0].USERINDEX,
          req.body.start,
          req.body.end
        ];
       // console.log(update)
        const querySql = 'select payments.CREATEDATE,users.USERID, paymentmethods.METHODNAME, payments.AMOUNT from payments, paymentmethods, users where payments.USERINDEX = users.USERINDEX and paymentmethods.METHODINDEX = payments.PAYMENTMETHOD and users.USERINDEX = ? and payments.createdate between date(?) and date(?) order by payments.createdate desc'
        connection.query({sql: querySql,timeout: 40000 },update, function (error, results, fields) {
            if (error)
            {
              console.log(error || results.length ==0)
              console.log("something is not right");
                return res.json({
                  status: 99,
                  message: "please check that user id, it seems invalid"
              });
            }
            else
            {
              res.send( JSON.parse(JSON.stringify(results)));

            }
              
          });
      }

  });
});

app.get("/api/speed/:id", checkToken, function(req, res){
  const querySql = 'select users.userid, users.speed from users where users.USERID = ?'
  connection.query({sql: querySql,timeout: 40000 },req.params.id, function (error, results, fields) {
    if (error)
    {
      console.log(error)
      console.log("something is not right");
        return res.json({
          status: 99,
          message: "please check that user id, it seems invalid"
      });
    }
    else
    {
      //res.redirect("/");
      res.send( JSON.parse(JSON.stringify(results)));
    }
      
  });
});

app.post("/api/speed/:id", checkToken, function(req, res){
  
  middleware.getuserindex(req.params.id, (err, results) =>{
      if(err || results.length ==0) 
      {
        return res.json({
              status: 99,
              message: "please check that user id, it seems invalid"
          });
      }
      else
      {
        //console.log("2")
        const update = [
          req.body.speed,
          results[0].USERINDEX
        ];
        //console.log(update)
        const querySql = 'update users set speed=? where userindex = ?'
        connection.query({sql: querySql,timeout: 40000 },update, function (error, results, fields) {
            if (error|| results.length ==0)
            {
              console.log(error)
              console.log("something is not right");
                return res.json({
                  status: 99,
                  message: "please check that user id, it seems invalid"
              });
            }
            else
            {
              return res.json({
                status: 00,
                message: "entry successfully updated"
            });

            }
              
          });
      }

  });
});

app.post("/api/postpayment", checkToken, function(req, res){
  
  middleware.getuserindex(req.body.userid, (err, results) =>{
      if(err || results.length ==0) 
      {
        return res.json({
            status: 99,
            message: "please check that user id, it seems invalid"
        });
      }
      else
      {

        const insert = [
          req.body.paymentmethod,
          results[0].USERINDEX,
          req.body.amount,
          req.body.paymentreference,
          req.body.transactionid,
          req.body.transactionid,
          req.body.amount,
        ];
        const update = [
          req.body.amount,
          results[0].USERINDEX
        ]
 
        connection.beginTransaction(function(err) {
          if (err) { throw err; }
          const querySql = 'insert into `payments`(`PAYMENTMETHOD`,`CREATEDATE`,`USERTYPE`,`USERINDEX`,`AMOUNT`,`REMARK`,`EXPORTED1`,`STATUS`,`WEBPAYMENTTYPE`,`UUID`,`PAYMENTID`,`PAYMENTAMOUNT`,`PAYMENTCURRENCYRATE`) values (?,DATE_ADD(NOW(), INTERVAL 1 HOUR),1,?,?,?,1,0,"",?,?,?,1)'
          connection.query({sql: querySql,timeout: 40000 },insert, function (error, results, fields) {
                if (error)
                {
                    connection.rollback(function() {
                        console.log(error);
                    });
                    return res.json({
                        status: 99,
                        message: error.message
                    });
                }
                const updateSql = 'update users set userpaymentbalance = (userpaymentbalance + ?) where userindex = ?'
                connection.query({sql: updateSql,timeout: 40000 },update, function (error, results, fields) {
                    if (error) {
                        connection.rollback(function() {
                          //throw error;
                          console.log(error);
                      });
                      return res.json({
                          status: 99,
                          message: error.message
                      });
                    }
                    connection.commit(function(err) {
                        if (err) {
                            connection.rollback(function() {
                                //throw error;
                                console.log(error);
                            });
                            return res.json({
                                status: 99,
                                message: err.message
                            });
                        }
                        return res.json({
                            status: 00,
                            message: "entry successfully updated"
                        });
                        //console.log('success!');
                    });
                });      
            });
        });
      }

  });
});


app.post("/api/activateplan", checkToken, function(req, res){

    const queryd = [
      req.body.planindex,
      req.body.userid
    ]
  
    const querySql = 'select users.USERID, users.USERINDEX, users.USERPAYMENTBALANCE, autoregaccounts.PRICE, autoregaccounts.NUMOFDAYS, autoregaccounts.BANK1,accountsswitchfees.ACCOUNTRESETREMAINBANK from users, autoregaccounts, accountsswitchfees where users.PRODUCTINDEX= accountsswitchfees.ORIGACCOUNTINDEX and accountsswitchfees.DESTACCOUNTINDEX = ? and accountsswitchfees.DESTACCOUNTINDEX = autoregaccounts.AUTOREGACCOUNTINDEX and accountsswitchfees.USERIMMEDIATE = 1 and users.USERID =?'
    connection.query({sql: querySql,timeout: 40000 },queryd, function (error, results, fields) {
      if (error || results.length == 0 || results[0].USERPAYMENTBALANCE < results[0].PRICE)
      {
          return res.json({
            status: 99,
            message: "planswitch is not posible, or insufficient balance"
        });
      }
      else
      {
          //debitdata
          middleware.renew(results[0].USERINDEX,req.body.planindex, results[0].PRICE,results[0].NUMOFDAYS, results[0].BANK1, results[0].ACCOUNTRESETREMAINBANK,(err, results) =>{
            if(err) 
            {
              return res.json({
                  status: 99,
                  message: err.message
              });
            }
            else
            {
                return res.json({
                  status: 00,
                  message: "oh wow, it worked, plan activated successfully"
              });
            }
      });
    }
      
  });
});



var port = process.env.PORT || 3000;
app.listen(port, function () {
  console.log("Server Has Started!");
});