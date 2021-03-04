import React,{useEffect, useState} from 'react';
import {View,StyleSheet, Platform, ToastAndroid} from 'react-native';
import {BleManager} from 'react-native-ble-plx';
import Permissions from 'react-native-permissions';
import {Container, Header, Content, Footer, FooterTab, Button, Icon, Text, Card, CardItem, Body,Toast,Root} from 'native-base'
import base64 from 'react-native-base64'
import moment from 'moment';

const App = () =>{ 
  
  const manager=new BleManager();
  const [detailState,setDetailState]=useState({
    deviceId:'',
    serviceUUID:'',
    characteristicsUUID:'',
    text1:'',
    makeData:[],
    showToast:false,
    notificationReceiving:false,
    dateTime:'',
    device:{},
  });

  let count=0;
  const transactionId="monitor";

  const getPermission=()=>{
    if(Platform.OS==='android'){
      Permissions.check(Permissions.PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION).then((result)=>{
        console.log("result :",result);
          Permissions.requestMultiple([Permissions.PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION]).then((result)=>{
            if(result==='granted'){
              console.log("Granted");
            }else if(result==='denied'){
              console.log("Denied");
            }else{
              console.log(result);
            }
          })
       
      })

    }
  }

  useEffect(()=>{
    getPermission();
  },[])

  const alert=(msg)=>{
    ToastAndroid.show(msg,ToastAndroid.LONG);
  }

  const scanAndConnect=async()=>{
    setDetailState({
      ...detailState,
      text1:"Scanning..."
    })
    manager.startDeviceScan(null,null,(error,device)=>{
      console.log("start scan :",device,error)
     
      if(error){
        alert("Error in scan :"+error);
        setDetailState({
          ...detailState,
          text1:""
        })
        manager.stopDeviceScan();
        // stopNotification();
        return
      }
      if(device===null){
        console.log("Hello")
      }
      console.log(device.name)
      if(/[_]/g.test(device.name)){
        let nameSplit=device.name.split('_');
        if(nameSplit[0]==='TAPP' || nameSplit[0]==='T3X1'){
          const serviceUUIDs=device.serviceUUIDs[0];
          setDetailState({
            ...detailState,
            text1:"Connecting to "+device.name
          })
          manager.stopDeviceScan();
          manager.connectToDevice(device.id,{autoConnect:true}).then(async(device)=>{
            const services=await device.discoverAllServicesAndCharacteristics();
            const characteristics=await getServiceAndCharacterstics(services);
            console.log("Characteristics :",characteristics);
            console.log("Discovering services and characteristics",characteristic.uuid);
            setDetailState({
              ...detailState,
              deviceId:device.id,
              serviceUUID:serviceUUIDs,
              characteristicsUUID:characteristics.uuid,
              device:device,
              text1:'Connected to '+device.name
            })
            return device.discoverAllServicesAndCharacteristics()
          }),(error)=>{
            alert(error);
          }
        }
      }
    })
  }


  const disconnect=()=>{
    return new Promise((resolve,reject)=>{
      manager.cancelDeviceConnection(detailState.deviceId).then(()=>{
        setDetailState({
          deviceId:'',
    serviceUUID:'',
    characteristicsUUID:'',
    text1:'',
    makeData:[],
    showToast:false,
    notificationReceiving:false,
    dateTime:'',
    device:{}
        })
      }).catch((err)=>{
        console.log('Error in disconnected',err);
      })
    })
  }

  const stopNotification=()=>{
    manager.cancelDeviceConnection(transactionId);
    setDetailState({
      ...detailState,
      notificationReceiving:false
    })
  }

  const writeMessage=async(code,message)=>{
    manager.cancelTransaction(transactionId);
    let device=detailState.device;
    const sendData=base64.encode(message);
    if(device){
      manager.writeCharacteristicWithResponseForDevice(detailState.serviceUUID,detailState.characteristicsUUID,sendData).then((characterstic)=>{
        alert(message);
        let snifferService=null;
        
        device.services().then(services=>{
            let voltageCharacteristic =null;
            snifferService=services.filter(service=>service.uuid===detailState.serviceUUID)
            snifferService.characteristics().then(characteristics=>{
              setDetailState({
                ...detailState,
                notificationReceiving:true
              })
              voltageCharacteristic=characteristics.filter(c=>c.uuid===characteristics[0].uuid);
              voltageCharacteristic.monitor((error,c)=>{
                if(error){
                  console.log("Error in monitor",error)
                  return;
                }else{
                  const data=base64.decode(c.value);
                  let s=data.split(" ");
                  let s1=parseInt(s[1]);
                  if(isNaN(s1)){
                    count++
                  }else{
                    if(count===1){
                      detailState.makeData.push(<Text key={moment().valueOf()}>{s1/1000}{"\n"}</Text>);
                      setDetailState({
                        ...detailState,
                        dateTime: "Data received at :"+moment().format("MMMM Do,h:mm:ss a"),
                        makeData:detailState.makeData
                      })
                    }
                    if(count===3){
                      count=0;
                      setDetailState({
                        ...detailState,
                        makeData:[]
                      })
                    }
                  }
                }
                
              },transactionId)
            }).catch((error)=>{
              console.log(error);
            })
            return
        }).catch((error)=>{
          console.log(error);
        })
      })
    }else{
      alert("No device is connected!");
    }
  }

  const getServiceAndCharacterstics=(device)=>{
    return new Promise((resolve,reject)=>{
      device.services().then(services=>{
        const characterstics=[];
        console.log("services :",services);
        services.forEach((element,i) => {
          element.characteristics().then(c=>{
            characterstics.push(c);
            console.log("ch :",characterstics);
            if(i===services.length-1){
              const temp=characterstics.reduce((acc,current)=>{
                return [...acc,...current];
              },[])
              const dialog=temp.find(characteristic=>characteristic.isWritableWithoutResponse);
              if(!dialog){
                reject('No writable charateristic')
              }
            }
          })
        });
      })
    })
  }


  return(
    <Root>
      <Content padder >
        <View>
          {
            detailState.deviceId ?
            <Button warning block onPress={disconnect}> 
              <Text>Disconnect</Text>
            </Button>

            :

            <Button block onPress={scanAndConnect}> 
              <Text>Scan for a device</Text>
            </Button>

          }
        </View>
        <View style={{alignItems:'center',marginVertical:10}}>
          <Text>{detailState.text1}</Text>
        </View>
        <Card>
          <CardItem>
            <Body>
              <Text>{detailState.dateTime}{'\n'}{detailState.makeData}</Text>
            </Body>
          </CardItem>
        </Card>
        {
          detailState.notificationReceiving ?
          <Button warning block onPress={stopNotification}>
            <Text>Stop Notification</Text>
          </Button>
          :
          null
        }
        <Footer>
          <FooterTab>
            <Button onPress={()=>writeMessage("ABC","ABC Written")}>
              <Text>ABC</Text>
            </Button>
            <Button onPress={()=>writeMessage("DEF","DEF Written")}>
              <Text>DEF</Text>
            </Button>
            <Button onPress={()=>writeMessage("GHI","GHI Written")}>
              <Text>GHI</Text>
            </Button>
          </FooterTab>
        </Footer>
      </Content>
    </Root>
  )
};

export default App;
