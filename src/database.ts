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
            this.connection.query('SELECT id, name, type, street, city, postcode, phone as phone_number, website, lat as latitude, lon as longitude FROM institutions WHERE id = ? LIMIT 1', [institutionId], (error, dbRecords) => {
                if (error) {
                    reject(error);
                    return;
                }

                if (!dbRecords) {
                    resolve(null);
                    return;
                }

                const result: IInstitution = dbRecords[0];
                const recordId = result.id;

                const promiseOpeningHours = this.queryOpeningHoursForInstitutions(recordId).then(openingHours => {
                    result.opening_hours = openingHours;
                    return Promise.resolve(openingHours);
                });

                const promiseResources = this.queryResourcesForInstitute(recordId).then(resources => {
                    result.resources = resources;
                    return Promise.resolve();
                });

                const promiseWaitingTimes = this.queryWaitingTimes(recordId).then(waitingTimes => {
                    result.waiting_times = waitingTimes;
                    return Promise.resolve();
                });

                Promise.all([promiseOpeningHours, promiseResources, promiseWaitingTimes]).then(() => {
                    resolve(result);
                }).catch(reject);
            });
        });
    }

    public queryOpeningHoursForInstitutions(institutionId: number):Promise<IOpeningHour[]> {
        return new Promise((resolve, reject) => {
            this.connection.query('SELECT day, start_time, end_time FROM opening_hours WHERE institution_id = ?', [institutionId], (error, dbRecords: any[]) => {
                if (error) {
                    reject(error);
                    return;
                }

                if (!dbRecords) {
                    resolve(null);
                    return;
                }

                const result: IOpeningHour[] = dbRecords;

                resolve(result);
            });
        });
    }

    public queryResourcesForInstitute(institutionId: number):Promise<IResource[]> {
        return new Promise((resolve, reject) => {
            this.connection.query('SELECT resource_type as type, max_capacity, current_capacity, timestamp as last_update FROM resources WHERE institution_id = ?', [institutionId], (error, dbRecords: any[]) => {
                if (error) {
                    reject(error);
                    return;
                }

                if (!dbRecords) {
                    resolve(null);
                    return;
                }

                const result: IResource[] = dbRecords;
                resolve(result);
            });
        });
    }

    public queryWaitingTimes(institutionId: number):Promise<IWaitingTime[]> {
        return new Promise((resolve, reject) => {
            this.connection.query('SELECT service_type as type, waiting_time, timestamp as last_update FROM waiting_times WHERE institution_id = ?', [institutionId], (error, dbRecords: any[]) => {
                if (error) {
                    reject(error);
                    return;
                }

                if (!dbRecords) {
                    resolve(null);
                    return;
                }

                const result: IWaitingTime[] = dbRecords;
                resolve(result);
            });
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
