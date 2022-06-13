// Создаётся экземпляр клиента
const configs=require('../configs/configs.js'),
      WebSocketClient = require('websocket').client,
      fs = require('fs');

console.log("Подключение к серверу "+configs.webServer+" по WebSocket");
const connectionObj={};

let wsClient,
    wsStat={},
    api={};

const init=()=> new Promise((resolve) => {
  // Вешаем на него обработчик события подключения к серверу
  wsStat.connect=false;
  wsStat.auth=false;
  wsStat.dataUpdate=false;
  wsClient = new WebSocketClient();
  wsClient.on('connect', wsHandler);
  function wsHandler(connection) {
    console.log('WebSocket Client Connected');
    wsStat.connect=true;
    wsStat.connection=connection;
    connection.on('error', function(error) {
        console.log("Connection Error: " + error.toString());
        wsStat.connect=false;
        wsStat.auth=false;
        wsStat.dataUpdate=false;
        wsClient.abort();
        resolve(false);
    });
    connection.on('close', function() {
        console.log('Connection close');
        wsStat.connect=false;
        wsStat.auth=false;
        wsStat.dataUpdate=false;
        wsClient.abort();
        resolve(false);
    });
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            //console.log("Received: '" + message.utf8Data + "'");
            try {
              const dataP=JSON.parse(message.utf8Data);
              if (dataP.type==='auth') {
                  // посылаем сообщение серверу
                  const request={
                    type:'auth',
                    message:"it's my, open!",
                    key:configs.webServerConfigs.key
                  };
                  connection.sendUTF(JSON.stringify(request));
              }
              else if (dataP.type==='authRes') {
                wsStat.auth=dataP.data.auth;
                console.log('Auth result',dataP.data);
                if (wsStat.auth) {
                  for (const method of dataP.data.methods) {
                    api[method] = (...args) => new Promise((resolve2) => {
                      const getMethod=()=>{
                        connection.sendUTF(JSON.stringify({
                          type:"method",
                          method:method,
                          args:args
                        }));
                        connection.on('message', (event) => {
                          //console.log('apiEvent',event);
                          const result = JSON.parse(event.utf8Data);
                          resolve2(result.data);
                        });
                      }
                      if ((wsStat.auth) & (wsStat.connect)) {
                          getMethod();
                      }
                      else if (!wsStat.connect) {
                          init().then((resWsCon) => {
                            if (resWsCon) {
                                getMethod();
                            }
                            else {
                                resolve2(false);
                            }
                          })
                      }
                      else {
                          resolve2(false);
                      }
                    });
                  };
                  resolve(true);
                }
                else {
                  resolve(false);
                }
              }
            } catch (err) {
              console.log('try wsServer err msg: ', err);
            }
        }
    });
  }
  // Подключаемся к нужному ресурсу
  wsClient.connect(configs.webSocketServer);
  //ошибка подключения
  wsClient.on('connectFailed', function(error) {
      console.log('connectFailed ' + error.toString());
      wsStat.connect=false;
      wsStat.auth=false;
      wsStat.dataUpdate=false;
      wsClient.abort();
      resolve(false);
  });
});
module.exports.init = init;

module.exports.api = api;

const wsAbort=()=>{
    wsClient.abort();
}
module.exports.wsAbort=wsAbort;
