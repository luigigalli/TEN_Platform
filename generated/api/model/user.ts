/**
 * TEN API Documentation
 * API documentation for The Experiences Network (TEN)
 *
 * The version of the OpenAPI document: 1.0.0
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

import { RequestFile } from './models';

export class User {
    /**
    * User ID
    */
    'id': number;
    /**
    * User email
    */
    'email': string;
    /**
    * User first name
    */
    'firstName': string;
    /**
    * User last name
    */
    'lastName': string;
    /**
    * User biography
    */
    'bio'?: string;
    /**
    * Account creation timestamp
    */
    'createdAt'?: Date;
    /**
    * Last update timestamp
    */
    'updatedAt'?: Date;

    static discriminator: string | undefined = undefined;

    static attributeTypeMap: Array<{name: string, baseName: string, type: string}> = [
        {
            "name": "id",
            "baseName": "id",
            "type": "number"
        },
        {
            "name": "email",
            "baseName": "email",
            "type": "string"
        },
        {
            "name": "firstName",
            "baseName": "firstName",
            "type": "string"
        },
        {
            "name": "lastName",
            "baseName": "lastName",
            "type": "string"
        },
        {
            "name": "bio",
            "baseName": "bio",
            "type": "string"
        },
        {
            "name": "createdAt",
            "baseName": "createdAt",
            "type": "Date"
        },
        {
            "name": "updatedAt",
            "baseName": "updatedAt",
            "type": "Date"
        }    ];

    static getAttributeTypeMap() {
        return User.attributeTypeMap;
    }
}

