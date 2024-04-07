import axios from 'axios';
// @ts-ignore
import { wrapper } from 'axios-cookiejar-support';
// @ts-ignore
import { CookieJar } from 'tough-cookie';
import RequestException from './RequestException/RequestException';


function loginVUE(username: string, password: string, hostURL: string): Promise<Client> {
    return new Promise((res, rej) => {
        if(hostURL.length === 0) {
            return rej(new RequestException({ message: 'District URL cannot be an empty string' }));
        }
        const host = new URL(hostURL).host 
        const client = new Client(username, password, host);
        client.createSession().then(() => {
            client.setParams().then(() => {
                res(client);
            }).catch((err) => {
                rej(err);
            })
        }).catch((err) => {
            rej(err);
        })
    
    })
}

class Client {
    private hostUrl: string;
    private username: string;
    private password: string;
    private schoolID = '';
    private orgYearGU = '';
    private periods: any;
    public sessionId = '';
    public cookieJar = new CookieJar();
    public client = wrapper(axios.create({
        jar: this.cookieJar,
        baseURL: 'https://md-mcps-psv.edupoint.com/',
        headers: {
            'sec-ch-ua': '"Google Chrome";v="123", "Not:A-Brand";v="8", "Chromium";v="123"', 
            'sec-ch-ua-mobile': '?0', 
            'sec-ch-ua-platform': '"macOS"', 
            'Upgrade-Insecure-Requests': '1', 
            'Connection': 'keep-alive', 
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36', 
            'Sec-Fetch-Site': 'same-origin', 
            'Sec-Fetch-User': '?1', 
            'host': 'md-mcps-psv.edupoint.com', 
        },
        withCredentials: true,
    }));

    constructor(username: string, password: string,  hostUrl: string) {
        this.hostUrl = hostUrl;
        this.username = username;
        this.password = password;
    }
    public createSession(): Promise<void> {
        const loginData = {
            '__EVENTVALIDATION': 'UGw6YPMBC2Ub2woFOSKtuDnEaAJXmBfHSaK42KRG0jHLNFyqVzjvBvvyPphj3Lm3YKf3dz4v5Pc5aOYqM+XUbYjXXKufvDIe3aH47s0hr/VKGOqW29PVii2CuaWytgEvKA5+0/xgxixdX9Gw/ju6izPhdZdhZOvvsNfmFwmdyCk=',
            '__VIEWSTATE': 'wZJYAJ4apaSNIy6vpSc3lfdnAq7DiIZL1BrsRWJxfl4ag36f36MPkJPTqugGwo4e6abcMx4C3JxfFx5AcpumXYAP+KQb/By/GPc54wXQSM4=',
            '__VIEWSTATEGENERATOR': 'E13CECB1',
            'ctl00$MainContent$Submit1': 'Login',
            'ctl00$MainContent$password': this.password,
            'ctl00$MainContent$username': this.username
        };
        const loginConfig = {
            headers: { 
                'Content-Type': 'application/x-www-form-urlencoded', 
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7', 
                'Sec-Fetch-Mode': 'navigate', 
                'Sec-Fetch-User': '?1', 
                'Sec-Fetch-Dest': 'document', 
                'host': 'md-mcps-psv.edupoint.com', 
            },
        };
        return new Promise((resolve, reject) => {
            this.client.post("PXP2_Login_Student.aspx?regenerateSessionId=True", loginData, loginConfig).then(({ config }) => {
                console.log(config);
                if (config.jar) {
                    this.cookieJar = config.jar;
                }
                resolve();
            }).catch((err) => {
                reject(err);
            })
        });
    }
    public getClasses(gradingPeriodGU: string, schoolID: string): Promise<JSON>  {
        const gradebookData = `{"request":{"gradingPeriodGU":"${gradingPeriodGU}","AGU":"0","schoolID":${schoolID}}}`;
        const gradebookConfig = {
            jar: this.cookieJar,
            withCredentials: true,
            headers: { 
                'Content-Type': 'application/json; charset=UTF-8', 
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7', 
                'Sec-Fetch-Mode': 'navigate', 
                'Sec-Fetch-User': '?1', 
                'Sec-Fetch-Dest': 'document', 
                'host': 'md-mcps-psv.edupoint.com', 
                'Origin': 'https://md-mcps-psv.edupoint.com', 
                'Referer': 'https://md-mcps-psv.edupoint.com/PXP2_GradeBook.aspx?AGU=0',
            },
        };
        return new Promise((resolve, reject) => {
            this.client.post("service/PXP2Communication.asmx/GradebookFocusClassInfo", gradebookData, gradebookConfig).then(({ data }) => {
                // console.log(JSON.stringify(data))
                resolve(data);
            }).catch((err) => {
                console.log(err);
                reject(err);
            })
        })
    }

