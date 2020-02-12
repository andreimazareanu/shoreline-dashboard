class MockDAO{
    constructor(){
        this._data = require('./mock_data.js');
    }
    binarySearch(array, value) {
        let start=0, end = array.length - 1, mid;
        while(start <= end){
            mid = Math.floor((start+end)/2);
            if(array[mid].t === value){
                return mid;
            }
            else if(array[mid].t < value) {
                start = mid+1;
            } else {
                end = mid-1;
            }
            
        }
        if(array[mid].t > value) {
            return mid;
        }
        return mid+1;
    }
    getMatchingSeries(tag) {
        const matchingSeries = [];
        for(let {id, tags} of this._data) {
            if(tags.indexOf(tag) >= 0) {
                matchingSeries.push(id);
            }
        }
        return matchingSeries;
    }
    getAggregatorFunction(name) {
        switch (name){
            case 'avg' :
                return (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
            case 'median':
                return (arr) => {
                    const sortedArr = arr.slice().sort();
                    if(sortedArr.length % 2 == 0) {
                        return (sortedArr[Math.floor(sortedArr.length / 2) - 1] + sortedArr[Math.floor(sortedArr.length / 2) ]) / 2
                    } 
                    return sortedArr[Math.floor(sortedArr.length / 2)];
                }
            default:
                throw "Unknown aggregation type"
        }
    }

    granulatedAggreate(labels, data, aggregationType, granularity) {
        let appliedFunction;
        switch (aggregationType){
            case 'avg' :
                appliedFunction = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
                break;
            case 'median':
                appliedFunction = (arr) => {
                    const sortedArr = arr.slice().sort();
                    if(sortedArr.length % 2 == 0) {
                        return (sortedArr[Math.floor(sortedArr.length / 2) - 1] + sortedArr[Math.floor(sortedArr.length / 2) ]) / 2
                    } 
                    return sortedArr[Math.floor(sortedArr.length / 2)];
                };
                break;
            default:
                throw "Unknown aggregation type"
        }
        let currentSubset = [data[0]];
        let startOfCurrentSubset = labels[0];
        const aggregatedData = {
            "labels" : [],
            "data" : []
        }
        for(let idx = 1; idx < data.length; ++idx) {
            if(startOfCurrentSubset + granularity < labels[idx]) {
                aggregatedData.labels.push(startOfCurrentSubset);
                aggregatedData.data.push(appliedFunction(currentSubset));
                startOfCurrentSubset = labels[idx];
                currentSubset = [data[idx]];
            } else {
                currentSubset.push(data[idx])
            }
        }
        aggregatedData.labels.push(startOfCurrentSubset);
        aggregatedData.data.push(appliedFunction(currentSubset));
        return aggregatedData;
    }

    simpleAggregate(array, aggregationType) {
        let appliedFunction;
        switch(aggregationType) {
            case "pow2" : 
                appliedFunction = x => x*x;
                break;
            default:
                throw "Unknown function type";
        }
        return array.map(appliedFunction);
    }

    async query(id, tag, {min_date, max_date}) {
        const returnValue = [];
        for(let series of this._data) {
            if(series.id === id || series.tags.indexOf(tag) >= 0) {
                const startIndex = min_date ? this.binarySearch(series.data, min_date) : 0;
                const endIndex =   max_date ? this.binarySearch(series.data, max_date) : series.data.length;
                let keys = ['t','d'],
                [t, d] = series.data.slice(startIndex, endIndex).reduce( (a,b) => {
	                return keys.map( (x,i) => {a[i].push(b[x])}), a;
                }, [[],[]]);
                const rawData = {
                    "id" : series.id,
                    "labels" : t,
                    "data" : d
                }
                returnValue.push(rawData);
            }
        }
        return returnValue;
    }

    changeToFormat(x_y_response, fmt) {
        if(!fmt || fmt == 'x_y') {
            return x_y_response;
        }
        if(fmt === 'points_arr'){
            const points_response = [];
            for(let series of x_y_response) {
                points_response.push({
                    "id" : series.id, 
                    "data" : series.labels.map((_, i) => [series.labels[i], series.data[i]])
                });
            }
            return points_response
        } else if(fmt === 'points_xy'){
            const points_response = [];
            for(let series of x_y_response) {
                points_response.push({
                    "id" : series.id, 
                    "data" : series.labels.map((_, i) => ({'x' : series.labels[i], 'y' : series.data[i]}))
                });
            }
            return points_response
        } else {
            throw "Invalid format"
        }
    }
}

module.exports = MockDAO;