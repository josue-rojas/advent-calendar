import './App.css';


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

interface Present {
  title: string;
  note?: string;
}

// max 10
function SnowFlakes({ num }: { num: number; }) {
  const arr = new Array(num).fill(0);

  return <div className='snowflakes'>
    {arr.map((_, index) => {
      return (
        <div className="snowflake" key={`snow-${index}`}>
          ❅
        </div>
      )
    })}
  </div>
}

function getPresent(numberDate: string, month: string): Present {
  return {
    'NOVEMBER15': { title: 'Cheese', note: 'some note that I need to write later but not now'}
  }[`${month}${numberDate}`] || { title: 'No Present Today'};
}

function App() {
  const dateDisplay = getDateFromHash(window.location.hash);
  const numberDate = getNumberText(dateDisplay);
  const month = getMonth(dateDisplay)
  const present = getPresent(numberDate, month);

  return (
    <div className="App">
      {<SnowFlakes num={10}></SnowFlakes>}
      <div className='month'>{month}</div>
      <div className="number">{numberDate}</div>
      <div>{present.title}</div>
    </div>
  );
}

export default App;
