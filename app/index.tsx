import React, { ElementType, useEffect, useRef, useState } from 'react';
import { Text, View, StyleSheet, ScrollView } from 'react-native';
import { Button, PaperProvider, TextInput, Chip } from 'react-native-paper';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import ICAL from "ical.js";
import * as FileSystem from 'expo-file-system';
import { ThemedView } from '@/components/ThemedView';
import Ical from './ical';
const { StorageAccessFramework } = FileSystem;
import * as Calendar from 'expo-calendar';

function HomeScreen() 
{
  //const insets = useSafeAreaInsets();
  const [urlstr, setUrl] = useState('');
  const [chips, setChips]:any = useState([]);
  // useEffect(() => {
  //   console.log(chips);
  // }, [chips]);
  const ical = useRef(new Ical());

  return (
    <ThemedView style={styles.container}>
      <TextInput
        id="textfieldUrl"
        label="Ical URL"
        value={urlstr}
        style={{width:'80%'}}
        onChangeText={text => text.includes("webcal") ? setUrl(text.replace("webcal:", "https:")) : setUrl(text) }
      />
      <Button
        id="btnLoad"
        mode="contained"
        onPress={() => onOkClick()}>
          Importer
      </Button>
      <Button
        id="btnSave"
        mode="contained"
        onPress={() => onSaveClick()}>
          Exporter
      </Button>
      <ScrollView style={{width:'80%', maxHeight: "60%"}} contentContainerStyle={{ alignItems:"flex-start", justifyContent: 'space-evenly', rowGap: 7}}>
      {chips.map((chip:any) => (
        <Chip 
          key={chip.id}
          onClose={() => onChipClose(chip.name)}
          >
            {chip.name}
        </Chip>
      ))}
      </ScrollView>
    </ThemedView>
  );

  async function onOkClick()
  {
    const events = await ical.current.parse(urlstr);
    setChips(events);
  }

  function onChipClose(name: string)
  {
    setChips(
      chips.filter((a:any) =>
        a.name !== name
      ));

    ical.current.removeByName(name);
  }

  async function onSaveClick()
  {
    await save("test.ics", "text/calendar", ical.current.exportStr());//ics);
  }
}

async function save(filename:string, mime:string, strData:string)
{
  const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();
  // Check if permission granted
  if (permissions.granted) {
    // Get the directory uri that was approved
    let directoryUri = permissions.directoryUri;
    // Create file and pass it's SAF URI
    await StorageAccessFramework.createFileAsync(directoryUri, filename, mime).then(async(fileUri) => 
    {
      // Save data to newly created file
      await FileSystem.writeAsStringAsync(fileUri, strData, { encoding: FileSystem.EncodingType.UTF8 });
    })
    .catch((e) => {
      console.log(e);
    });
  } else {
    alert("You must allow permission to save.")
  }
}

export default function App() {
  
  return (
    <PaperProvider>
        <SafeAreaProvider>
          <HomeScreen/>
        </SafeAreaProvider>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-evenly',
    alignItems: 'center',
  }
});