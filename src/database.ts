import {Connection, ConnectionConfig, createConnection} from 'mysql';

export interface IOpeningHour {
    day: string,
    start_time: any,
    end_time: any
}

export interface IResource {
    type: string,
    max_capacity: number,
    current_capacity: number,
    last_update: any
}

export interface IWaitingTime {
    type: string,
    waiting_time: string,
    last_update: any
}

export interface IInstitution {
    id: number,
    name: string,
    distance?: number,
    type: string,
    street: string,
    city: string,
    postcode: string,
    phone: string,
    website: string,
    email: string,
    latitude: number,
    longitude: number,
    comment: string,
    opening_hours?: IOpeningHour[],
    resources?: IResource[],
    waiting_times?: IWaitingTime[]
}

// @ts-ignore
interface IContainerForInstitute<O> {
    item: O,
    institution_id: number,
}

export class Database {
    private static instance: Database;

    connection: Connection;

    private constructor(connection: Connection) {
        this.connection = connection;
    }

    static async getInstance(): Promise<Database> {
        if (this.instance != null) {
            return this.instance;
        }
        try {
            const connection = await this.promisedConnect();
            return new Database(connection);
        } catch (e) {
            throw new Error('Connecting to database failed! Error: ' + JSON.stringify(e));
        }
    }

    private static promisedConnect(): Promise<Connection> {
        return new Promise<Connection>((resolve, reject) => {
            const connection = createConnection(this.getConfig());
            connection.connect(err => {
                if (err) {
                    reject(err);
                    return;
                }

                resolve(connection);
            })
        });
    }

    private static getConfig(): ConnectionConfig {
        return {
            host: process.env.RDS_HOSTNAME,
            user: process.env.RDS_USERNAME,
            password: process.env.RDS_PASSWORD,
            port: parseInt(process.env.RDS_PORT, 10),
            database: process.env.RDS_DATABASE,
            timeout: 10
        };
    }

    public getInstitution(institutionId: number): Promise<IInstitution> {
        return new Promise((resolve, reject) => {
            this.connection.query(
            `SELECT
                    inst.id,
                    inst.name,
                    inst.type,
                    inst.street,
                    inst.city,
                    inst.postcode,
                    inst.phone as phone_number,
                    inst.website,
                    inst.lat as latitude,
                    inst.lon as longitude,
                    ST_DISTANCE(POINT(48.78232, 9.17702), POINT(inst.lat, inst.lon)) as distance,
                    CONCAT('[',IFNULL(CONVERT(GROUP_CONCAT(DISTINCTROW JSON_OBJECT(
                            'day', oh.day, 'start_time',
                            oh.start_time, 'end_time',
                            oh.end_time) SEPARATOR ',')
                                              USING
                                              utf8), ''), ']') as opening_hours,
                    CONCAT('[',CONVERT(GROUP_CONCAT(DISTINCTROW JSON_OBJECT('type', res.resource_type,
                                                                            'max_capacity',
                                                                            res.max_capacity,
                                                                            'current_capacity',
                                                                            res.current_capacity,
                                                                            'last_update', res.timestamp)
                                                    SEPARATOR ',') USING utf8) , ']') as resources,
                    CONCAT('[', CONVERT(GROUP_CONCAT(DISTINCTROW JSON_OBJECT('type', wt.service_type,
                                                                             'waiting_time', wt.waiting_time,
                                                                             'last_update', wt.timestamp)
                                                     SEPARATOR ',') USING utf8) , ']') as waiting_times
            FROM 
                institutions as inst,
                opening_hours as oh,
                resources as res,
                waiting_times as wt
            WHERE inst.id = ?
                AND oh.institution_id = inst.id
                AND res.institution_id = inst.id
                AND wt.institution_id = inst.id
            GROUP BY inst.id`,
        [institutionId],
        (error, dbRecords) => {
                    if (error) {
                        reject(error);
                        return;
                    }

                    if (!dbRecords) {
                        resolve(null);
                        return;
                    }

                    const result: IInstitution = this.mapInstitutions(dbRecords)[0];
                    resolve(result);
                }
            );
        });
    }

    public getInstitutions(latitude: number, longitude: number, area: number): Promise<IInstitution[]> {
        return new Promise((resolve, reject) => {
            this.connection.query(
                `SELECT
                    inst.id,
                    inst.name,
                    inst.type,
                    inst.street,
                    inst.city,
                    inst.postcode,
                    inst.phone as phone_number,
                    inst.website,
                    inst.lat as latitude,
                    inst.lon as longitude,
                    ST_DISTANCE(POINT(?, ?), POINT(inst.lat, inst.lon)) as distance,
                    CONCAT('[',IFNULL(CONVERT(GROUP_CONCAT(DISTINCTROW JSON_OBJECT(
                                                                'day', oh.day, 'start_time',
                                                                  oh.start_time, 'end_time',
                                                                  oh.end_time) SEPARATOR ',')
                                         USING
                                         utf8), ''), ']') as opening_hours,
                    CONCAT('[',CONVERT(GROUP_CONCAT(DISTINCTROW JSON_OBJECT('type', res.resource_type,
                                                                  'max_capacity',
                                                                  res.max_capacity,
                                                                  'current_capacity',
                                                                  res.current_capacity,
                                                                  'last_update', res.timestamp)
                                                      SEPARATOR ',') USING utf8) , ']') as resources,
                    CONCAT('[', CONVERT(GROUP_CONCAT(DISTINCTROW JSON_OBJECT('type', wt.service_type,
                                                                  'waiting_time', wt.waiting_time,
                                                                  'last_update', wt.timestamp)
                                                      SEPARATOR ',') USING utf8) , ']') as waiting_times
            FROM 
                institutions as inst,
                opening_hours as oh,
                resources as res,
                waiting_times as wt
            WHERE
                inst.lat + 0.1 < ?
                AND inst.lon + 0.1 < ?
                AND inst.lat - 0.1 < ?
                AND inst.lon - 0.1 < ?
                AND ST_Distance(POINT(?, ?), POINT(inst.lat, inst.lon)) < ?
                AND oh.institution_id = inst.id
                AND res.institution_id = inst.id
                AND wt.institution_id = inst.id
            GROUP BY inst.id ORDER BY distance`,
                [latitude, longitude, latitude, longitude, latitude, longitude, latitude, longitude, area],
                (error, dbRecords) => {
                    if (error) {
                        reject(error);
                        return;
                    }

                    if (!dbRecords) {
                        resolve(null);
                        return;
                    }

                    const result: IInstitution[] = this.mapInstitutions(dbRecords);
                    resolve(result);
                }
            );
        });
    }

    mapInstitutions(records: any[]): IInstitution[] {
        return records.map(value => {
            value.opening_hours = JSON.parse(value.opening_hours);
            value.resources = JSON.parse(value.resources);
            value.waiting_times = JSON.parse(value.waiting_times);
            return value;
        });
    }

    public end() {
        return new Promise((resolve, reject) => {
            this.connection.end((err => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve();
            }));
        });
    }
}
