import ICAL from "ical.js";
import React, { ElementType, useEffect, useState } from 'react';

class Ical 
{
    private vcalendar: ICAL.Component | undefined;
    private components: ICAL.Component[] | undefined;
    
    private _events : {id:string, name:string}[];
    public get events() : {id:string, name:string}[] {
        return this._events;
    }
    
    constructor() 
    {
        this._events = [];
    }

    public async parse(url:string)
    {
        const resp = await fetch(url);
        const icalstr = await resp.text();
        const jcalData = ICAL.parse(icalstr);
        this.vcalendar = new ICAL.Component(jcalData);

        this.components = this.vcalendar.getAllSubcomponents("vevent");
        this.components.forEach(element => {
            let vevent = new ICAL.Event(element);
            let title = getEventTitle(vevent.summary);
            let id = getEventId(vevent.description);
            console.log(title, id);
            if(!this._events.some(e => e.name == title) && title != "Vacances"){
                this._events.push({id: id, name: title});
            }
        });

        return this._events;
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

    public export(): string
    {
        if(this.components == undefined || this.vcalendar == undefined) return "";

        this.vcalendar.removeAllSubcomponents('vevent');
        this.components.forEach(element => {
            this.vcalendar?.addSubcomponent(element);
        });

        return ICAL.stringify(this.vcalendar.jCal);
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
