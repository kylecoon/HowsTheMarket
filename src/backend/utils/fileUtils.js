const fs = require('fs');
const path = require('path');

const getRecentFiles = (timeFrame) => {
    const directoryPath = path.join(__dirname, '/../../data/');
    const files = fs.readdirSync(directoryPath);

    // Filter for CSV files
    const csvFiles = files.filter(file => file.endsWith('.csv'));

    // Sort files by their numeric name
    csvFiles.sort((a, b) => {
        const numA = parseInt(a.split('.')[0], 10);
        const numB = parseInt(b.split('.')[0], 10); 
        return numB - numA;
    });

    let fileCount = 0;
    if (timeFrame === 'day') {
        fileCount = 7;
    } else if (timeFrame === 'week') {
        fileCount = 28;
    } else if (timeFrame === 'month') {
        fileCount = 336;
    }

    // If there aren't enough files, return all available files, otherwise, return the most recent ones
    return csvFiles.slice(0, Math.min(fileCount, csvFiles.length))
                    .map(file => path.join(directoryPath, file)); // Return the full path of each file

};

module.exports = { getRecentFiles };