import * as ExpoCal from 'expo-calendar';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

class Calendar
{
    public id : string = ''; 
    private static readonly ID_KEY = "calId";
    private static readonly IDMAP_KEY = "calIdMap";
    private static readonly TITLE = "Upick Calendar";

    private uid_idmap = new Map<string, string>();

    constructor() 
    {
        
    }

    async init()
    {
        const { status } = await ExpoCal.requestCalendarPermissionsAsync();
        if (!(status === 'granted')) return;

        const id = await this.loadId();

        if(!id) 
        {
            this.id = await this.create(Calendar.TITLE);
        }
        else if((await ExpoCal.getCalendarsAsync(ExpoCal.EntityTypes.EVENT)).find((cal) => cal.id == id))
        {
            this.id = id;
            await this.loadMap();
        }
        else 
        {
            this.id = await this.create(Calendar.TITLE);
        }
    }

    private async loadId()
    {
        try 
        {
          const id = await AsyncStorage.getItem(Calendar.ID_KEY);
          if (id !== null) return id;
        } 
        catch (e) { }
    }

    private async storeId(id: string)
    {
        try 
        {
          await AsyncStorage.setItem(Calendar.ID_KEY, id);
        } 
        catch (e) {}
    }

    public async storeMap()
    {
        try 
        {
          await AsyncStorage.setItem(Calendar.IDMAP_KEY, JSON.stringify(Object.fromEntries(this.uid_idmap)));
        } 
        catch (e) {}
    }

    private async loadMap()
    {
        try 
        {
          const str = await AsyncStorage.getItem(Calendar.IDMAP_KEY);
          if(!str) return;
          const obj = JSON.parse(str);
          // console.log(str);
          const map = new Map<string, string>(Object.entries(obj));
          //for (let [key, value] of map) { console.log(key, value); }
          if (map) return this.uid_idmap = map;
        } 
        catch (e) { }
    }

    
    private async getDefaultCalendarSource(name: string) : Promise<any> {
        if(Platform.OS === 'ios') return (await ExpoCal.getDefaultCalendarAsync()).source;
        else return { isLocalAccount: true, name: name };
    }

    private async create(title: string) 
    {
        const defaultCalendarSource = await this.getDefaultCalendarSource(title);
        const newCalendarID = await ExpoCal.createCalendarAsync({
            title: title,
            color: 'yellow',
            entityType: ExpoCal.EntityTypes.EVENT,
            source: defaultCalendarSource,
            sourceId: defaultCalendarSource.id,
            name: title,
            ownerAccount: 'personal',
            accessLevel: ExpoCal.CalendarAccessLevel.OWNER,
        });
        console.log(`Your new calendar ID is: ${newCalendarID}`);
        await this.storeId(newCalendarID);
        return newCalendarID;
    }

    async addEvents(events : {uid:string, title:string, notes:string, startDate:Date, endDate:Date, location:string}[])
    {
        let count = 0;
        for(const event of events)
        {
            if(!this.uid_idmap.get(event.uid))
            {
                const sysEventId = await ExpoCal.createEventAsync(this.id, event);
                this.uid_idmap.set(event.uid, sysEventId);
                console.log(sysEventId + " " + event.title + " " + event.uid);
                count++;
            }
            else if(await ExpoCal.updateEventAsync(this.id, event)) count++;
        }

        this.storeMap();

        return count;
    }
}
export default Calendar