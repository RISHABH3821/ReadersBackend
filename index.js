const express = require("express");
var myParser = require("body-parser");
var Cryptr = require("cryptr");
var AWS = require("aws-sdk");
const app = express();
const pg = require("pg");
const pool = new pg.Pool({
  user: "rishabh",
  host: "127.0.0.1",
  database: "readers",
  password: "rishabh1234",
  port: "5432"
});

app.use(myParser.json());
app.use(
  myParser.urlencoded({
    extended: true
  })
);

var s3 = new AWS.S3({
    accessKeyId: 'ACCESS_KEY_ID',
    secretAccessKey: 'SECRET_ACCESS_KEY',
    region: 'us-east-2'
});

function getImagesfromS3(imageName) {
    var params = {
        Bucket: 'readersapp0d91c93c7e5d4e559d755890e4992c2d181254-android',
        Key: 'public/bookcover/'+ imageName
    };
    let url = s3.getSignedUrl('getObject', params);
    return url;
}


app.get('/getImagesfromS3/', (req, res)=>{
	let imagename = req.query.image;
	res.send(getImagesfromS3(imagename));
});


cryptr = new Cryptr("secret_key");

// app.get("/", (req, res) => {
//   console.log(req.query);
//   res.send(res.query);
//   //	res.send('Hello');
// });

// app.post("/", (req, res) => {
//   res.send(req.body);
// });

//Signup API to post user's personal information
app.post("/signup", function(req, res) {
  try {
    var credits = 10;
    var user_name = req.body.user_name;
    var full_name = req.body.full_name;
    var password = req.body.password;
    // var password = cryptr.encrypt(req.body.password);
    var email = req.body.email;
    var contact_number = req.body.contact_number;
    var address = req.body.address;
    pool.query(
      "SELECT user_name FROM Users_table WHERE user_name = $1",
      [user_name],
      function(err, result) {
        if (result.rowCount != 0) {
          res.send(
            "You can't do anything,already... " + result.rowCount + " row"
          );
        } else {
          pool.query(
            "INSERT INTO Users_table(credits,user_name,full_name,password,email,contact_number,address) VALUES ($1,$2,$3,$4,$5,$6,$7)",
            [
              credits,
              user_name,
              full_name,
              password,
              email,
              contact_number,
              address
            ],
            function(err, result) {
              if (err) console.log(err);
              else res.sendStatus(200);
            }
          );
        }
      }
    );
  } catch (err) {
    console.log(err);
  }
});

//Get users from Users table
app.get('/users/', function(req,res) {
    try {
        pool.query('SELECT * FROM Users_table', function(err, result) {
            if (err)
                res.send('Users can not be fetched..')
            else
                res.send(result.rows);
        })
    } catch (err) {
        console.log(err);
    }
});

app.get('/getusername/', async(req, res)=>{
	await pool.query("SELECT user_name FROM Users_table WHERE email = $1", [req.query.user_email], (err, res1)=>{
		if(!err){
			res.send(res1.rows[0].user_name);
		}else{
			console.log(err);
			res.sendStatus(400);
		}
	});
});


app.get('/getuseremail/', async(req, res)=>{
	await pool.query("SELECT email FROM Users_table WHERE user_name = $1", [req.query.user_name], (err, res1)=>{
		if(!err){
			res.send(res1.rows[0].email);
		}else{
			console.log(err);
			res.sendStatus(400);
		}
	});
});



app.get('/getRating/', async (req, res)=>{
	try {
	await pool.query("SELECT rating from ratings WHERE book_id = $1 AND user_id = $2;", [req.query.book_id, req.query.user_id], (err, res1)=>{
		if(!err){
			console.log(JSON.stringify(res1));
			res.send(""+res1.rows[0].rating);
		}else{
			res.sendStatus(500);
		}
	});
}catch(err1){
	console.log(err1);
	res.send("0");
}
});

app.get('/getTotalRating/', async (req, res)=>{
	try{
	await pool.query("SELECT avg(rating) as rating from ratings WHERE book_id = $1", [req.query.book_id], ( err, res1)=>{
		if(!err){
			res.send(""+res1.rows[0].rating);
		}else{
			console.log(err);
			res.sendStatus(500);
		}
	});
}catch(err1){
	res.send("0");
	console.log(err1);
}
});

app.post('/postRating/', (req, res)=>{
	pool.query("INSERT INTO ratings(id, book_id, user_id, rating) VALUES($1, $2, $3, $4) ON CONFLICT(id) DO UPDATE SET rating = $4", [req.body.book_id+req.body.user_id,req.body.book_id, req.body.user_id, req.body.rating], (err, res1)=>{
		if(!err){
			console.log("Rating saved successfully");
			res.sendStatus(200);
		}else{
			console.log(err);
			res.sendStatus(500);
		}
	});
});


