import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import Ical from './ical';
import Calendar from './calendar';//


const UPDATE_CAL_TASK_NAME = 'upick-sync';
const TASK_INTERVAL = 60 * 15;//15 min

TaskManager.defineTask(UPDATE_CAL_TASK_NAME, async () => {
  
  console.log("running task");

  // await fetch('http://192.168.1.15:3000/log', {
  //   method: 'POST',
  //   body: "running task"
  // });

  const ical = new Ical();
  const cal = new Calendar();
  await cal.init();
  await ical.loadBlacklist();
  const lastUrl = await ical.loadUrl();
  
  if(!lastUrl) return BackgroundFetch.BackgroundFetchResult.Failed;

  await ical.parse(lastUrl);

  const events = ical.exportOs();

  // await fetch('http://192.168.1.15:3000/log', {
  //   method: 'POST',
  //   body: "parse done"
  // });

  if(!events) return BackgroundFetch.BackgroundFetchResult.Failed;
  
  const nb_updated = await cal.addEvents(events);

  console.log("update: " + nb_updated);

  // await fetch('http://192.168.1.15:3000/log', {
  //   method: 'POST',
  //   body: "update: " + nb_updated
  // });

  return nb_updated ? BackgroundFetch.BackgroundFetchResult.NewData : BackgroundFetch.BackgroundFetchResult.NoData;
});

export async function registerRecurringTask() {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(UPDATE_CAL_TASK_NAME);
    if(isRegistered) return;

    console.log('registrering');

    return BackgroundFetch.registerTaskAsync(UPDATE_CAL_TASK_NAME, {
        minimumInterval: TASK_INTERVAL,
        stopOnTerminate: false, // android only,
        startOnBoot: true, // android only
      });
}