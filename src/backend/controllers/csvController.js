const { processCsv } = require('../services/csvService');
const { getRecentFiles } = require('../utils/fileUtils');
const { combineResults } = require('../utils/combineResults');
const path = require('path');

const getRecentData = async (req, res) => {
  try {
    const { timeframe } = req.params;
    const csvFiles = getRecentFiles(timeframe);


    let dailyResults = {}
    let index = 0
    for (const file of csvFiles) {
      dailyResults[index] = await processCsv(file, index)
      ++index;
    }


    const results = combineResults(timeframe, dailyResults);
    
    if (results) {
      res.json(results);
    } else {
      res.status(500).json({ error: 'Error processing CSV files.' });
    }
  } catch (error) {
    console.error('Error during processing:', error);
    res.status(500).json({ error: 'Error processing the CSV files.' });
  }
};

module.exports = { getRecentData };