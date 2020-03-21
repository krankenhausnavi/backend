import {APIGatewayProxyHandler} from 'aws-lambda';
import 'source-map-support/register';

export const handler: APIGatewayProxyHandler = async (event, _context) => {
    if (
        !event
        || !event.pathParameters
        || !event.pathParameters['institutionId']
    ) {
        return {
            statusCode: 400,
            body: "Required request parameters: lon, lat, area"
        };
    }

    const institutionId = event.pathParameters['institutionId'];

    return {
        statusCode: 200,
        body: JSON.stringify({
            "id": institutionId,
            "name": "Krankenhaus",
            "type": "HOSPITAL",
            "street": "ANYTHING ELSE",
            "city": "ANY_CITY",
            "postal_code": "POSTAL_CODE",
            "phone_number": "123123131",
            "website": "http://example.com",
            "longitude": 124341.31244,
            "latitude": 124341.31244,
            "comment": "Bitte nicht ohne Termin",
            "opening_hours": [
                {
                    "day": "MONTAG",
                    "start_time": "08:00",
                    "end_time": "12:00"
                },
                {
                    "day": "MONTAG",
                    "start_time": "12:00",
                    "end_time": "16:00"
                }
            ],
            "resources": [
                {
                    "type": "Intensivbetten",
                    "max_available": 16,
                    "in_use": 12,
                    "last_update": new Date().toDateString()
                },
                {
                    "type": "Betten",
                    "max_available": 30,
                    "in_use": 20,
                    "last_update": new Date().toDateString()
                }
            ],
            "waiting_times": [],
        }),
    };
};
