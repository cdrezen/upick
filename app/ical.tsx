import ICAL from "ical.js";

class Ical 
{
    private vcalendar: ICAL.Component | undefined;
    private components: ICAL.Component[] | undefined;

    private blacklist: string[];
    
    constructor() 
    {
        this.blacklist = ["Vacances"];
    }

    public async parse(url:string)
    {
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
            if(!events.some(e => e.name == title) && !this.blacklist.includes(title)){
                events.push({id: id, name: title});
            }
        });

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
        this.blacklist.push(name);
    }

    public exportStr(): string
    {
        if(this.components == undefined || this.vcalendar == undefined) return "";

        this.vcalendar.removeAllSubcomponents('vevent');
        this.components.forEach(element => {
            this.vcalendar?.addSubcomponent(element);
        });

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
            events.push({uid, title, notes: desc, startDate, endDate, location})
        });

        return events;
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
