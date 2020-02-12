# Time Series App

## Introduction
This is a demo of a visualization dashboard that can be used to query time series.

### Requirments
Users must be able to query time series data on the dashboard by looking up a series by id or tag. They can visualize more than one series at a time, query by a time window and must be able to see derived series.
### Implemented use-cases
I have implemented a PoC for two kinds of derived series:

- A simple derived series that will raise all values to the power of 2
- An aggregation on data: The average and mean of intervals of the series.

### Proposed Front-End UI
I would build the Front-End usin React and use a framework such as CanvasJS for displaying the graphs. A mock-up of the UI can be seen below:
![enter image description here](https://i.ibb.co/LvWtdf1/mockup.png)
The users can view time series on this page. When the "+" button is clicked, a blank canvas will be displayed, as shown in the second box. The user can input the tag or ID of the series, enter a time range and click the ellipsis for more options regarding aggregation. When the check mark is clicked, data will be displayed here. The user can zoom in or out in the graph and the time frame will be automatically changed.

### Proposed API
The proposed API is a simple one, consisting in two endpoints that we will describe below. 
| Method| HTTP Request | Description |
|--|--|--|
|getSeries| GET /data/series | Gets data for one or more time series |
|getDerivedSeries| GET /data/series/:derivation_function | Gets data derived from one or more time series 

All the requests must be authorized either by cookie or by a bearer token. In this mockup all requests that contain either a cookie or a bearer token are authorized, regardless of content.

#### The getSeries API

##### HTTP Request

    GET /data/series
##### Parameters
| Name | Value | Description |
|--|--|--|
| tag | string | The tag we query for selecting a series |
| id | string | The id of the queried series |
| min_date| number | (optional) Timestamp of the start of the time window |
| max_date| number | (optional) Timestamp of the end of the time window |
| fmt | string | (optional) The format of the response. Can be one of `x_y`, `points_arr` or `points_xy`. Defaults to `x_y`

At least one of the `tag` or `id` fields must be given.

#### The getDerivedSeries API
##### HTTP Request

    GET /data/series/:derivation_function 

##### Parameters
The parameters of this API are the same as above, with two differences:

- A derivation function must be provided. For now the allowed values are:
	
	- `pow2` - Raises all data to the power of 2. Does not need the `granulation` field.
	- `avg` - Computes the average of the series with a time granularity. Needs the `granulation` field
	- `median` - Computes the median of the series with a time granularity. Needs the `granulation` field 

- For some kinds of derivation functions (see above), the `granulation` field is needed. It is a number representing the number of milliseconds we want for granulation

#### The response and the `fmt` field

The response will be an array where each element represents a time series.  Each time series will be represented as a JSON, with a format depending on the `fmt` field
In the mock-up three data formats are available:

- `x_y` - The basic format. The JSON representing the series will have the following fields:

	- `labels` - An array of timestamps
	- `data` - An array of data
	- `id` - The id of the series
	
- `points_arr` - The following fields are present:

	- `data` - An array of arrays with two elements: The label and the value for the data.
	- `id` - The id of the series

- `points_xy` - The following fields are present:

	- `data` - An array of objects with two fields: `x` and `y` representing the point's coordinates on the graph
	- `id` - The id of the series 

#### API Examples
##### Request
    GET data/series/avg?tag=mock&granularity=600000&fmt=points_xy&min_date=1580528120000&max_date=1580548120000
##### Response

    [
    {
        "id": "mock_series_1",
        "data": [
            {
                "x": 1580528160000,
                "y": 415.24301589654664
            },
            {
                "x": 1580528820000,
                "y": 650.2601051656743
            },
            ...
            {
                "x": 1580547960000,
                "y": 412.13119423678467
            }
        ]
    },
    {
        "id": "mock_series_2",
        "data": [
            {
                "x": 1580528160000,
                "y": 480.8020993521384
            },
            {
                "x": 1580528820000,
                "y": 657.7834627872433
            },
            ...
            {
                "x": 1580547960000,
                "y": 502.5215061710842
            }
        ]
    }
    ]
##### Request

    GET /data/series?tag=mock
##### Response

    [
    {
        "id": "mock_series_1",
        "labels": [
            1580508000000,
            1580508060000,
            1580508120000,
            ...
        ],
        "data" : [
            885.9187546121497,
            462.2519339431028,
            459.3803617135088,
            ...
        ]
    }]
##### Request

    GET /data/series/pow2?id=mock_series_3&fmt=points_arr

##### Response

    [
    {
        "id": "mock_series_3",
        "data": [
            [
                1580508000000,
                172814.7669185325
            ],
            [
                1580508060000,
                45827.04729946683
            ],
            [
                1580508120000,
                3041.824164904737
            ],
            ...
        ]
    }]

### Proposed Data Source
#### What we need

The data source or service should provide the following functionalities:

- The ability to query time series based on tags or by id
- The ability to perform aggregations on data

#### A proposed technique 
One way we could implement this is by using MongoDB. We can store the data in the time series in databases with the following format: `MAGIC_YYYY_MM` where `MAGIC` is a string that corresponds to one series.  The `YYYY` and `MM` fields represent the year and the month of the time series data that is stored in a given DB.
This type of storage allows for easy dumping of old data (Which we could use some background workers and parse the dumps as a job if data so old needed). Queries of data spanning through multiple months is easy, as we just need to query the databases one at a time and concatenate the results. The same is true for aggregations.
The data format would be simple: A JSON with two fields: `t` for the timestamp and `d` for the value

##### Getting time series data
Getting simple data is easy. All we need to do is choose the databases we need to query based on the time series, query the databases and concatenate the results. We can use indexing to make sure the data is sorted. Because each database stores data from a month, concatenation of the queries on `MAGIC_YY_MM` and `MAGIC_YY_MM+1` databases will give a sorted array.

##### Aggregation
Aggregation is simple, as MongoDB offers a strong engine for this. We will need to aggregate all the databases in parallel and concatenate the results. The only downfall is the need to take extra care for the data at the start and end of the month, for larger granulations.
The pipeline for a granulated query would look something like this:

    [
    {"$match" : {"t" : {"$gte" : min_date, "$lte" : "max_date"}}},
    {"$group" : {
        "_id" : { 
            "$subtract" : [
                {"$subtract" : ["$t", new Date("1970-01-01")]},
                {"$mod" : [
                    {"$subtract" : ["$t", new Date("1970-01-01")]},
                    granulation
                ]}
            ]
        }
        "avg" : {
            "$avg" : "d"
        }
    }}
]