/*app.post("/transaction/", function(req, res) {
  try {
    pool.query(
      "SELECT user_name,credits FROM Books_table WHERE book_id = $1",
      [req.body.book_id],
      function(err, res1) {
        var userNameSeller = res1.rows[0].user_name;
        var creditsBooks = res1.rows[0].credits;
        var transactionStatus = "requested";
        var bookId = req.body.book_id;
        var userNameBuyer = req.body.user_name_buyer;
        pool.query(
          "INSERT INTO Transaction_table (book_id, user_name_seller, user_name_buyer, credits, status_transaction ) VALUES ($1,$2,$3,$4,$5)",
          [
            bookId,
            userNameSeller,
            userNameBuyer,
            creditsBooks,
            transactionStatus
          ],
          function(err2, res2) {
            if (res2) {
              res.status(200).send("ok");
            } else {
              console.log("insertion unsuccessfull!!!");
              res.send("insertion unsuccessfull!!!");
            }
          }
        );
      }
    );
  } catch (err) {
    console.log(err);
  }
});
*/
app.get("/creditCount/", function(req, res) {
	console.log(req.query.name);
  try {
    pool.query(
      "SELECT credits FROM Users_table WHERE user_name= $1",
      [req.query.user_name],
      function(err1, res1) {
        console.log(res1);
        if (res1) {
          console.log("creditCount sent!!!");
          res.send(""+res1.rows[0].credits);
        } else {
          console.log("currentBookStatus sent!!!");
          res.sendStatus(500);
        }
      }
    );
  } catch (err) {
    console.log(err);
  }
});

app.get("/currentBookStatus/", function(req, res) {
  try {
    pool.query(
      "SELECT book_status FROM Books_table WHERE book_id=$1",
      [req.query.book_id],
      function(err1, res1) {
        if (res1) {
          console.log("currentBookStatus sent!!!");
          res.send(res1.rows[0].book_status);
        } else {
          console.log("Not sent");
          res.sendStatus(500);
        }
      }
    );
  } catch (err) {
    console.log(err);
  }
});

app.get("/userNameCheck/", function(req, res) {
  try {
    pool.query(
      "SELECT user_name FROM Users_table WHERE $1 NOT IN (SELECT user_name FROM Users_table)",
      [req.query.user_name],
      function(err1, res1) {
        if (res1) {
          console.log("userName is availabe to use!!!");
          res.send("available");
        } else {
          console.log("userName already present");
          res.sendStatus(500);
        }
      }
    );
  } catch (err) {
    console.log(err);
  }
});

app.get("/contact", function(req, res) {
  try {
    pool.query(
      "SELECT contact_number,address FROM Users_table WHERE user_name= $1",
      [req.body.user_name],
      function(err1, res1) {
        if (res1) {
          console.log("userName is availabe to use!!!");
          res.send(res1.rows);
        } else {
          console.log("userName already present");
          res.sendStatus(-1);
        }
      }
    );
  } catch (err) {
    console.log(err);
  }
});



//API for user to login and do the validation
app.post("/login", function(req, res) {
  try {
    pool.query(
      "SELECT user_name FROM Users_table WHERE user_name =$1",
      [req.body.user_name],
      function(err, result) {
        if (result.rows[0]) {
          pool.query(
            "SELECT password FROM Users_table WHERE user_name = $1",
            [req.body.user_name],
            function(err, result) {
              if (result == null) console.log("No such User exists");
              else {
                var password = result.rows[0].password;

                // var password = cryptr.decrypt(result.rows[0].password);

                if (password == req.body.password) {
                  res.send("Login Successful");
                } else res.send("Incorrect password");
              }
            }
          );
        } else {
          res.send("Username not exist");
        }
      }
    );
  } catch (err) {
    console.log(err);
  }
});

app.get("/GetBookByGenre/", (req, res) => {
  console.log("GET BOOK BY GENRE");
	console.log(req.query.genre);
	let query="select * from Books_table where book_genre LIKE '%"+req.query.genre+"%' order by book_status";
  pool.query(
    query,
    (err, res1) => {
      if (!err) {
        res.send(res1.rows);
      } else {
	console.log(err);
        res.sendStatus(404);
      }
    }
  );
});

//FETCHING BOOK NAME ACCORDING TO GENRE
/*app.get('/GetBookByGenre/', function(req, res) {
	console.log('Get Book by genre');
    pool.query('select * from Books_table where book_genre = $1 order by book_status', [req.query.genre], function(err, result) {
        if (err) {
            res.status(404).json({
                "message": err
            });
		console.log(err);
        } else {
		console.log(result.rows);
	        res.send(result.rows);
        }


    });
});*/

