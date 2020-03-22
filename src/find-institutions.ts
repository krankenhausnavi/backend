import {APIGatewayProxyHandler} from 'aws-lambda';
import 'source-map-support/register';
import {Database} from './database';

export const handler: APIGatewayProxyHandler = async (event, _context) => {
    if (
        !event
        || !event.queryStringParameters
        || !event.queryStringParameters.lat
        || !event.queryStringParameters.lon
        || !event.queryStringParameters.area
    ) {
        return {
            statusCode: 400,
            body: 'Required request parameters: lon, lat, area'
        };
    }

    const latitude: number = parseFloat(event.queryStringParameters.lat);
    const longitude: number = parseFloat(event.queryStringParameters.lon);
    const area: number = parseFloat(event.queryStringParameters.area);

    const database = await Database.getInstance();
    const data = await database.getInstitutions(latitude, longitude, area);
    await database.end();

    return {
        statusCode: 200,
        body: JSON.stringify(data),
    };
};
