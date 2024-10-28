import ICAL from "ical.js";
import AsyncStorage from '@react-native-async-storage/async-storage';

class Ical 
{
    private vcalendar: ICAL.Component | undefined;
    private components: ICAL.Component[] | undefined;
    public blacklist: string[];
    private static lastUrl: string = "";

    private static readonly URL_KEY = 'url';
    private static readonly BLACKLIST_KEY = "blacklist";

    
    constructor() 
    {
        this.blacklist = ["Vacances"];
    }

    public async parse(url:string | null)
    {
        if(!url)
        {
            if(Ical.lastUrl) url = Ical.lastUrl;
            else{
                this.loadUrl();
                if(Ical.lastUrl) url = Ical.lastUrl;
                else return null;
            }
        }

        const resp = await fetch(url);
        const icalstr = await resp.text();
        const jcalData = ICAL.parse(icalstr);
        this.vcalendar = new ICAL.Component(jcalData);

        this.components = this.vcalendar.getAllSubcomponents("vevent");
        let events : {id:string, name:string}[] = [];

        this.components.forEach(element => {
            let vevent = new ICAL.Event(element);
            let title = getEventTitle(vevent.summary);
            let id = getEventId(vevent.description);
            console.log(title, id);
            if(!events.some(e => e.name == title) 
                && !this.blacklist.includes(title))
                //&& (this.components && !this.components.find(e => new ICAL.Event(e).uid == vevent.uid)))
                {
                    events.push({id: id, name: title});
            }
        });

        Ical.lastUrl = url;

        return events;
    }

    public removeById(id:string)
    {
        if(this.components == undefined) return;
        this.components = 
            this.components.filter(e => new ICAL.Event(e).description.includes(id) == false);
    }

    public removeByName(name:string)
    {
        if(this.components == undefined) return;
        this.components = 
            this.components.filter(e => new ICAL.Event(e).summary.includes(name) == false);
    }

    public addFilter(name:string)
    {
        this.blacklist.push(name);
        this.removeByName(name)
    }

    public removeFilter(name:string)
    {
        this.blacklist = this.blacklist.filter(s => s != name);
    }

    public exportStr(): string
    {
        if(this.components == undefined || this.vcalendar == undefined) return "";

        this.vcalendar.removeAllSubcomponents('vevent');
        for(const e of this.components)
        {
            const title = getEventTitle(new ICAL.Event(e).summary);
            if(!this.blacklist.includes(title))
            {
                this.vcalendar?.addSubcomponent(e);
            }
        }

        return ICAL.stringify(this.vcalendar.jCal);
    }

    public exportOs() : {uid:string, title:string, notes:string, startDate:Date, endDate:Date, location:string}[] | undefined
    {
        if(this.components == undefined || this.vcalendar == undefined) return undefined;

        let events : {uid:string, title:string, notes:string, startDate:Date, endDate:Date, location:string}[] = [];
        this.components.forEach(element => {
            const vevent = new ICAL.Event(element);
            const title = getEventTitle(vevent.summary);
            const desc = vevent.description;
            const startDate = vevent.startDate.toJSDate();
            const endDate = vevent.endDate.toJSDate();
            const location = vevent.location;
            const uid = vevent.uid;

            if(!this.blacklist.includes(title)) 
                events.push({uid, title, notes: desc, startDate, endDate, location})
        });

        return events;
    }

    public async loadBlacklist()
    {
        try 
        {
          const str = await AsyncStorage.getItem(Ical.BLACKLIST_KEY);
          if(!str) return;
          const list = JSON.parse(str);
          if (list) return this.blacklist = list;
        } 
        catch (e) { }
    }

    public async storeBlacklist()
    {
        try 
        {
          await AsyncStorage.setItem(Ical.BLACKLIST_KEY, JSON.stringify(this.blacklist));
        } 
        catch (e) {}
    }

    public async loadUrl()
    {
        try 
        {
          const str = await AsyncStorage.getItem(Ical.URL_KEY);
          if(!str) return;
          return Ical.lastUrl = str;
        } 
        catch (e) { }
    }

    public async storeUrl()
    {
        try 
        {
          await AsyncStorage.setItem(Ical.URL_KEY, Ical.lastUrl);
        } 
        catch (e) {}
    }
  }
  export default Ical

  function getEventTitle(summary: string) : string
  {
      let matches = summary.match(/(.|\n)*?(?:;)/gm);
      if (matches)
      {
          //console.log(matches)
          return matches[1].slice(0, -1);
      }
      else return summary;
  }

  function getEventId(desc: string) : string
  {
      let matches = desc.match(/(?:Event id:)((.|\n)*?)(,)/m);
      if (matches)
      {
          return matches[1].trim();
      }
      else return "";
  }