//FETCHING NAME OF BOOK BY NAME
app.get("/bookCatalog/", function(req, res) {
  pool.query(
    "select * from Books_table where book_name  = $1",
    [req.query.name],
    function(err, result) {
      if (err) res.send(err);
      if (result != null) {
        res.send(result.rows);
      } else {
        res.send("No book found");
      }
    }
  );
});

app.get("/GetBookByUserName/", function(req, res) {

  pool.query(    "select * from Books_table where user_name = $1",[req.query.user_name],function(err, result) {
	if(err){console.log(err);}
	res.send(result.rows);
    }
  );
});


app.get("/getUserId/",async (req, res)=>{
	pool.query("select user_id from users_table where user_name = $1", [req.query.user_name], (err, res1)=>{
		if(!err){
			res.send(""+res1.rows[0].user_id);
		}else{
			console.log(err);
			res.sendStatus(500);
		}
	});
});


//UPLOADING A BOOK
app.post("/uploadBook", function(req, res) {
  var Book_name = req.body.book_name;
  var Author = req.body.book_author;
  var Desc = req.body.book_desc;
  var status = "Available";
  var Owner = req.body.user_name;
  var count = 0;
  var Genre = req.body.book_genre;
  var cover = req.body.book_cover;
  var credits = 10;
  pool.query(
    "INSERT INTO Books_table (credits,book_name, book_author, book_description, book_status, book_exchange_count, user_name, book_genre, book_cover) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)",
    [credits, Book_name, Author, Desc, status, count, Owner, Genre, cover],
    function(err, result) {
      if (err) throw err;
      console.log("insertion done successfully");
	res.sendStatus(200);
    }
  );
});


//API request to fetch all the users registered
app.get("/users/:user_name", function(req, res) {
  try {
    pool.query(
      "SELECT * FROM Users_table WHERE user_name = $1",
      [req.params.user_name],
      function(err, result) {
        if (err) res.send("Users can not be fetched..");
        else res.send(result.rows);
      }
    );
  } catch (err) {
    console.log(err);
  }
});

app.get('/getGenre/', async(req, res)=>{
	await pool.query("Select DISTINCT book_genre, book_cover from books_table;", ( err, res1)=>{
		if(!err){
			res.send(res1.rows);
		}else{
			console.log(err);
			res.sendStatus(500);
		}
	});
});




app.post("/SendRequest", function(req, res) {
    try {
        pool.query(
            "SELECT user_name,credits FROM Books_table WHERE book_id = $1",
            [req.body["book_id"]],
            function(err, res1) {
                var userNameSeller = res1.rows[0].user_name;
                var creditsBooks = res1.rows[0].credits;
                var transactionStatus = "requested";
                var bookId = req.body["book_id"];
                var userNameBuyer = req.body["buyer_name"];

                pool.query(
                    "SELECT credits FROM Users_table WHERE user_name=$1",
                    [userNameBuyer],
                    function(err3, res3) {
                        if (err3) console.log(err3);
                        var creditsUserBuyer = res3.rows[0].credits;

                        creditsUserBuyer = creditsUserBuyer - 10;
                        console.log(creditsUserBuyer);
                        let query = "INSERT INTO Transaction_table (book_id, user_name_seller, user_name_buyer, credits, status_transaction )" +
                            "VALUES ('" + bookId + "','" + userNameSeller + "','" + userNameBuyer + "','" + creditsUserBuyer + "','" + transactionStatus + "')";
                        pool.query(query, (err4, res4) => {
                            if (!err4) {
                                pool.query(
                                    "UPDATE Users_table SET credits = $1 WHERE user_name=$2",
                                    [creditsUserBuyer, userNameBuyer],
                                    function(err4, res4) {
                                        console.log(err4);
                                        console.log(res4);
                                        if (!err4) {
					    res.sendStatus(200);
                                            console.log(
                                                "deduction of credits from buyer done successfully!!!"
                                            );
                                        } else
                                            console.log("ERROR in deduction of credits from buyer !!!");
                                    }
                                );
                            }

                        });

                    });
            });
    } catch (err) {
        console.log(err);
    }
});

