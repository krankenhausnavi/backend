import {APIGatewayProxyHandler} from 'aws-lambda';
import 'source-map-support/register';
import {Database} from './database';

export const handler: APIGatewayProxyHandler = async (event, _context) => {
    if (
        !event
        || !event.pathParameters
        || !event.pathParameters.institutionId
    ) {
        return {
            statusCode: 400,
            body: 'Required path parameter: {id}'
        };
    }

    const institutionId = parseInt(event.pathParameters.institutionId, 10);

    const database = await Database.getInstance();
    const data = await database.getInstitution(institutionId);
    await database.end();

    return {
        statusCode: 200,
        body: JSON.stringify(data)
    };
};
