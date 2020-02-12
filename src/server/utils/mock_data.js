const mock = [
    {
        "id" : "mock_series_1",
        "tags" : ["mock", "first"],
        "data" : [

        ]
    },
    {
        "id" : "mock_series_2",
        "tags" : ["mock", "second"],
        "data" : [

        ]
    },
    {
        "id" : "mock_series_3",
        "tags" : ["third"],
        "data" : [

        ]
    }
];

const startDate = new Date(2020, 1, 1).getTime();
const endDate = new Date(2020, 1, 30).getTime();
for(let d = startDate; d <= endDate; d += 60000) {
    for(let series of mock) {
        series.data.push({'t' : d, d : Math.random() * 1000})
    }
}

module.exports = mock;