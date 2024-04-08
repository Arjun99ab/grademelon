import axios from "axios";
require("dotenv").config();

import { Client, loginVUE } from "./StudentVUE";

const USERNAME = process.env.USERNAME;
const PASSWORD = process.env.PASSWORD;
const DISTRICTURL = "https://md-mcps-psv.edupoint.com/";

let client:Client;

const login = async () => {
    await loginVUE(USERNAME, PASSWORD, DISTRICTURL).then((c: Client) => {
        client = c;
    })
};

const main = async () => {
    await login();
    await client.getClasses();
    client.getClasses().then((data) => {
        console.log(JSON.stringify(data));
    })
}

main();