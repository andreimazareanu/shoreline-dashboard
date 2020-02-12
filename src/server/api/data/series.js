const Joi = require('@hapi/joi');

const getSeriesSchema = Joi.object({
    tag: Joi.string(),
    id: Joi.string(),
    min_date: Joi.number(),
    max_date: Joi.number(),
    fmt: Joi.string().valid('x_y', 'points_arr','points_xy')
}).xor('tag', 'id').with('aggregate', 'granularity');

module.exports = async (req, res) => {
    const {tag, id, min_date, max_date, fmt} = req.query;
    const joiResult = getSeriesSchema.validate( req.query );
    if( joiResult.error ) {
        return res.status(422).send("Bad input. Details: " + JSON.stringify(joiResult.error));
    }

    const x_y_response = await req.app.locals.DAO.query(id, tag, {min_date: parseInt(min_date), max_date: parseInt(max_date)});
    return res.send(req.app.locals.DAO.changeToFormat(x_y_response, fmt));
}