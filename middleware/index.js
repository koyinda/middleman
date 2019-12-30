const connection = require("../config/database");


module.exports = {
    getuserindex :(id, callBack) =>
    {   
        const query1 = 'select USERINDEX from users where USERID = ?'
        connection.query({sql: query1,timeout: 40000 },[id], (error, results, fields) => 
        {
            if (error)
            {
                console.log("something is not right 2");
                callBack(error);
            }
                return callBack(null, results);
            
        });
    },
    renew: (ind, planindex, price, numDay, bank, rollover, callBack) =>
    {
        const b1 = [
            price,
            numDay,
            planindex,
            ind,
        ]
        
      connection.beginTransaction(function(err) {
        if (err) { throw err; }
        var query2 = 'update users set userpaymentbalance = (userpaymentbalance - ?), startdate = DATE_ADD(NOW(), INTERVAL 1 HOUR), userexpirydate = CONCAT((DATE_ADD(CURDATE(), INTERVAL ? DAY)), " 00:00:00"), useractive = 1, productindex = ? where userindex = ?'
        connection.query({sql: query2,timeout: 40000 },b1, function (error, results, fields) {
              if (error)
              {
                    connection.rollback(function() {
                      console.log(error);
                  });
                  callBack(error);

              }
              var bankinfo = bank.split(":"); 
              var bi1 = [
                ind,
                ind,
                bankinfo[0]
              ]
              var query3 = 'update bankinstances set validitydate = DATE_ADD(NOW(), INTERVAL 1 HOUR) where crmsystemid =? and banktypeindex<>114;select * from bankinstances where crmsystemid = ? and banktypeindex = ?'
              connection.query({sql: query3,timeout: 40000 },bi1, function (error, results, fields) {
                    if (error)
                    {
                          connection.rollback(function() {
                            console.log(error);
                        });
                        callBack(error);
      
                    }
                    var bi2 = []
                    var resbankid = results[1][0].BANKINSTANCEINDEX;
                    var insertSql = ''
                    if(results.length==0 )
                    {
                        bi2 = [
                            bankinfo[0],
                            ind,
                            bankinfo[2],
                            numDay,
                            bankinfo[1],
                          ]
                        insertSql = 'insert into `bankinstances`(`BANKTYPEINDEX`,`CRMSYSTEMID`,`BALANCE`,`VALIDITYDATE`,`ACCUMULATEDUSAGE`,`CREDITLIMIT`,`ASSOCIATEDSERVICES`,`ISUNLIMITEDBANK`,`RESERVEDUNITS`) values (?,?,?,CONCAT((DATE_ADD(CURDATE(), INTERVAL ? DAY)), " 00:00:00"),0,0,"",?,10485760)'
                    }
                    else if (results.length >0 && bankinfo[1]==0 && rollover == 1){
                        bi2 = [
                            bankinfo[2],
                            numDay,
                            resbankid
                          ]
                          insertSql = 'update bankinstances set BALANCE = (BALANCE + ?),VALIDITYDATE= CONCAT((DATE_ADD(CURDATE(), INTERVAL ? DAY)), " 00:00:00"),ACCUMULATEDUSAGE=0 where BANKINSTANCEINDEX =  ?'

                        
                    }
                    else if ((results.length >0 && bankinfo[1]==0 && rollover == 0) || (results.length >0 && bankinfo[1]==1 )) {
                        bi2 = [
                            bankinfo[2],
                            numDay,
                            resbankid
                          ]
                          insertSql = 'update bankinstances set BALANCE = ?,VALIDITYDATE= CONCAT((DATE_ADD(CURDATE(), INTERVAL ? DAY)), " 00:00:00"),ACCUMULATEDUSAGE=0 where BANKINSTANCEINDEX =  ?'

                    }else
                    {
                        callBack(error);
                    }
                    //console.log(bi2);
                    connection.query({sql: insertSql,timeout: 40000 },bi2, function (error, results, fields) {
                        if (error) {
                            connection.rollback(function() {
                                console.log(error);
                            });
                            callBack(error);
                        }
                        connection.commit(function(err) {
                            if (err) {
                                callBack(error);
                            }
                            return callBack(null, results);
                            console.log('success!');
                        });

                    });


                });
          });
      });

    }
};