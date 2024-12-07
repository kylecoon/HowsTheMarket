const combineResults = (timeframe, dailyResults) => {
    let groupings_of_num = 0
    let max_results = 0;

    if (timeframe == "day") {
        for (const key in dailyResults) {
            const entries = Object.entries(dailyResults[key]['company_frequency']);
            const sortedEntries = entries.sort(([, a], [, b]) => b - a);
            const top5 = sortedEntries.slice(0, 5);
            dailyResults[key]['company_frequency'] = Object.fromEntries(top5);
        }
        return dailyResults;
    }
    else if (timeframe == "week") {
        groupings_of_num = 7;
        max_results = 7 * 4
    }
    else if (timeframe == "month") {
        groupings_of_num = 28;
        max_results = 28 * 12
    }


    num_results_to_combine = Object.keys(dailyResults).length;
    if (num_results_to_combine < groupings_of_num) {
        return {};
    }


    let combinedResults = {};
    let totalIndex = 0;
    let numGroupings = 0;

    while (num_results_to_combine >= groupings_of_num) {

        //set grouped results equal to first in group
        let groupingResults = dailyResults[totalIndex.toString()];

        //look through remaining elements of group
        totalIndex++;
        for (let i = 1; i < groupings_of_num; ++i) {
            //sum job count
            groupingResults['job_count'] += dailyResults[totalIndex.toString()]['job_count']

            //combine company_frequency dictionaries
            for (const [key, value] of Object.entries(dailyResults[totalIndex.toString()]['company_frequency'])) {
                if (groupingResults['company_frequency'][key]) {
                    groupingResults['company_frequency'][key] += value;
                } else {
                    groupingResults['company_frequency'][key] = value;
                }
            }

            //combine state_frequency dictionaries
            for (const [key, value] of Object.entries(dailyResults[totalIndex.toString()]['state_frequency'])) {
                if (groupingResults['state_frequency'][key]) {
                    groupingResults['state_frequency'][key] += value;
                } else {
                    groupingResults['state_frequency'][key] = value;
                }
            }

            //track salary running average 
            groupingResults['avg_salary'] = (((groupingResults['avg_salary'] * i) + dailyResults[totalIndex.toString()]['avg_salary']) / (i + 1)).toFixed(1);

            //combine office_type_frequency dictionaries
            for (const [key, value] of Object.entries(dailyResults[totalIndex.toString()]['office_type_frequency'])) {
                if (groupingResults['office_type_frequency'][key]) {
                    groupingResults['office_type_frequency'][key] += value;
                } else {
                    groupingResults['office_type_frequency'][key] = value;
                }
            }
            ++totalIndex;
        }
        //set date range
        groupingResults['date'] = dailyResults[(totalIndex - 1).toString()]['date'] + " - " + dailyResults[(totalIndex - groupings_of_num).toString()]['date']

        //find top 5 hiring companies
        const entries = Object.entries(groupingResults['company_frequency']);
        const sortedEntries = entries.sort(([, a], [, b]) => b - a);
        const top5 = sortedEntries.slice(0, 5);
        groupingResults['company_frequency'] = Object.fromEntries(top5);

        //add group to total combined results
        combinedResults[numGroupings.toString()] = groupingResults;

        numGroupings++;
        num_results_to_combine -= groupings_of_num;
    }

    return combinedResults;
};

module.exports = { combineResults };