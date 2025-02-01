import { DataSource } from "typeorm";
import { User } from "./models/User";
import { Group } from "./models/Group";
import { Customer } from "./models/Customer";
import { Role } from "./entities/Role";
import { Permission } from "./entities/Permission";

export const AppDataSource = new DataSource({
    type: "postgres",
    host: "localhost",
    port: 5432,
    username: "luigigalli",
    database: "ten_platform",
    synchronize: true,
    logging: true,
    entities: [User, Group, Customer, Role, Permission],
    subscribers: [],
    migrations: [],
});
