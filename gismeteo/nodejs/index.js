const configs=require('./configs/configs.js'),
      fs = require('fs'),
      path = require('path'),
      redis=require('./services/redis.js'),
      execSync = require('child_process').execSync,
      webSocketClient=require('./services/webSocketClient.js');

/*конвертация svg to png
const sharp = require("sharp")

const pathIcon=path.join(path.dirname(__dirname),'icons'),
      dirVal=fs.readdirSync(pathIcon);
for (var i=0; i<dirVal.length; i++) {
    if (dirVal[i].indexOf('.svg')>-1) {
      const fName=dirVal[i].split('.')[0];
      sharp(path.join(pathIcon,dirVal[i]))
        .resize({ width: 100 })
        .png()
        .toFile(path.join(pathIcon,fName+'.png'))
        .then(function(info) {
          console.log(info)
        })
        .catch(function(err) {
          console.log(err)
        })
    }
}*/

const setGisInfo=async ()=>{
  const gisParse=await webSocketClient.api.gisInfo(configs.city.code);
  //console.log('gisParse',gisParse);
  /*const myIP=execSync("curl -s ifconfig.co").toString().slice(0, -1),
        rExistsIP=await redis.client.exists('gisM_city_'+myIP);
  let myCityRes;
  if (rExistsIP===0) {
    myCityRes=execSync("curl -s -H 'X-Gismeteo-Token: "+configs.gisToken+"' 'https://api.gismeteo.net/v2/search/cities/?ip="+myIP+"'").toString().slice(0, -1);
    redis.client.set('gisM_city_'+myIP, myCityRes);
    redis.client.expire('gisM_city_'+myIP, configs.redis.expireForIP);//установка времени действия кэша
  }
  else {
    myCityRes=await redis.client.get('gisM_city_'+myIP);
  }
  const myCityParse=JSON.parse(myCityRes);
  //console.log('myCityParse',myCityParse);
  //const myCityRes=`{"meta":{"message":"","code":"200"},"response":{"district":{"name":"Воронежская область","nameP":"в Воронежской области"},"id":5026,"sub_district":{"name":"Воронеж (городской округ)","nameP":"в Воронеже"},"url":"\/weather-voronezh-5026\/","nameP":"в Воронеже","name":"Воронеж","kind":"M","country":{"name":"Россия","code":"RU","nameP":"в России"}}}`;
  const gisRes=execSync("curl -s -H 'X-Gismeteo-Token: "+configs.gisToken+"' 'https://api.gismeteo.net/v2/weather/current/"+myCityParse.response.id+"/?lang=ru'").toString().slice(0, -1);*/
  //console.log('gisParse',gisParse);
  //const gisRes=`{"meta":{"message":"","code":"200"},"response":{"precipitation":{"type_ext":null,"intensity":0,"correction":null,"amount":0,"duration":0,"type":0},"pressure":{"h_pa":997,"mm_hg_atm":748,"in_hg":39.3},"humidity":{"percent":86},"icon":"d","gm":3,"wind":{"direction":{"degree":310,"scale_8":8},"speed":{"km_h":4,"m_s":1,"mi_h":2}},"cloudiness":{"type":0,"percent":21},"date":{"UTC":"2022-06-05 07:00:00","local":"2022-06-05 10:00:00","time_zone_offset":180,"hr_to_forecast":null,"unix":1654412400},"radiation":{"uvb_index":null,"UVB":null},"city":4368,"kind":"Obs","storm":false,"temperature":{"comfort":{"C":13.5,"F":56.3},"water":{"C":14.5,"F":58.1},"air":{"C":13.5,"F":56.3}},"description":{"full":"Ясно"}}}`;
  //fs.writeFileSync("./cashe/gisRes.json", gisRes);
  //const gisParse=JSON.parse(gisRes);
  //составляем файл с текстом для отображения
  const gmCode={
          1:'Нет заметных возмущений',
          2:'Небольшие возмущения',
          3:'Слабая геомагнитная буря',
          4:'Малая геомагнитная буря',
          5:'Умеренная геомагнитная буря',
          6:'Сильная геомагнитная буря',
          7:'Жесткий геомагнитный шторм',
          8:'Экстремальный шторм'
        },
        windCode={
          0:'Штиль',
          1:'Северный',
          2:'Северо-восточный',
          3:'Восточный',
          4:'Юго-восточный',
          5:'Южный',
          6:'Юго-западный',
          7:'Западный',
          8:'Северо-западный'
        };
  const spaces='       ',
        txtVis=spaces+configs.city.name+'\n'+
               spaces+gisParse.response.description.full+'\n'+
               spaces+'Температура: '+gisParse.response.temperature.air.C+String.fromCharCode(176)+'\n'+
               spaces+'Влажность: '+gisParse.response.humidity.percent+'%'+'\n'+
               spaces+'Давление: '+gisParse.response.pressure.mm_hg_atm+'мм'+'\n'+
               spaces+'Облачность: '+gisParse.response.cloudiness.percent+'%'+'\n'+
               spaces+'Геомагнитноcть: '+gmCode[gisParse.response.gm]+'\n'+
               spaces+'Ветер: '+windCode[gisParse.response.wind.direction.scale_8]+','+gisParse.response.wind.speed.m_s+'м/с\n'+
               spaces+'Данные получены с ресурса https://www.gismeteo.ru'
  //console.log('txtVis',txtVis);
  //fs.writeFileSync("./cashe/txtVis.txt", txtVis);
  redis.client.set('gisMeteoInfo', txtVis,{EX:configs.counMSupd/500+30});

  execSync('cp -f "'+path.join(path.dirname(__dirname),'icons',gisParse.response.icon+'.png')+'" "'+path.join(__dirname,'cashe','icon.png')+'"');
  //fs.writeFileSync("./cashe/icon.txt", path.join(path.dirname(__dirname),'icons',gisParse.response.icon+'.png'));
}

redis.client.connect().then(async () => {
  const timerId0 = setInterval(async ()=> {
    const resWsCon=await webSocketClient.init();
    if (resWsCon) {
      setGisInfo();
      const timerId = setInterval(()=> {
          setGisInfo();
      },configs.counMSupd);
      clearInterval(timerId0);
    }
  },configs.counMSupd/2);

  const timerId2 = setInterval(()=> {
      const sensorRes=execSync('sensors').toString().slice(0, -1).split(/\n/g);
      let cpuInfo='CPU';
      for (var i = 0; i < sensorRes.length; i++) {
        const str=sensorRes[i];
        if (str.indexOf('Package id 0')>-1) {
          cpuInfo+=' TEMP: '+str.substring(15,23);
          //break;
        }
        if (str.indexOf('cpu_fan:')>-1) {
          cpuInfo+=' FAN: '+str.substring(13,23);
        }
      }
      //console.log('cpuInfo',cpuInfo);
      redis.client.set('cpuInfo', cpuInfo,{EX:configs.redis.expire} );
      //fs.writeFileSync("./cashe/cpuInfo.txt", cpuInfo);

      let hardInfo='TEMP: ';
      for (var i = 0; i < sensorRes.length; i++) {
        const str=sensorRes[i];
        if (str.indexOf('Composite:')>-1) {
          hardInfo+=str.substring(15,23);
          break;
        }
      }
      //fs.writeFileSync("./cashe/hardInfo.txt", hardInfo);
      redis.client.set('hardInfo', hardInfo,{EX:configs.redis.expire+1});
      //console.log('hardInfo',hardInfo);
  },configs.redis.expire*1000);
});