    public getClass(classID: string, gradingPeriodGU: string, orgYearGU: string): Promise<JSON> {
        const loadControlData = `{"request":{"control":"Gradebook_RichContentClassDetails","parameters":{"classID":${classID},"gradePeriodGU":"${gradingPeriodGU}","OrgYearGU":"${orgYearGU}"}}}`;
        const loadControlConfig = {
            jar: this.cookieJar,
            withCredentials: true,
            headers: {
                'Content-Type': 'application/json; charset=UTF-8', 
                'Accept': 'application/json, text/javascript, */*; q=0.01', 
                'Sec-Fetch-Mode': 'cors', 
                'Sec-Fetch-User': '?1', 
                'Sec-Fetch-Dest': 'empty', 
                'Sec-Fetch-Site': 'same-origin', 
                'host': 'md-mcps-psv.edupoint.com', 
                'Origin': 'https://md-mcps-psv.edupoint.com', 
                'Referer': 'https://md-mcps-psv.edupoint.com/PXP2_GradeBook.aspx?AGU=0',
            }
        }

        const classData = '{"FriendlyName":"genericdata.classdata","Method":"GetClassData","Parameters":"{}"}';
        const classConfig = {
            jar: this.cookieJar,
            withCredentials: true,
            headers: {
                'Content-Type': 'application/json; charset=UTF-8', 
                'Accept': 'application/json, text/javascript, */*; q=0.01', 
                'Accept-Language': 'en-US,en;q=0.9',
                'host': 'md-mcps-psv.edupoint.com', 
                'Origin': 'https://md-mcps-psv.edupoint.com', 
                'Referer': 'https://md-mcps-psv.edupoint.com/PXP2_GradeBook.aspx?AGU=0',
                'Sec-Fetch-User': '?1', 
                'Sec-Fetch-Dest': 'empty', 
                'Sec-Fetch-Mode': 'cors', 
                'Sec-Fetch-Site': 'same-origin', 
            }
        }
        return new Promise((resolve, reject) => {
            this.client.post('https://md-mcps-psv.edupoint.com/service/PXP2Communication.asmx/LoadControl', loadControlData, loadControlConfig).then(() => {
                this.client.post('https://md-mcps-psv.edupoint.com/api/GB/ClientSideData/Transfer?action=genericdata.classdata-GetClassData', classData, classConfig).then(({ data }) => {
                    resolve(data);
                }).catch((err) => {
                    reject(err);
                })
            })
        })
    }

    public getAssignments(classID: string, gradingPeriodGU: string, orgYearGU: string): Promise<JSON> {
        const loadControlData = `{"request":{"control":"Gradebook_RichContentClassDetails","parameters":{"classID":${classID},"gradePeriodGU":"${gradingPeriodGU}","OrgYearGU":"${orgYearGU}"}}}`
        const loadControlConfig = {
            jar: this.cookieJar,
            withCredentials: true,
            headers: {
                'Content-Type': 'application/json; charset=UTF-8', 
                'Accept': 'application/json, text/javascript, */*; q=0.01', 
                'Sec-Fetch-Mode': 'cors', 
                'Sec-Fetch-User': '?1', 
                'Sec-Fetch-Dest': 'empty', 
                'Sec-Fetch-Site': 'same-origin', 
                'host': 'md-mcps-psv.edupoint.com', 
                'Origin': 'https://md-mcps-psv.edupoint.com', 
                'Referer': 'https://md-mcps-psv.edupoint.com/PXP2_GradeBook.aspx?AGU=0',
            }
        }

        const classData = '{"FriendlyName":"pxp.course.content.items","Method":"LoadWithOptions","Parameters":"{\\"loadOptions\\":{\\"sort\\":[{\\"selector\\":\\"due_date\\",\\"desc\\":false}],\\"filter\\":[[\\"isDone\\",\\"=\\",false]],\\"group\\":[{\\"Selector\\":\\"Week\\",\\"desc\\":false}],\\"requireTotalCount\\":true,\\"userData\\":{}},\\"clientState\\":{}}"}';
        const classConfig = {
            jar: this.cookieJar,
            withCredentials: true,
            headers: {
                'Content-Type': 'application/json; charset=UTF-8', 
                'Accept': 'application/json, text/javascript, */*; q=0.01', 
                'Accept-Language': 'en-US,en;q=0.9',
                'host': 'md-mcps-psv.edupoint.com', 
                'Origin': 'https://md-mcps-psv.edupoint.com', 
                'Referer': 'https://md-mcps-psv.edupoint.com/PXP2_GradeBook.aspx?AGU=0',
                'Sec-Fetch-User': '?1', 
                'Sec-Fetch-Dest': 'empty', 
                'Sec-Fetch-Mode': 'cors', 
                'Sec-Fetch-Site': 'same-origin', 
            }
        }
        return new Promise((resolve, reject) => {
            this.client.post('service/PXP2Communication.asmx/LoadControl', loadControlData, loadControlConfig).then(() => {
                this.client.post('api/GB/ClientSideData/Transfer?action=genericdata.classdata-GetClassData', classData, classConfig).then(({ data }) => {
                    resolve(data);
                }).catch((err) => {
                    reject(err);
                })
            })
        });
    }

    public setParams(): Promise<void> {
        const gradebookConfig = {
            jar: this.cookieJar,
            withCredentials: true,
            headers: {
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
                "Host": "md-mcps-psv.edupoint.com",
                "Referer": "https://md-mcps-psv.edupoint.com/PXP2_LaunchPad.aspx",
                "Sec-Fetch-Dest": "document",
                "Sec-Fetch-Mode": "navigate",
                "Sec-Fetch-Site": "same-origin",
                "Sec-Fetch-User": "?1"
            }
        }
        return new Promise<void>((resolve, reject) => {
            this.client.get('/PXP2_GradeBook.aspx?AGU=0', gradebookConfig).then(({ data }) => {
                let line:string = data.split('\n')[17];
                line = line.substring(line.indexOf('{'), line.length - 1);
                const jsondata = JSON.parse(line);
                this.schoolID = jsondata["Schools"][0]["SchoolID"];
                this.orgYearGU = jsondata["Schools"][0]["GradingPeriods"][0]["OrgYearGU"];
                this.periods = [] as [string, string][];
                for (const period of jsondata["Schools"][0]["GradingPeriods"]) {
                    this.periods.push([period["Name"], period["GU"]]);
                }
                resolve();
            }).catch((err) => {
                reject(err);
            })
        });
    }
}

export { Client, loginVUE }