import * as ExpoCal from 'expo-calendar';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

class Calendar
{
    public title : string;
    public id : string; 
    private static readonly ID_KEY = "calId"
    private uid_idmap = new Map<string, string>();

    constructor(title: string) 
    {
        this.title = title;
        this.id = '';
    }

    async init()
    {
        const { status } = await ExpoCal.requestCalendarPermissionsAsync();
        if (!(status === 'granted')) return;

        const id = await this.loadId();

        if(!id) 
        {
            this.id = await this.create(this.title);
        }
        else if((await ExpoCal.getCalendarsAsync(ExpoCal.EntityTypes.EVENT)).find((cal) => cal.id == id))
        {
            this.id = id;
        }
        else 
        {
            this.id = await this.create(this.title);
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
        for(const event of events)
        {
            if(!this.uid_idmap.get(event.uid))
            {
                const eventId = await ExpoCal.createEventAsync(this.id, event);
                this.uid_idmap.set(event.uid, eventId);
                console.log(eventId);
            }
            else await ExpoCal.updateEventAsync(this.id, event);
        }
    }
}
export default Calendar