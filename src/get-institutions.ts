import {APIGatewayProxyHandler} from 'aws-lambda';
import randomLocation from 'random-location'
import 'source-map-support/register';

const RANDOM_DATA_COUNT: number = 40;

export const handler: APIGatewayProxyHandler = async (event, _context) => {
    const longitude: number = parseFloat(event.queryStringParameters['lon']);
    const latitude: number = parseFloat(event.queryStringParameters['lat']);
    const area: number = parseFloat(event.queryStringParameters['area']);

    const testDataStartPoint = {
        longitude,
        latitude
    };

    const randomData = [];

    for (let i = 0; i < RANDOM_DATA_COUNT; i++) {
        const randomPoint = randomLocation.randomCirclePoint(testDataStartPoint, area * 1000);
        const isHospital = i % 2 == 0;

        randomData.push({
            "id": i,
            "name": (isHospital ? "Krankenhaus" : "Arztpraxis") + " " + i,
            "type": isHospital ? "HOSPITAL" : "DOCTOR",
            "street": "ANYTHING ELSE",
            "city": "ANY_CITY",
            "postal_code": "POSTAL_CODE",
            "phone_number": "123123131",
            "website": "http://example.com",
            "longitude": randomPoint.longitude,
            "latitude": randomPoint.latitude,
            "comment": "Bitte nicht ohne Termin",
            "opening_hours":[
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
                isHospital ?
                {
                    "type": "Intensivbetten",
                    "max_available": 16,
                    "in_use": 12,
                    "last_update": new Date().toDateString()
                } : null,
                isHospital ?
                {
                    "type": "Betten",
                    "max_available": 30,
                    "in_use": 20,
                    "last_update": new Date().toDateString()
                } : null,
            ].filter(value => !value),
            "waiting_times": isHospital ? [] : [
                {
                    "type": "Hausbesuch",
                    "waiting_time": "2 Tage",
                    "last_update": new Date().toDateString()
                },
            ],
        });
    }

    return {
        statusCode: 200,
        body: JSON.stringify(randomData),
    };
};
