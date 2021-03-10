import {BleManager} from 'react-native-ble-plx';
import {Platform,ToastAndroid} from 'react-native';
import Permissions from 'react-native-permissions';
import base64 from 'react-native-base64'

const manager=new BleManager();

export const getPermission=()=>{
    if(Platform.OS==='android'){
        Permissions.check(Permissions.PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION).then((result)=>{
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

export const checkConnected=async(deviceId)=>{
        if(deviceId===''){
          return;
        }else{
        let isConnected='';
        await manager.isDeviceConnected(deviceId).then((status)=>{
          isConnected=status;
        }).catch((error)=>{
          console.log("Device id is not found...make sure you are connected with device.")
        })
        return isConnected
      }
}


export const alert=(msg)=>{
    ToastAndroid.show(msg,ToastAndroid.LONG);
  }