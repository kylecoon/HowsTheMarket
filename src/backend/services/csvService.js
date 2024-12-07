const fs = require('fs');
const csvParser = require('csv-parser');
const { calculateDateOffset} = require('../utils/dateOffset');

const processCsv = async (filePath, index) => {
    try {
        let job_count = 0;

        let company_frequency = {};
        let company_count = 0;

        let state_frequency = {
            "AL": 0,
            "AK": 0,
            "AZ": 0,
            "AR": 0,
            "CA": 0,
            "CO": 0,
            "CT": 0,
            "DE": 0,
            "DC": 0,
            "FL": 0,
            "GA": 0,
            "HI": 0,
            "ID": 0,
            "IL": 0,
            "IN": 0,
            "IA": 0,
            "KS": 0,
            "KY": 0,
            "LA": 0,
            "ME": 0,
            "MD": 0,
            "MA": 0,
            "MI": 0,
            "MN": 0,
            "MS": 0,
            "MO": 0,
            "MT": 0,
            "NE": 0,
            "NV": 0,
            "NH": 0,
            "NJ": 0,
            "NM": 0,
            "NY": 0,
            "NC": 0,
            "ND": 0,
            "OH": 0,
            "OK": 0,
            "OR": 0,
            "PA": 0,
            "RI": 0,
            "SC": 0,
            "SD": 0,
            "TN": 0,
            "TX": 0,
            "UT": 0,
            "VT": 0,
            "VA": 0,
            "WA": 0,
            "WV": 0,
            "WI": 0,
            "WY": 0
        };
        let state_count = 0;

        let office_type_frequency = {};
        let office_type_count = 0;

        let salary_sum = 0;
        let salary_count = 0;

        await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(csvParser())
            .on('data', (row) => {

                job_count += 1;

                //track salary running total
                if (row['salary'] != 'NA') {
                    salary_sum += parseFloat(row['salary']);
                    salary_count += 1;
                }

                //track company frequency
                if (row['company_name'] != 'NA') {
                    company_count++;
                    if (row['company_name'] in company_frequency) {
                        company_frequency[row['company_name']] += 1;
                    } 
                    else {
                        company_frequency[row['company_name']] = 1;
                    }
                }

                //track state frequency
                if (row['state'] != "NA") {
                    state_count++;
                    if (row['state'] in state_frequency) {
                    state_frequency[row['state']] += 1; 
                    } 
                    else {
                        state_frequency[row['state']] = 1; 
                    }
                }

                //track office type frequency
                if (row['office_type'] != "NA") {
                    office_type_count++;
                    if (row['office_type'] in office_type_frequency) {
                        office_type_frequency[row['office_type']] += 1; 
                        } 
                    else {
                        office_type_frequency[row['office_type']] = 1; 
                    }
                }

            })
            .on('end', resolve) // When the CSV is fully processed
            .on('error', reject); // Handle any errors
        });

        const avg_salary = (salary_sum / salary_count).toFixed(1);

        const state_scale_factor = job_count / state_count
        for (const key in state_frequency) {
            state_frequency[key] = Math.round(state_frequency[key] * state_scale_factor);
        }

        const office_scale_factor = job_count / office_type_count
        for (const key in office_type_frequency) {
            office_type_frequency[key] = Math.round(office_type_frequency[key] * office_scale_factor);
        }

        return {
            date: calculateDateOffset(-index),
            job_count: job_count,
            company_frequency: company_frequency,
            state_frequency: state_frequency,
            avg_salary: parseFloat(avg_salary),
            office_type_frequency: office_type_frequency
        }; 
    } catch (error) {
        console.error('Error processing CSV:', error.message);
        return null;
    }
};

module.exports = { processCsv };