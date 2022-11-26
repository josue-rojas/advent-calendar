import { useState } from 'react';
import './App.css';
import { presents } from './presents';


const DEFAULT_DATE = new Date();
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOVEMBER', 'DECEMBER'];
// const DAYNAME = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

function getDateFromHash(hash: string) {
  try {
    if (hash) {
      const date = new Date(hash.replaceAll('.', '/'));

      // console.log(instanceof date)
      if (date instanceof Date && !isNaN(date.getTime() as unknown as number)) return date;
      else return DEFAULT_DATE;
    } else return DEFAULT_DATE;
  } catch {
    return DEFAULT_DATE;
  }
}

function getNumberText(date: Date): string {
  const day = date.getDate();

  return day < 10 ? `0${day}`: day.toString() ;
}

function getMonth(date: Date): string {
  return MONTHS[date.getMonth()];
}

export interface Present {
  title: string;
  note: string;
  emoji?: string;
}

// max 10
function SnowFlakes({ num, snowflake = '❅'}: { num: number; snowflake?: string }) {
  const arr = new Array(num).fill(0);

  return <div className='snowflakes'>
    {arr.map((_, index) => {
      return (
        <div className="snowflake" key={`snow-${index}`}>
          {snowflake}
        </div>
      )
    })}
  </div>
}

function getPresent(numberDate: string, month: string, year: number): Present {
  return presents[`${month}${numberDate}${year.toString()}`] || { title: 'No Present Today', note: 'Hacks: To view other dates add #12.01.2022 or any other date to the url.'}
}

function App() {
  const [isNoteView, setIsNoteView] = useState(true);
  const dateDisplay = getDateFromHash(window.location.hash);
  const numberDate = getNumberText(dateDisplay);
  const month = getMonth(dateDisplay)
  const year = dateDisplay.getFullYear();
  const { title, note, emoji } = getPresent(numberDate, month, year);


  return (
    <div className="App">
      {<SnowFlakes num={10} snowflake={emoji}></SnowFlakes>}
        <div className={`dateView view ${isNoteView ? 'hide' : 'show'}`}  onClick={() => setIsNoteView(!isNoteView)}>
          <div className='month'>{month}</div>
          <div className="number">{numberDate}</div>
          <div>{title}</div>
        </div>
        <div className={`noteView ${isNoteView ? 'show' : 'hide'}`}>
          <div>
            {note}
          </div>
          <div className={`closeButton ${isNoteView ? '' : 'disable'}`} onClick={() => setIsNoteView(!isNoteView)}>Close</div>
        </div>
      <div className='textWrapper'>
      </div>
    </div>
  );
}

export default App;