app.post('/CancelRequest/', (req, res)=>{
	console.log("CANCEL REQUEST");
	var transID = req.body.transaction_id;
	var query = "UPDATE Users_table SET credits = credits+10 WHERE user_name = (SELECT user_name_buyer FROM Transaction_table WHERE trans_id = '"+transID+"')";
	pool.query(query, (err, res1)=>{
		if(!err){
			var query2 = "UPDATE Books_table SET book_status = 'available' WHERE book_id = (SELECT book_id FROM Transaction_table WHERE trans_id = '"+transID+"')";
			pool.query(query2, (err2, res2)=>{
				if(!err2){
					pool.query("DELETE FROM Transaction_table WHERE trans_id = "+transID, (err3,res3)=>{
						if(!err3){
							res.sendStatus(200);
						}else{
							console.log(err3);
						}
					});
				}else{
					console.log(query2);
					console.log(err2);
				}
			});

		}else{
			console.log(query);
			console.log(err);
		}
	});
});

/*app.post("/CancelRequest", function(req, res) {
  try {
    var transId = req.body["transaction_id"];
    pool.query(
      "SELECT user_name_buyer FROM Transaction_table WHERE trans_id= $1",
      [transId],
      (err1, res1) => {
        console.log(res1);
        var userNameBuyer = res1.rows[0].user_name_buyer;

        pool.query(
          "UPDATE User_table SET credits = credits+10 WHERE user_name = $1",
          [userNameBuyer],
          function(err2, res2) {}
        );
      }
    );

    pool.query(
      "SELECT book_id FROM Transaction_table WHERE  trans_id=$1",
      [transId],
      (err3, res3) => {
        console.log(res3);
        let bookId = res3.rows[0].book_id;
        pool.query("UPDATE Books_table SET book_status= 'available' ");
        pool.query(
          "DELETE FROM Transaction_table WHERE trans_id = $1",
          [transId],
          function(err0, res9) {
            // console.log(err0);
            // console.log(res9);
          }
        );
      }
    );
  } catch (err) {
    console.log(err);
  }
});*/


app.get('/GetAllTransactions/', (req, res)=>{
	let query = "SELECT * FROM Transaction_table WHERE user_name_seller LIKE '"+req.query.user_name+"' OR user_name_buyer LIKE '"+req.query.user_name+"'";
	pool.query(query, (err, res1)=>{
		if(!err){
			res.send(res1.rows);
		}else{
			res.sendStatus(404);
		}
	});
});

app.post('/FinalizeTransaction/', (req, res)=>{
  const transID = req.body.transaction_id;
  var query = "UPDATE Books_table SET book_status = 'available' WHERE book_id = (SELECT book_id FROM Transaction_table WHERE trans_id='"+transID+"')";
  pool.query(query, (err1, res1)=>{
    if(!err1){
      var query2 = "SELECT book_id, user_name_buyer, user_name_seller FROM Transaction_table WHERE trans_id = '"+transID+"'";
      pool.query(query2, (err2, res2)=>{
        if(!err2) {
          var query1 = "UPDATE Books_table SET user_name = '"+res2.rows[0].user_name_buyer+"' WHERE book_id = "+res2.rows[0].book_id+";";
          pool.query(query1, (err3, res3)=>{
            if(!err3){
              var query3 = "UPDATE Users_table SET credits = credits+10 WHERE user_name = '"+res2.rows[0].user_name_seller+"'";
              pool.query(query3, (err4, res4)=>{
                if(!err4){
                  res.sendStatus(200);
                }else{
                  console.log(err4);
                  res.send("Failed");
                }
              });
            }else{
              console.log(err3);
              res.send("Failed");
            }
          });
        }else{
          console.log(err2);
          res.send("Failed");
        }
      });
      
    }else{
      console.log(err1);
      res.send("Failed");
    }
  });
});

app.post("/AcceptRequest/", (req, res)=>{
  console.log("Accept Request");
  const transID = req.body.transaction_id;
  var query = "UPDATE Books_table SET book_status = 'unavailable' WHERE book_id = (SELECT book_id FROM Transaction_table WHERE trans_id = '"+transID+"')";
  pool.query(query, (err1, res1)=>{
    if(!err1){
      var query1 = "UPDATE Transaction_table SET status_transaction = 'pending' WHERE trans_id = '"+transID+"'";
      pool.query(query1, (err2, res2)=>{
        if(!err2){
          res.sendStatus(200);
        }else{
          res.sendStatus(500);
          console.log(err2);
        }
      });
    }else{
      res1.sendStatus(500);
      console.log(err1);
    }
  });
});

app.get('/GetBookNameByID/', (req, res)=>{
	let book_id = req.query.book_id;
	let query = "SELECT book_name FROM Books_table WHERE book_id = "+book_id;
	pool.query(query, (err1, res1)=>{
		if(!err1){
			res.send(res1.rows[0].book_name);
		}else{
			console.log(404);
		}
	});
});


app.listen(3000, () => {
  console.log("listening at port 3000");
});

