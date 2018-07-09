var express=require("express");
var app=express();
var request=require("request");
var cheerio=require("cheerio");

app.use(express.static("./public"));
app.set("view engine","ejs");
app.set("views","./views");
var server=require("http").Server(app);
var io=require("socket.io")(server);
server.listen(8000,'');
/*
var mysql = require('mysql');
var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "123456",
  database: "test"
});
var VariableDb = [];
con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
  var QueryJson={idTable_test:4,name:"Nam",lop:"10",tuoi:15}
  //con.query('INSERT INTO Table_test SET ?', QueryJson, function (error, results, fields) {
  //  if (error) throw error;
    // Neat!
  //});
  //var sql = "INSERT INTO Table_test (idTable_test,name,lop,tuoi) VALUES (3,'linh','22','29')";

  //con.query(sql, function (err, result) {
  //  if (err) throw err;
  //  console.log("1 record inserted");
  //});

  //con.query("SELECT name,lop,tuoi FROM Table_test Where name='linh'", function (err, result, fields) {
  //var nameQuery="linh";
  //con.query("SELECT name,lop,tuoi FROM Table_test Where name="+mysql.escape(nameQuery), function (err, result, fields) {
   /* var nameQuery="tinh";
    var nameTuoi='26';
    con.query("SELECT name,tuoi FROM Table_test Where name=? or tuoi=?",[nameQuery,nameTuoi], function (err, result, fields) {
    if (err) throw err;
    console.log(result[0].name);
  });*/
  /*
  con.query("select * from Table_test",function(err,result,fields){
      if(err) throw err;
      VariableDb=result;
      console.log(VariableDb.length);
  })
  con.end();

});

*/
var ip = require('ip');
console.log(ip.address());
var modbus = require('jsmodbus');
// create a modbus client
var client = modbus.client.tcp.complete({ 
        'host'              : '192.168.11.200', 
        'port'              : 502,
        'autoReconnect'     : true,
        'reconnectTimeout'  : 1000,
        'timeout'           : 5000,
        'unitId'            : 0
    });

client.connect();

// reconnect with client.reconnect()
var InputSignal=[];
var OldInputSignal=[];
var WordStartInputBit=100;
var LengthOfWordInputBit=10;

var BitDisplay=[];
var OldBitDisplay=[];
var WordStartBitDisplay=110;
var LengthOfWordBitDisplay=5;

var BitAdjust=[];
var OldBitAdjust=[];
var WordStartBitAdjust=115;
var LengthOfWordBitAdjust=5;

var WordDisplay=[];
var OldWordDisplay=[];
var WordStartWordDisplay=120;
var LengthOfWordWordDisplay=100;//max 125

var WordAdjust=[];
var OldWordAdjust=[];
var WordStartWordAdjust=220;
var LengthOfWordWordAdjust=100;//max 125



client.on('connect', function () {
    
    var myVar = setInterval(myTimer, 100);
    function myTimer() {
        try{
            client.readHoldingRegisters(WordStartInputBit, LengthOfWordInputBit).then(function (resp) {
                //InputSignal
               for (var i=0;i<LengthOfWordInputBit;i++){
                   var temp=parseInt(resp.register[i]);
                   for(var j=0;j<8;j++){
                       InputSignal[8*i+j]=temp%2;
                       temp=parseInt(temp/2);
                   }
               }
           });
            client.readHoldingRegisters(WordStartBitAdjust, LengthOfWordBitAdjust).then(function (resp) {
                    //BitAdjust
                for (var i=0;i<LengthOfWordBitAdjust;i++){
                    var temp=parseInt(resp.register[i]);
                    for(var j=0;j<8;j++){
                        BitAdjust[8*i+j]=temp%2;
                        temp=parseInt(temp/2);
                    }
                }
            });
            client.readHoldingRegisters(WordStartWordDisplay, LengthOfWordWordDisplay).then(function (resp) {
                //WordDisplay
                for(var i=0;i<LengthOfWordWordDisplay;i++){
                    WordDisplay[i]=resp.register[i];
                }
            });
            client.readHoldingRegisters(WordStartWordAdjust, LengthOfWordWordAdjust).then(function (resp) {
                //WordAdjust
                for(var i=0;i<LengthOfWordWordAdjust;i++){
                    WordAdjust[i]=resp.register[i];
                }
            });
    }
    catch(err){console.log(err);}}
});

