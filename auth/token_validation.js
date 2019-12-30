const {verify} = require('jsonwebtoken');

module.exports = {
    checkToken: (req, res, next) => {
        let token = req.get("authorization");
        if(token){
            token = token.slice(7);
            verify (token, process.env.keysecond, (err, decoded) => {
                if(err)
                {
                    res.json({
                        status: 99,
                        message: "invalid Token"
                    });
                }
                else{
                    next();
                }
            });

        }else{
            res.json({
                status: 99,
                message: "Access denied"
              });
        }

    }
}