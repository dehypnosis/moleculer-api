export declare type ServiceStatus = {
    message: string;
    code: 200 | 404 | 500 | 503 | number;
    updatedAt: Date;
};
