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
        console.log("Hello")
      }
      console.log(device.name)
      if(device.name){
          const serviceUUIDs=device.serviceUUIDs[0];
          setDetailState({
            ...detailState,
            deviceId:device.id,
            text1:"Connect to "+device.name
          })
          manager.stopDeviceScan();
          console.log("hello");
          const isConnected=await manager.isDeviceConnected(device.id);
          console.log(isConnected)
          if(isConnected){
            device.cancelConnection();
          }else{
            manager.connectToDevice(device.id).then((device)=>{
              console.log(device.id);
            }).catch((error)=>{
              console.log(error)
            })
          }

          
        }
    })
  }


  const disconnect=()=>{
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
  }


  return(
    <View style={{flex:1,justifyContent:'center',alignItems:'center'}}>

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
       </View>
  )
};

export default App;
