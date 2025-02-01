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
import { User } from './user';

export class UsersGet200Response {
    'users'?: Array<User>;
    'total'?: number;
    'page'?: number;
    'pages'?: number;

    static discriminator: string | undefined = undefined;

    static attributeTypeMap: Array<{name: string, baseName: string, type: string}> = [
        {
            "name": "users",
            "baseName": "users",
            "type": "Array<User>"
        },
        {
            "name": "total",
            "baseName": "total",
            "type": "number"
        },
        {
            "name": "page",
            "baseName": "page",
            "type": "number"
        },
        {
            "name": "pages",
            "baseName": "pages",
            "type": "number"
        }    ];

    static getAttributeTypeMap() {
        return UsersGet200Response.attributeTypeMap;
    }
}

