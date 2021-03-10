import React,{useEffect, useState} from 'react';
import {View,StyleSheet, Platform, ToastAndroid, TextInput, Keyboard} from 'react-native';
import {BleManager} from 'react-native-ble-plx';
import {getPermission,checkConnected,alert,writeMessage} from './Utils/AllFunctions';
import {Button,Text} from 'native-base'
import base64 from 'react-native-base64';
const App = (props) =>{ 
  
  const manager=new BleManager();
  const [detailState,setDetailState]=useState({
    deviceId:'',
    serviceUUID:'',
    characteristicsUUID:'',
    text1:''
  });

const scanAndConnectDevices=async()=>{
  setDetailState({
    ...detailState,
    text1:"Scanning..."
  })
  manager.startDeviceScan(null,null,async(error,device)=>{
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
      console.log("Device getting null")
    }
    console.log(device.name)
    if(device.name==='ankit_oneclick'){
        const serviceUUIDs=device.serviceUUIDs[0];
        setDetailState({
          ...detailState,
          deviceId:device.id,
          text1:"Connect to "+device.name
        })
        manager.stopDeviceScan();
      
          manager.connectToDevice(device.id).then(async(device)=>{
  
            const services=await device.discoverAllServicesAndCharacteristics();
            console.log("Devicessssss",device)

            return services;
          }).catch((error)=>{
            console.log(error);
          })
        }
      })
}


useEffect(()=>{
  getPermission();
},[])

  const scanAndConnect=async()=>{

        setDetailState({
          ...detailState,
          text1:"Scanning..."
        })
        manager.startDeviceScan(null,null,async(error,device)=>{
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
            console.log("Device getting null")
          }
          console.log(device.name)
          if(device.name==='ankit_oneclick'){
              const serviceUUIDs=device.serviceUUIDs[0];
              setDetailState({
                ...detailState,
                deviceId:device.id,
                text1:"Connect to "+device.name
              })
              manager.stopDeviceScan();
            
                manager.connectToDevice(device.id).then(async(device)=>{
        
                  const services=await device.discoverAllServicesAndCharacteristics();
                  console.log("Devicessssss",device)
                  console.log("scan services   :",services);
                  const characteristics=await getServicesAndCharacteristics(services);
                  console.log("Characteristics ...",characteristics);
                  console.log("Discovering services and characteristics...",characteristics?.uuid,characteristics.serviceUUID);
                  
    
                  console.log(await device.isConnected())

                  
                  setDetailState({
                    ...detailState,
                    deviceId:characteristics.deviceID,
                    serviceUUID:characteristics?.serviceUUID,
                    characteristicsUUID:characteristics.uuid,
                    device:device,
                    text1:"Connected to :"+device.name
                  })
    
                }).catch((error)=>{
                  console.log("Error    ",error)
                })
              }
    
            })

    
  }

  const getServicesAndCharacteristics=(device)=>{
    console.log("get services    ",device)
    return new Promise((resolve,reject)=>{
      device.services().then(services=>{
        const characteristics=[];
        console.log("get function service :",services);
        services.forEach((services,i)=>{
          services.characteristics().then(c=>{
            console.log("service.characteristics",c);
            console.log(characteristics);
            
             const dialog=c.find(characteristic=>{
               console.log("hello    ",characteristic.isWritableWithoutResponse)
               return characteristic.isWritableWithoutResponse
              });
              console.log("dialog :",dialog)
              if(dialog!==undefined){
                if(dialog?.isWritableWithoutResponse===false){
                  reject('No writable characteristic');
                  console.log("No ")
                }
                resolve(dialog);
              }            
            })
        })
      })
    })
  }


  const readCharacteristics=async()=>{
    let checkStatus=await checkConnected(detailState.deviceId);
    if(checkStatus){
      manager.readCharacteristicForDevice(detailState.deviceId,detailState.serviceUUID,
        detailState.characteristicsUUID).then(async (characteristics)=>{
          console.log(characteristics);
          alert("Success");
          const readableData=base64.decode(characteristics.value);
          console.log("Readable data ... ",readableData)
          setDetailState({
            ...detailState,
            text1:"Readable Data :  "+readableData
          })

        }).catch((error)=>{
          console.log(error);
        });
    }else{
      console.log("Please confirm that your device is connected.")
      scanAndConnectDevices()
    }
  }

  const disconnect=async()=>{
    const checkStatus=await checkConnected(detailState.deviceId);
    if(checkStatus){
      console.log(await manager.isDeviceConnected(detailState.deviceId))
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
  
    }else{
      scanAndConnectDevices();
    }
    
  }

  const [inputMessage,setInputMessage]=useState('');
  const messageInputHandler=(text)=>{
    setInputMessage(text);
  }

  const writeMessage=async(message)=>{
    console.log("Check status    :",await checkConnected(detailState.deviceId))
    if(await checkConnected(detailState.deviceId)){
      const sendData=base64.encode(message);
      console.log("Device in msg ,",detailState.serviceUUID,sendData)
      if(detailState.deviceId!==''){
        manager.writeCharacteristicWithResponseForDevice(detailState.deviceId,
          detailState.serviceUUID,detailState.characteristicsUUID,sendData).then((characteristics)=>{
          console.log(characteristics);
          alert("success");
          return
        }).catch(error=>{
        console.log(error)
      })
    }else{
      console.log("device not connected");
    }

  }else{
    alert("Device reconnection start :");
    scanAndConnectDevices()
  }
}


  return(
    <View style={styles.mainContainer}>

             <View style={{alignItems:'center',justifyContent:'center',flex:1}}>
                      
                        {detailState.deviceId ? 
                            (
                                <Button warning block onPress={disconnect}>
                                    <Text>Disconnect</Text>
                                </Button>
                            ) : (
                                <Button block onPress={scanAndConnect}>
                                    <Text>Scan for a device</Text>
                                </Button>
                            )
                        }
                    </View>
                    <View style={{alignItems:'center',marginVertical : 10}}>
                        <Text>{detailState.text1}</Text>
                    </View>
                    
                    
                      {
                        detailState.deviceId ?
                        <View>
                          <TextInput
                        value={inputMessage}
                        style={styles.textInputStyle}
                        keyboardType='default'
                        placeholder="Enter message..."
                        onChangeText={messageInputHandler}
                        onSubmitEditing={()=>{
                          Keyboard.dismiss()
                          writeMessage(inputMessage)
                        }
                        }
                        returnKeyType='done'
                      />
                      <View style={{justifyContent:'space-between',width:'100%',flexDirection:'row',marginBottom:10}}>
                        <Button  onPress={()=>writeMessage(inputMessage)}>
                            <Text>Send Message</Text>
                        </Button>
                        <Button   onPress={readCharacteristics}>
                            <Text>Read Data</Text>
                        </Button>
                        </View>
                        </View>
                        :
                        null
                      }             
                      
   </View>
           
  )
};

const styles=StyleSheet.create({
  textInputStyle:{
    width:'100%',
    marginBottom:15,
    borderWidth:1,
    borderRadius:25,
    paddingHorizontal:10,
  },
  mainContainer:{
    flex:1,
    paddingHorizontal:15
  }
})

export default App;
