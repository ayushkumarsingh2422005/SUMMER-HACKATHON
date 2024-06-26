import React, { useEffect, useState } from 'react';
import { PieChart } from '@mui/x-charts/PieChart';
import Nev from '../Components/Nev';
import { MdAdd } from 'react-icons/md';
import showToastMessage from '../Utils/toast_message';

export default function Budged() {
  const [summaryData, setSummaryData] = useState({
    overall: {},
    monthly: {},
    daily: {},
  });
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [date, setDate] = useState(new Date().getDate());
  const userID = JSON.parse(localStorage.getItem('user')).userID;

  useEffect(() => {
    getSummaryData(year, month, date);
  }, [year, month, date]);

  const getSummaryData = async (year, month, date) => {
    try {
      const overallRes = await fetch(`${import.meta.env.VITE_APP_URL}/api/normals/get-overall-summary/${userID}`);
      const overallData = await overallRes.json();
      const monthlyRes = await fetch(`${import.meta.env.VITE_APP_URL}/api/normals/get-sum-summary-month/${userID}`);
      const monthlyData = await monthlyRes.json();
      const dailyRes = await fetch(`${import.meta.env.VITE_APP_URL}/api/normals/get-detailed-summary-4/${userID}/${year}/${month}/${date}`);
      const dailyData = await dailyRes.json();

      setSummaryData({
        overall: overallData,
        monthly: monthlyData.months,
        daily: dailyData,
      });
      console.log({
        overall: overallData,
        monthly: monthlyData.months,
        daily: dailyData,
      })
    } catch (err) {
      console.error('Error fetching data:', err);
      showToastMessage('error', 'There was a problem retrieving the summary data: ' + err.message);
    }
  };

  const pieChartData = (data, labels) => ({
    series: [
      {
        data: Object.values(data).map((value, index) => ({
          id: index,
          value,
          label: labels[index],
          color: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'][index],
        })),
      },
    ],
  });

  const handleDateChange = (e) => {
    const selectedDate = new Date(e.target.value);
    setYear(selectedDate.getFullYear());
    setMonth(selectedDate.getMonth() + 1);
    setDate(selectedDate.getDate());
  };

  return (
    <div className="bg-gray-100 dark:bg-gray-900 font-family-karla flex sm:flex-row flex-col">
      <Nev />

      <div className="w-full overflow-x-hidden border-t flex flex-col h-[100vh] dark:border-gray-700">
        <main className="w-full flex-grow p-6">
          <h1 className="text-3xl text-black dark:text-white pb-6">Financial Summary</h1>

          <div className="flex flex-wrap mt-6">
            <div className="w-full lg:w-1/2 pr-0 lg:pr-2">
              <p className="text-xl text-black dark:text-white pb-3 flex items-center">
                <i className="fas fa-plus mr-3"></i> Overall Summary
              </p>
              <div className="p-6 bg-white dark:bg-gray-800 dark:text-gray-300">
                <PieChart
                  {...pieChartData(summaryData.overall, ['Borrow', 'Received', 'Spend', 'Earned'])}
                  width={400}
                  height={200}
                />
              </div>
            </div>

            <div className="w-full lg:w-1/2 pl-0 lg:pl-2 mt-12 lg:mt-0">
              <p className="text-xl text-black dark:text-white pb-3 flex items-center">
                <i className="fas fa-check mr-3"></i> Monthly Summary
              </p>
              <div className="p-6 bg-white dark:bg-gray-800">
                {summaryData.monthly[`${year}-${month}`] && (
                  <PieChart
                    {...pieChartData(summaryData.monthly[`${year}-${month}`], ['Borrow', 'Received', 'Spend', 'Earned'])}
                    width={400}
                    height={200}
                  />
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap mt-6">
            <div className="w-full lg:w-1/2 pr-0 lg:pr-2">
              <p className="text-xl text-black dark:text-white pb-3 flex items-center">
                <i className="fas fa-plus mr-3"></i> Daily Summary
              </p>
              <div className="p-6 bg-white dark:bg-gray-800 dark:text-gray-300">
                {summaryData.daily && (
                  <PieChart
                    {...pieChartData(summaryData.daily, ['Borrow', 'Received', 'Spend', 'Earned'])}
                    width={400}
                    height={200}
                  />
                )}
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
