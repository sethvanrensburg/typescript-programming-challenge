import * as fs from 'fs';

interface slot {
  start: Date;
  end: Date;
}

interface workerAvailableSlotList {
  workerID: number;
  slots: slot[];
}

function availableSlotFormatter(inputFilePath: string): workerAvailableSlotList[] {
  // read txt file
  const formattedData: workerAvailableSlotList[] = fs.readFileSync(inputFilePath, 'utf-8')
    // seperate new lines into array
    .split('\r\n')
    // map each line into a workerAvailableSlotList object
    .map(workerAvailableSlotList => <workerAvailableSlotList>{
      // separate worker ID from start of string
      workerID: parseInt(workerAvailableSlotList.substring(0, workerAvailableSlotList.indexOf('@'))),
      // separate slot period information from the rest of the string
      slots: workerAvailableSlotList.substring(workerAvailableSlotList.indexOf('[') + 1, workerAvailableSlotList.indexOf(']'))
        // split into array of slot periods
        .split(',')
        // seperate start and end of slot period and place in an object
        .map(availableSlot => {
          const breakStartAndEnd: string[] = availableSlot.split('/')
          return <slot>{
            start: new Date(breakStartAndEnd[0]),
            end: new Date(breakStartAndEnd[1])
          }
        })
    })

  return formattedData;
}

function getTotalAvailabilitySlot(allWorkerSlots: workerAvailableSlotList[]): slot {
  let allSlotDateTimes: Date[] = [];

  // get all slot start and end datetimes
  for (let i = 0; i < allWorkerSlots.length; i++) {
    const worker = allWorkerSlots[i];

    for (let i = 0; i < worker.slots.length; i++) {
      allSlotDateTimes.push(worker.slots[i].start);
      allSlotDateTimes.push(worker.slots[i].end);
    }
  }

  // sort all slots from earliest to latest
  allSlotDateTimes.sort((a: Date, b: Date): number => {
    return a > b ? 1 : a === b ? 0 : -1;
  });

  return <slot>{
    start: allSlotDateTimes[0],
    end: allSlotDateTimes[allSlotDateTimes.length - 1]
  }
}

export async function solveFirstQuestion(inputFilePath: string): Promise<string> {
  const workerAvailableSlotList: workerAvailableSlotList[] = availableSlotFormatter(inputFilePath);
  const totalAvailabilitySlot: slot = getTotalAvailabilitySlot(workerAvailableSlotList);
  return totalAvailabilitySlot.start.toISOString();
}

export async function solveSecondQuestion(inputFilePath: string): Promise<string> {
  const workerAvailableSlotList: workerAvailableSlotList[] = availableSlotFormatter(inputFilePath);
  const totalAvailabilitySlot: slot = getTotalAvailabilitySlot(workerAvailableSlotList);
  return totalAvailabilitySlot.end.toISOString();
}

export async function solveThirdQuestion(inputFilePath: string): Promise<string[]> {
  const workerAvailableSlotList: workerAvailableSlotList[] = availableSlotFormatter(inputFilePath);
  const startDateTime: Date = new Date(await solveFirstQuestion(inputFilePath));
  const endDateTime: Date = new Date(await solveSecondQuestion(inputFilePath));
  let workingDateTime: Date = startDateTime;
  let eligibleDateTimes: Date[] = [];
  let allSlots: slot[] = [];
  let slotStartAndEndDates: Date[] = [];
  let twoOrMoreWorkerSlots: string[] = []

  // get all worker slots into single array
  for (let i = 0; i < workerAvailableSlotList.length; i++) {
    const worker = workerAvailableSlotList[i]
    for (let k = 0; k < worker.slots.length; k++) {
      allSlots.push(worker.slots[k])
    }
  }

  // find all 15 minute increments over entire worker availability period where 2 or more workers are free
  while (workingDateTime >= startDateTime && workingDateTime <= endDateTime) {
    const slotsInRange: slot[] = allSlots.filter(slot => (slot.start <= workingDateTime) && (slot.end >= workingDateTime))

    if (slotsInRange.length >= 2) eligibleDateTimes.push(workingDateTime);

    // add 15 minutes to working datetime
    workingDateTime = new Date(workingDateTime.getTime() + 15 * 60000);
  };

  // get all start and end times for multiple availability slots
  // fist value
  slotStartAndEndDates.push(eligibleDateTimes[0]);
  // middle values
  for (let i = 1; i < eligibleDateTimes.length - 1; i++) {
    if ((eligibleDateTimes[i].getTime() !== (eligibleDateTimes[i - 1].getTime() + 15 * 60000)) || (eligibleDateTimes[i].getTime() !== (eligibleDateTimes[i + 1].getTime() - 15 * 60000))) {
      // findSlotSeparatorIndexArr.push(i)
      slotStartAndEndDates.push(eligibleDateTimes[i]);
    }
  }
  // last value
  slotStartAndEndDates.push(eligibleDateTimes[eligibleDateTimes.length - 1]);

  // format slots into required format
  for (let i = 0; i < slotStartAndEndDates.length; i += 2) {
    twoOrMoreWorkerSlots.push(`${slotStartAndEndDates[i].toISOString()}/${slotStartAndEndDates[i + 1].toISOString()}`);
  }

  return twoOrMoreWorkerSlots;
}