import React, { ElementType, useEffect, useRef, useState } from 'react';
import { Text, View, StyleSheet, ScrollView, Platform } from 'react-native';
import { Button, PaperProvider, TextInput, Chip, Divider } from 'react-native-paper';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system';
import { ThemedView } from '@/components/ThemedView';
import Ical from './ical';
const { StorageAccessFramework } = FileSystem;
import Calendar from './calendar';//
import * as task from './task';
import AsyncStorage from '@react-native-async-storage/async-storage';

function HomeScreen() 
{
  //const insets = useSafeAreaInsets();
  const [urlstr, setUrl] = useState('');
  const [chips, setChips]:any = useState([]);
  const ical = useRef(new Ical());
  const calendar = useRef(new Calendar());
  const [filteringChips, setFilteringChips]:any = useState([]);
  useEffect(() => {
    ical.current.loadBlacklist().then(() => { setFilteringChips(loadFilters());})
    ical.current.loadUrl().then((url) => { if(url) setUrl(url); } )
  }, [])
  

  return (
    <ThemedView style={styles.container}>
      <TextInput
        id="textfieldUrl"
        label="Ical URL"
        value={urlstr}
        style={{width:'80%'}}
        onChangeText={text => text.includes("webcal") ? setUrl(text.replace("webcal:", "https:")) : setUrl(text) }
      />
      <View style={styles1.container}>
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
          Exporter...
      </Button>
      <Button
        id="btnSync"
        mode="contained"
        onPress={() => onSyncClick()}>
          Sync
      </Button>
      </View>
      <Divider style={{width:'100%', margin: 6}} />
      <ScrollView style={{width:'80%'}} contentContainerStyle={{ alignItems:"flex-start", justifyContent: 'space-evenly', rowGap: 7}}>
      {chips.map((chip:any) => (
        <Chip 
          key={chip.id}
          onClose={() => onChipClose(chip.id, chip.name)}
          >
            {chip.name}
        </Chip>
      ))}
      </ScrollView>
      <Divider style={{width:'100%', margin: 6}} />
      <ScrollView style={{width:'80%'}} contentContainerStyle={{ alignItems:"flex-start", justifyContent: 'space-evenly', rowGap: 7}}>
      {filteringChips.map((chip:any) => (
        <Chip 
          style={{backgroundColor: "crimson"}}
          key={chip.id}
          onClose={() => onFilteringChipClose(chip.id, chip.name)}
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

  function onChipClose(id:string, name: string)
  {
    setChips(
      chips.filter((a:any) =>
        a.name !== name
      ));
    
      setFilteringChips([
        ...filteringChips,
        { id: id, name: name }
      ]);
    
      ical.current.addFilter(name);
  }

  function onFilteringChipClose(id:string, name: string)
  {
    setFilteringChips(
      filteringChips.filter((a:any) =>
        a.name !== name
      ));

      setChips([
        ...chips,
        { id: id, name: name }
      ]);

    ical.current.removeFilter(name);
  }

  async function onSaveClick()
  {
    await save("test.ics", "text/calendar", ical.current.exportStr());//ics);
  }

  async function onSyncClick()
  {
    ical.current.storeBlacklist();
    ical.current.storeUrl();

    await calendar.current.init();

    const events = ical.current.exportOs();

    if(!events) return;
    
    await calendar.current.addEvents(events);

    await task.registerRecurringTask();
  }

  function loadFilters()
  {
    const filters = [];
    for(let i = 0; i < ical.current.blacklist.length; i++)
    {
      filters.push({ id: i, name: ical.current.blacklist[i] })
    }
    return filters;
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
    alignItems: 'center'
  }
});

const styles1 = StyleSheet.create({
  container: {
    justifyContent: 'space-evenly',
    alignItems: 'center',
    gap: 7,
    marginTop:7,
  }
});