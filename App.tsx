//import { StatusBar } from 'expo-status-bar';

import 'react-native-get-random-values';
const crypto = require('crypto-js');

import {
  CameraView,
  CameraType,
  useCameraPermissions,
} from 'expo-camera';

import { useRef, useState, useContext, createContext } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {firebase, firebaseConfig} from './firebase'

import * as Location from 'expo-location';

import {
  Connection,
  Keypair,
  PublicKey,
  LAMPORTS_PER_SOL,
  Transaction,
  TransactionMessage
} from '@solana/web3.js';

import { useWallet } from '@solana/wallet-adapter-react';

// https://docs.solanamobile.com/react-native/using_mobile_wallet_adapter
import {
  transact,
  Web3MobileWallet,
} from "@solana-mobile/mobile-wallet-adapter-protocol-web3js";

// import { WalletAdapter, walletAdapterIdentity } from "@metaplex-foundation/js";
// import { generateSigner, createUmi, percentAmount, Umi } from "@metaplex-foundation/umi";


export const APP_IDENTITY = {
  name: "Mint A Cap'",
  uri:  'https://mint-a-cap.com',
  icon: "favicon.ico", // Full path resolves to https://yourdapp.com/favicon.ico
};


import { toByteArray } from "react-native-quick-base64";

import {
  Metaplex,
  keypairIdentity,
  bundlrStorage,
  toMetaplexFile,
  NftWithToken,
} from "@metaplex-foundation/js";


import {
  clusterApiUrl,
  VersionedTransaction,
  SystemProgram,
} from "@solana/web3.js";




export default function App() {
  const [facing, setFacing]             = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [imageUri, setImageUri]         = useState(null);
  const cameraRef                       = useRef(null); // Ref to the camera

  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }

  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }


  async function getCurrentLocation() {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.error('Permission to access location was denied');
      return null;
    }

    let location = await Location.getCurrentPositionAsync({});
    return location;
  }


  async function capture() {
    if (cameraRef.current) {
      try {

        const photo = await cameraRef.current.takePictureAsync();
        setImageUri(photo.uri);
        console.log('Image captured: ', photo.uri);

        // FIREBASE
        firebase.initializeApp(firebaseConfig);

        const response        = await fetch(photo.uri);
        const blob            = await response.blob();
        const storage         = getStorage();
        const storageFileName = `photo_${Date.now()}`;
        const storageRef      = ref(storage, `${storageFileName}.jpg`);
        await uploadBytes(storageRef, blob);

        const downloadURL = await getDownloadURL(storageRef);
        console.log('Image uploaded to Firebase: ', downloadURL);

        // Get current location
        const location = await getCurrentLocation();
        if (location) {
          console.log('Current location:', location);
        }


        const authorizationResult = await transact(async (wallet: Web3MobileWallet) => {
          /* ...In callback, send requests to `wallet`... */
          const authorizationResult = await wallet.authorize({
            cluster : 'devnet',
            identity: APP_IDENTITY,
          });

          console.log("Connected to: " + authorizationResult.accounts[0].address);

          return authorizationResult;
        });

        const metadata = {
          name: storageFileName,
          description:
            "NFT minted on Solana on Mobile Phone (Solana Summer Fellowship 2024)",
          image: downloadURL,
          external_url: "https://github.com/Laugharne/ssf_s7_exo",
          attributes: [
            {
              trait_type: "Latitude",
              value     : location?.coords.latitude,
            },
            {
              trait_type: "Longitude",
              value     : location?.coords.longitude,
            },
          ],
          properties: {
            files: [
              {
                uri : downloadURL,
                type: "image/jpeg",
              },
            ],
            category: "image",
          },
          creators: [
            {
              address: authorizationResult.accounts[0].address,
              share  : 100,
            },
          ],
        };

        // Create a reference to the JSON file in Firebase Storage
        const metadataRef = ref(storage, `${storageFileName}.json`);

        // Convert the metadata object to a JSON string
        const metadataJson = JSON.stringify(metadata);
        const blob2 = new Blob([metadataJson], { type: 'application/json' });

        let metaDataUrl = "";

        await uploadBytes(metadataRef, blob2)
          .then((snapshot) => {
            console.log('Metadata uploaded successfully:', snapshot.ref.fullPath);
            return getDownloadURL(metadataRef);
          })
          .then((downloadURL) => {
            console.log('Download URL:', downloadURL);
            metaDataUrl = downloadURL;
          })
          .catch((error) => {
            console.error('Error uploading metadata:', error);
          });

        console.log('JSON Metadata uploaded to Firebase: ', metaDataUrl);

        // const umi = createUmi()
        //   .use(walletAdapterIdentity(walletAdapter))
        //   .use(mplTokenMetadata());

        // if (!umi) {
        //   throw new Error(
        //     "Umi context not initialized!"
        //   );
        // }

        // const mint = generateSigner(umi);

      } catch (error) {
        console.error('Failed for full process:', error);
      }

      console.log("Capture exit !?");
    }
  }

  return (

    <View style={styles.container}>

      <CameraView style={styles.camera} facing={facing} ref={cameraRef}>

      <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.buttonFlip} onPress={toggleCameraFacing}>
            <Text style={styles.text}>Flip Camera</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.buttonCapture} onPress={capture}>
            <Text style={styles.text}>Capture</Text>
          </TouchableOpacity>
        </View>

      </CameraView>

      {imageUri && (
        <View style={styles.imagePreview}>
          <Text style={styles.text}>Image captured: {imageUri}</Text>
        </View>
      )}
    </View>

  );

}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
  },
  camera: {
    flex: 1,
  },

  buttonContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'transparent',
    margin: 64,
  },

  buttonFlip: {
    flex: 1,
    alignItems: 'center',
  },

  buttonCapture: {
    flex: 1,
    alignSelf: 'flex-end',
    alignItems: 'center',
  },

  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },

  imagePreview: {
    padding: 20,
    alignItems: 'center',
  },
});

