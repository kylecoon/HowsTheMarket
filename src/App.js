import React, { useEffect, useState } from 'react';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import {Chart, registerables} from "chart.js";
import {topojson, ChoroplethController, GeoFeature, ProjectionScale, ColorScale} from "chartjs-chart-geo";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, BarElement, LineElement, Title, Tooltip, Legend, Ticks, ArcElement } from 'chart.js';
import { us, stateToAbbr, abbrToState} from "./frontend/components/Maps"
import './assets/styles/styles.css';
import axios from 'axios';

ChartJS.register(CategoryScale, LinearScale, PointElement, BarElement, LineElement, ArcElement, Title, Tooltip, Legend);

Chart.register(ChoroplethController, GeoFeature, ProjectionScale, ColorScale, ...registerables);

const App = () => {
  const [selectedOption, setSelectedOption] = useState('');
  const [dropdownText, setDropdownText] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [textKey, setTextKey] = useState(0);
  const [data, setData] = useState({}); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null); 
  const [fadeIn, setFadeIn] = useState(true);
  const [areWere, setAreWere] = useState(null);
  const [has, setHas] = useState(null);
  const [isWas, setIsWas] = useState(null);
  const [postingsUpOrDown, setPostingsUpOrDown] = useState("Up"); 
  const [percentageChange, setPercentageChange] = useState(null);
  const [salaryUpOrDown, setSalaryUpOrDown] = useState("Up")
  const [salaryChange, setSalaryChange] = useState(0)
  const [topHirer, setTopHirer] = useState(null);
  const [topState, setTopState] = useState(null);
  const [topOfficeType, setTopOfficeType] = useState(null)
  const [officeTableData, setOfficeTableData] = useState([
    { officeType: "On-Site", amount: 0, percentage: "33.3%" },
    { officeType: "Hybrid", amount: 0, percentage: "33.3%" },
    { officeType: "Remote", amount: 0, percentage: "33.3%" }
  ]);
  const [methodologyIsOpen, setMethodologyIsOpen] = useState(false);

  useEffect(() => {
    if (!dropdownText) return; // Don't fetch until an option is selected

    setFadeIn(false);
    setTimeout(() => {
      setSelectedOption(dropdownText);
      let timeframe;
      if (dropdownText === "Yesterday") {
        timeframe = "day";
        setAreWere("Were");
        setHas("");
        setIsWas("Was")
      }
      else if (dropdownText === "This Week") {
        timeframe = "week";
        setAreWere("Are");
        setHas("Has ");
        setIsWas("Is")
      }
      else if (dropdownText === "This Month") {
        timeframe = "month";
        setAreWere("Are");
        setHas("Has ");
        setIsWas("Is")
      }

      const fetchData = async () => {
        setError(null);
        setLoading(true);
        try {
          const response = await axios.get(`https://howsthemarket.xyz/api/${timeframe}`);
          setData(response.data);
          setLoading(false);
          setFadeIn(true);
        } catch (err) {
          setError(err.message || 'Something went wrong!');
        }
      };

      fetchData();
    }, 300)

  }, [dropdownText]);

  useEffect(() => {
    if (Object.keys(data).length === 0) {
      setPercentageChange(0);
      setPostingsUpOrDown("Up");
      return;
    }
    let postingsPercentChange = 0;
    let salaryChange = 0;
    if (data["0"] && !data["1"]) {
      postingsPercentChange = 100;
      salaryChange = data["0"]["avg_salary"]

    }
    if (data["0"] && data["1"]) {
      postingsPercentChange = (((data["0"]["job_count"] - data["1"]["job_count"]) / data["1"]["job_count"]) * 100).toFixed(1);
      salaryChange = (data["0"]["avg_salary"] - data["1"]["avg_salary"]).toFixed(1);
    }
    setPercentageChange(postingsPercentChange);
    setPostingsUpOrDown(postingsPercentChange < 0 ? "Down" : "Up");

    setSalaryChange(salaryChange);
    setSalaryUpOrDown(salaryChange < 0 ? "Down" : "Up");

    let maxKey = Object.keys(data["0"]['company_frequency']).reduce((max, key) => {
      return data["0"]['company_frequency'][key] > data["0"]['company_frequency'][max] ? key : max;
    });
    setTopHirer(maxKey);

    maxKey = Object.keys(data["0"]['state_frequency']).reduce((max, key) => {
      return data["0"]['state_frequency'][key] > data["0"]['state_frequency'][max] ? key : max;
    });
    setTopState(maxKey);

    maxKey = Object.keys(data["0"]['office_type_frequency']).reduce((max, key) => {
      return data["0"]['office_type_frequency'][key] > data["0"]['office_type_frequency'][max] ? key : max;
    });
    setTopOfficeType(maxKey);

    setOfficeTableData([
      { officeType: "On-site", amount: data["0"]["office_type_frequency"]["On-site"], percentage: ((((data["0"]["office_type_frequency"]["On-site"] / data["0"]["job_count"]) * 100).toFixed(1)).toString() + "%") },
      { officeType: "Hybrid", amount: data["0"]["office_type_frequency"]["Hybrid"], percentage: ((((data["0"]["office_type_frequency"]["Hybrid"] / data["0"]["job_count"]) * 100).toFixed(1)).toString() + "%") },
      { officeType: "Remote", amount: data["0"]["office_type_frequency"]["Remote"], percentage: ((((data["0"]["office_type_frequency"]["Remote"] / data["0"]["job_count"]) * 100).toFixed(1)).toString() + "%") }
    ]);

    console.log(officeTableData);

    const root = document.documentElement;
    root.style.setProperty('--primary-color', postingsPercentChange < 0 ? 'firebrick' : 'green');

    const nation = topojson.feature(us, us.objects.nation).features[0];
    const states = topojson.feature(us, us.objects.states).features;
    
    const chart = new Chart(document.getElementById("countryChart").getContext("2d"), {
      type: 'choropleth',
      data: {
        labels: states.map((d) => d.properties.name),
        datasets: [{
          label: 'States',
          outline: nation,
          data: states.map((d) => ({feature: d, value: data["0"]["state_frequency"][stateToAbbr[d.properties.name]]})),
        }]
      },
      options: {
        devicePixelRatio: window.devicePixelRatio,
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
            labels: {
              textAlign: 'left',
            }
          },
          tooltip: {
            callbacks: {
              position: 'nearest',
              label: function(context) {
                return `${context.raw.feature.properties.name}: ${context.raw.value} Jobs`;
              }
            }
          }
        },
        scales: {
          projection: {
            axis: 'x',
            projection: 'albersUsa'  
          },
          color: {
            axis: 'x',
            legend: {
              display: true,
              position: 'bottom-right',
              align: 'right',
              labels: {
                textAlign: 'left',
              }
            },
            interpolate: 'greens',
            ticks: {
              callback: function(value) {
                return Math.floor(value); 
              },
            }
          },
        },
      }
    });
    chart.resize();
  }, [data]); 

  const getYesterdayLabels = () => {
    const daysOfWeek = ["Sun", "Mon", "Tues", "Wed", "Thurs", "Fri", "Sat"];
    
    const today = new Date();
    const currentDay = today.getDay();  // 0 (Sunday) to 6 (Saturday)
    
    // Generate the labels array
    let labels = [];
    for (let i = 0; i < Object.keys(data).length; i++) {
      const labelIndex = (currentDay - Object.keys(data).length + 7 + i) % 7;
      labels.push(daysOfWeek[labelIndex]);
    }
    
    return labels;
  };

  const getWeekLabels = () => {
    return Object.values(data).map(entry => entry.date).reverse();
  };

  const getMonthLabels = () => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec"];
    
    const today = new Date();
    const currentDay = today.getMonth();  // 0 (January) to 11 (December)
    
    let labels = [];
    for (let i = 0; i < Object.keys(data).length; i++) {
      const labelIndex = (currentDay - Object.keys(data).length + 13 + i) % 12;
      labels.push(months[labelIndex]);
    }
    
    return labels;
  };

  const postingsGraphData = data ? {
    labels: Object.values(data).map(entry => entry.date).reverse(),  
    datasets: [
      {
        label: 'Job Count',
        data: Object.values(data).map(entry => entry.job_count).reverse(),  
        backgroundColor: Object.values(data).reverse().map((entry, index, array) => {
          if (index === 0) {
            return 'rgba(0, 128, 0, 0.85)';
          }
          // Compare current job_count with the previous one
          const previousJobCount = array[index - 1].job_count;
          return entry.job_count < previousJobCount ? 'rgba(178, 34, 34, 0.85)' : 'rgba(0, 128, 0, 0.85)';
        }),
        borderColor: '#333',
        borderWidth: 1,
      },
    ],
  } : {};

  const postingsGraphOptions = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (tooltipItem) => {
            return `Job Count: ${tooltipItem.raw}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false, 
        },
        labels: selectedOption === "Yesterday" ? getYesterdayLabels() : 
        (selectedOption === "This Week" ? getWeekLabels() :
        (selectedOption === "This Month" ? getMonthLabels() : [])),
        ticks: {
          minRotation: window.innerWidth < 768 ? 30 : 0,
        },
      },
    },
  };

  const salaryGraphData = data ? {
    labels: Object.values(data).map(entry => entry.avg_salary).reverse(),  
    datasets: [
      {
        label: 'Average Salary',
        data: Object.values(data).map(entry => entry.avg_salary).reverse(),  
        backgroundColor: Object.values(data).reverse().map((entry, index, array) => {
          if (index === 0) {
            return 'rgb(0, 128, 0)'; 
          }
          const previousSalary = array[index - 1].avg_salary; 
          return entry.avg_salary < previousSalary ? 'rgb(178, 34, 34)' : 'rgb(0, 128, 0)'; 
        }),
        borderColor: '#333',  
        pointBorderColor: '#333',
        pointBorderWidth: 2,
        borderWidth: 2,
        pointRadius: window.innerWidth < 767 ? 6 : 10,
        hoverRadius: 12.5,
        tension: 0.3,
      },
    ],
  } : {};

  const salaryGraphOptions = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (tooltipItem) => {
            return `Average Salary: ${tooltipItem.raw}k`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false, 
        },
        labels: selectedOption === "Yesterday" ? getYesterdayLabels() : 
        (selectedOption === "This Week" ? getWeekLabels() :
        (selectedOption === "This Month" ? getMonthLabels() : [])),
        ticks: {
          minRotation: window.innerWidth < 768 ? 30 : 0,
        },
      },
      y: {
        beginAtZero: false, 
        min: Math.floor(Math.min(...Object.values(data).map(entry => entry.avg_salary)) - 1),  
        ticks: {
          callback: function(value) {
            return `${value}k`;
          },
        },
      },
    },
  };

  const companyGraphData = data && data["0"] && data["0"]["company_frequency"] ? {
    labels: Object.keys(data["0"]["company_frequency"]),
    datasets: [
      {
        data: Object.values(data["0"]["company_frequency"]),
        backgroundColor: [
          'rgba(178, 34, 34, 0.8)',
          'rgba(255, 140, 0, 0.8)', 
          'rgba(255, 215, 0, 0.8)',
          'rgba(0, 128, 0, 0.8)',
          'rgba(30, 144, 255, 0.8)',
        ],
        borderColor: [
          'rgba(178, 34, 34, 1)',
          'rgba(255, 140, 0, 1)', 
          'rgba(255, 215, 0, 1)',
          'rgba(0, 128, 0, 1)',
          'rgba(30, 144, 255, 1)',
        ],
        borderWidth: 2,
      },
    ],
  } : {};
  
  const companyGraphOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: window.innerWidth < 768 ? 'bottom' : 'top',
        labels: {
          boxWidth: 10,
          boxHeight: 10,
        },
      },
      tooltip: {
        callbacks: {
          label: function (tooltipItem) {
            return `${tooltipItem.label}: ${tooltipItem.raw}`;
          },
        },
      },
    },
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleSelect = (option) => {
    setIsOpen(false);
    setTextKey((prevKey) => prevKey + 1);
    setDropdownText(option);
    setTimeout(() => {
      console.log(selectedOption, !loading, Object.keys(data).length);
    })
  };

  const togglePanel = () => {
    setMethodologyIsOpen(!methodologyIsOpen);
    console.log(methodologyIsOpen);
  };

  return (
    <div>
      <h1>How's The Job Market</h1>
      <div className="dropdown-container">
        <div className="custom-dropdown" onClick={toggleDropdown}>
          <div className="custom-dropdown-selected">
            <span className={`arrow-down ${isOpen ? 'rotate-down' : 'rotate-right'}`}>&#9662;</span>
            <span key={textKey} className="custom-dropdown-selected-text animate"> {dropdownText}</span>
          </div>
          <div className={`custom-dropdown-options ${isOpen ? 'open' : ''}`}>
            <div className="custom-dropdown-option" onClick={() => handleSelect('Yesterday')}>
              Yesterday
            </div>
            <div className="custom-dropdown-option" onClick={() => handleSelect('This Week')}>
              This Week
            </div>
            <div className="custom-dropdown-option" onClick={() => handleSelect('This Month')}>
              This Month
            </div>
          </div>
        </div>
        <span className="question-mark">?</span>
      </div>

      <div className={`data-container ${fadeIn ? 'fade-in' : 'fade-out'}`}>
        {selectedOption && !loading && Object.keys(data).length > 0 && selectedOption != "This Month" && (
          <div> 
            <div className="section a">
              <div className="stat">
                <span className="stat-text">Job Postings {areWere}</span>
                <span className={`stat-percent ${percentageChange < 0 ? 'negative' : 'positive'}`}> {postingsUpOrDown} {Math.abs(percentageChange)}% </span>
                <span className="stat-timeframe">{selectedOption}</span>
              </div>
              <div className="chart-container" id={`${selectedOption == "This Week" ? "postings" : ""}`}>
                <h1>New Job Postings</h1>
                <Bar data={postingsGraphData} options={postingsGraphOptions} />
                {selectedOption == "This Week" && (
                  <div>
                    <p><br></br></p>
                    <p>Data collection began Nov. 21, 2024</p>
                    <p>Check back in the future for more results</p>
                  </div>
                )}
              </div>
            </div>
            <div className="section b">
              <div className="stat">
                <span className="stat-text">Base Salaries {areWere}</span>
                <span className={`stat-percent ${salaryChange < 0 ? 'negative' : 'positive'}`}> {salaryUpOrDown} ${Math.abs(salaryChange)}k </span>
                <span className="stat-timeframe">{selectedOption}</span>
              </div>
              <div className="chart-container">
                <h1>Average Base Salary</h1>
                <Line data={salaryGraphData} options={salaryGraphOptions} />
              </div>
            </div>
            <div className="section a">
              <div className="stat">
              <span className='stat-percent negative'> {topHirer} </span>
                <span className="stat-text">{has}Posted The Most</span>
                <span className="stat-timeframe"> {selectedOption}</span>
              </div>
              <div className="chart-container doughnut">
                <h1>Top 5 Posting Companies</h1>
                <Doughnut data={companyGraphData} options={companyGraphOptions} id="doughnut"/>
              </div>
            </div>
            <div className="section b">
              <div className="stat">
              <span className='stat-percent positive'> {abbrToState[topState]} </span>
                <span className="stat-text">{has}Posted The Most</span>
                <span className="stat-timeframe"> {selectedOption}</span>
              </div>
              <div className="chart-container country-chart">
                <canvas id="countryChart"></canvas>
              </div>
            </div>
            <div className="section a office">
              <div className="stat">
              <span className='stat-percent positive'> {topOfficeType} </span>
                <span className="stat-text">{isWas} The Most Common </span>
                <span className="stat-timeframe">Office Type {selectedOption}</span>
              </div>
              <div className="chart-container table">
                <table id ="office-table" border="1">
                  <thead>
                    <tr>
                      <th>Office Type</th>
                      <th>Amount</th>
                      <th>Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {officeTableData.map((row, index) => (
                      <tr key={index} className={`row-${index}`}>
                        <td >{row.officeType}</td>
                        <td>{row.amount}</td>
                        <td>{row.percentage}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="section b">
              <div className="methodology-toggle" onClick={togglePanel}>
                <h1><span className={`arrow-down ${methodologyIsOpen ? 'rotate-down' : 'rotate-right'}`}>&#9662;</span> Methodology</h1>
              </div>
              <div className={`methodology-panel ${methodologyIsOpen ? 'open' : 'closed'}`}>
                  <p><br></br>New job postings are collected daily at 12am from LinkedIn with the following search criteria:</p>
                  <br></br>
                  <ul>
                    <li><b>Search: </b>"software"</li>
                    <li><b>Date Posted: </b>Past 24 Hours</li>
                    <li><b>Experience Level: </b>Internship, Entry Level, Associate</li>
                    <li><b>Job Type: </b>Full-time, Part-time, Contract, Internship, Other</li>
                    <li><b>Has Verifications: </b>True</li>
                  </ul>
                  <p><br></br>This search criteria is designed to target the job market prospects for new graduates or those newly entering the software development field.</p>
                  <p><br></br>The "This Month" option aggregates date from the past four weeks, not the current calendar month. This is more helpful than comparing a half finished month to a the full previous month. However, the x-axis on graphs is labeled with the month for simplicity.</p>
                  <b><br></br>Exclusions:<br></br></b>
                  <p><br></br>Job postings from Epic Systems outside of Wisconsin are excluded from the data sets. Epic Systems posts roughly 300 to 500 positions a day across all major cities in America despite only offering on-site positions in Verona, Wisconsin.</p>
                  <p><br></br>Job postings from Varsity Tutors outside of Missouri are excluded from the data sets. Varsity Tutors posts roughly 100 to 200 positions a day across all major cities in America despite only offering remote positions, but they are based in Missouri.</p>
              </div>
            </div>
            <div className="section a">
              <div className='copyright'>
                <p>2024 By Kyle J. Coon</p>
                <p>kylejcoon@gmail.com</p>
              </div>
            </div>
          </div>
        )}
        {selectedOption == "This Month" && (
          <div className="wip">
            <h1>Available Dec. 19</h1>
            <h1>More Data Required</h1>
            <p>Data collection began Nov. 21, 2024</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;