client.on('error', function (err) {

    console.log(err);
    
})
io.on("connection",function(socket){
    console.log("co nguoi ket noi");
    io.sockets.emit('Server-send-WordDisplay', WordDisplay);
    io.sockets.emit('Server-send-WordAdjust', WordAdjust);
    io.sockets.emit('Server-send-InputSignal', InputSignal);
    io.sockets.emit('Server-send-BitAdjust', BitAdjust);

    socket.on("disconnect",function(){
        console.log("ngat kekt noi");
    });
   
    var OldTimeWeb="";
    var OldDateWeb="";
    setInterval(function(){
        //Date_Time
        if(OldTimeWeb!=TimeWeb){
            OldTimeWeb=TimeWeb;
            io.sockets.emit('Server-send-Time', TimeWeb.substr(0));
        }
        if(OldDateWeb!=DateWeb){
            OldDateWeb=DateWeb;
            io.sockets.emit('Server-send-Date', DateWeb.substr(0));
        }
        //Modbus
        var temp=false;
        for(var i=0;i<WordDisplay.length;i++){
            if (WordDisplay[i]!=OldWordDisplay[i]){
                OldWordDisplay[i]=WordDisplay[i];
                temp=true;
            }
        }
        if(temp){io.sockets.emit('Server-send-WordDisplay', WordDisplay);}
       
        temp=false;
        for(var i=0;i<WordAdjust.length;i++){
            if (WordAdjust[i]!=OldWordAdjust[i]){
                OldWordAdjust[i]=WordAdjust[i];
                temp=true;
            }
        }
        if(temp){io.sockets.emit('Server-send-WordAdjust', WordAdjust);}

        temp=false;
        for(var i=0;i<InputSignal.length;i++){
            if (InputSignal[i]!=OldInputSignal[i]){
                OldInputSignal[i]=InputSignal[i];
                temp=true;
            }
        }
        if(temp){io.sockets.emit('Server-send-InputSignal', InputSignal);}

        temp=false;
        for(var i=0;i<BitAdjust.length;i++){
            if (BitAdjust[i]!=OldBitAdjust[i]){
                OldBitAdjust[i]=BitAdjust[i];
                temp=true;
            }
        }
        if(temp){io.sockets.emit('Server-send-BitAdjust', BitAdjust);}

    }, 100);
    socket.on("Client-send-data",function(data){
        io.sockets.emit("Server-send-data",data);
        Status_img=data;
        //console.log(data);
        //tra dulieu lai minh client send len
        //socket.emit("Server-send-data",data+"From_Server");
        //tra du lieu lai tat ca client tru nguoi gui len
        //socket.broadcast.emit("Server-send-data",data+"From_Server");
    })
    socket.on("Client-send-data-WordAdjust",function(data){
        /*for(var i=0;i<VariableDb.length;i++){
            console.log(VariableDb[i].name);
            io.sockets.emit('Server-send-MySql_1', VariableDb[i]);
        }*/
        //io.sockets.emit('Server-send-MySql_1', VariableDb);
        if(data[0]=="AdjustWord"&&parseInt(data[2])<65536){
            client.writeMultipleRegisters(6400, [600, WordStartWordAdjust+parseInt(data[1].substr(10)), parseInt(data[2])]).then(function (resp) {
                console.log(resp);
                
            }, console.error);
        }
        
    });
});

//Day and Time
var TimeWeb="";
var DateWeb="";
//var myIntervalDateTime = setInterval(myTimerDateTime, 1000);
function myTimerDateTime() {
    try{
        request("https://www.timeanddate.com/worldclock/thailand/bangkok",function(error,response,body){
            if(error){
                console.log(error);
            }else{
                $=cheerio.load(body);
                var ds=$(body).find("span#ct");    
                ds.each(function(i,e){
                    TimeWeb=$(this).text();
                })
                var ds=$(body).find("span#fsdate");    
                ds.each(function(i,e){
                    DateWeb=$(this).text();
                })
            }
        })
    }
    catch (error){console.log(error);}
}

app.get("/",function(req,res){
    res.render("trangchu");
});
app.get("/Scale",function(req,res){
    res.render("Scale");
});
app.get("/Img",function(req,res){
    res.render("Img");
});