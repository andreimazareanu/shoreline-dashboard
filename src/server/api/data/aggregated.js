const Joi = require('@hapi/joi');
const SIMPLE_AGGREGATIONS = ['pow2'];
const GRANULARITY_AGGREGATIONS = ['avg', 'median'];
const ALL_AGGREGATIONS = SIMPLE_AGGREGATIONS.slice().concat(GRANULARITY_AGGREGATIONS);

const getAggregatedSchema = Joi.object({
    tag: Joi.string(),
    id: Joi.string(),
    min_date: Joi.number(),
    max_date: Joi.number(),
    fmt: Joi.string().valid('x_y', 'points_arr', 'points_xy'),
    granularity: Joi.number()
}).xor('tag', 'id');

module.exports = async (req, res) => {
    const { tag, id, min_date, max_date, fmt, granularity } = req.query;
    const { aggregation_type } = req.params;
    if(ALL_AGGREGATIONS.indexOf(aggregation_type) < 0 ) {
        return res.status(422).send("Invalid aggreation type!");
    }
    const DAO = req.app.locals.DAO;
    if(GRANULARITY_AGGREGATIONS.indexOf(aggregation_type) >= 0 && !granularity) {
        return res.status(422).send("granularity needed for this kind of aggreation!");
    }
    const joiResult = getAggregatedSchema.validate( req.query );
    if( joiResult.error ) {
        return res.status(422).send("Bad input. Details: " + JSON.stringify(joiResult.error));
    }

    const x_y_response = await DAO.query(id, tag, {min_date: parseInt(min_date), max_date: parseInt(max_date)});
    const aggregated = [];
    if(SIMPLE_AGGREGATIONS.indexOf(aggregation_type) >= 0 ) {
        for(let series of x_y_response) {
            aggregated.push({
                "id" : series.id, 
                "labels" : series.labels, 
                "data" : DAO.simpleAggregate(series.data, aggregation_type)
            });
        }
    } else {
        for(let series of x_y_response) {
            const aggregatedSeries = DAO.granulatedAggreate(series.labels, series.data, aggregation_type, parseFloat(granularity));
            aggregatedSeries.id = series.id;
            aggregated.push(aggregatedSeries);
        }
    }
    return res.send(DAO.changeToFormat(aggregated, fmt));
    
}