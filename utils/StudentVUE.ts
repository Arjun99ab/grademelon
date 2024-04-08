import axios from 'axios';
// @ts-ignore
import { wrapper } from 'axios-cookiejar-support';
// @ts-ignore
import { CookieJar } from 'tough-cookie';

interface Assignment {
	name: string;
	grade: {
		letter: string;
		raw: number;
		color: string;
	};
	points: {
		earned: number;
		possible: number;
	};
	date: {
		due: Date;
		assigned: Date;
	};
	category: string;
}

interface Course {
	name: string;
	period: number;
	room: string;
	weighted: boolean;
	grade: {
		letter: string;
		raw: number;
		color: string;
	};
	teacher: {
		name: string;
		email: string;
	};
	categories: {
		name: string;
		weight: number;
		grade: {
			letter: string;
			raw: number;
			color: string;
		};
		points: {
			earned: number;
			possible: number;
		};
	}[];
	assignments: Assignment[];
}

interface Grades {
	courses: Course[];
	gpa: number;
	wgpa: number;
	period: {
		name: string;
		index: number;
	};
	periods: {
		name: string;
		index: number;
	}[];
}

function loginVUE(username: string, password: string, hostURL: string): Promise<Client> {
    return new Promise((res, rej) => {
        if(hostURL.length === 0) {
            return rej();
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
    private classes: any;
    private currentPeriod = 6;
    public sessionId = '';
    public cookieJar = new CookieJar();
    public client = wrapper(axios.create({
        jar: this.cookieJar,
        baseURL: 'https://corsvue.arjun.tech/api/',
        withCredentials: true,
    }));

    constructor(username: string, password: string,  hostUrl: string) {
        this.hostUrl = hostUrl;
        this.username = username;
        this.password = password;
    }
    public async createSession(): Promise<void> {
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
                'Target-URL': 'https://md-mcps-psv.edupoint.com/PXP2_Login_Student.aspx?regenerateSessionId=True'
            }
        };
        await this.client.post("", loginData, loginConfig).then(({ config }) => {
                if (config.jar) {
                    this.cookieJar = config.jar;
                }
            }).catch((err) => {
                console.log(err);
        })
    }
    public getClasses(): Promise<JSON>  {
        const gradebookData = `{"request":{"gradingPeriodGU":"${this.periods[this.currentPeriod][0]}","AGU":"0","schoolID":${this.schoolID}}}`;
        const gradebookConfig = {
            jar: this.cookieJar,
            withCredentials: true,
            headers: {
                'Target-URL': 'https://md-mcps-psv.edupoint.com/service/PXP2Communication.asmx/GradebookFocusClassInfo'
            }
        };
        return new Promise((resolve, reject) => {
            this.client.post("", gradebookData, gradebookConfig).then(({ data }) => {
                this.classes = [] as [string, string, string][];
                for (const c of data["d"]["Data"]["Classes"]) {
                    this.classes.push([c["ID"], c["Name"], c["TeacherName"]]);
                }
                resolve(data);
            }).catch((err) => {
                console.log(err);
                reject(err);
            })
        })
    }

    public getClass(classPd: number): Promise<JSON> {
        const loadControlData = `{"request":{"control":"Gradebook_RichContentClassDetails","parameters":{"classID":${this.classes[classPd][0]},"gradePeriodGU":"${this.periods[this.currentPeriod]}","OrgYearGU":"${this.orgYearGU}"}}}`;
        const loadControlConfig = {
            jar: this.cookieJar,
            withCredentials: true,
            headers: {
                'Target-URL': 'https://md-mcps-psv.edupoint.com/service/PXP2Communication.asmx/LoadControl'
            }
        }

        const classData = '{"FriendlyName":"genericdata.classdata","Method":"GetClassData","Parameters":"{}"}';
        const classConfig = {
            jar: this.cookieJar,
            withCredentials: true,
            headers: {
                'Target-URL': 'https://md-mcps-psv.edupoint.com/api/GB/ClientSideData/Transfer?action=genericdata.classdata-GetClassData'
            }
        }
        return new Promise((resolve, reject) => {
            this.client.post('', loadControlData, loadControlConfig).then(() => {
                this.client.post('', classData, classConfig).then(({ data }) => {
                    resolve(data);
                }).catch((err) => {
                    reject(err);
                })
            })
        })
    }

    public getAssignments(classPd: number): Promise<JSON> {
        const loadControlData = `{"request":{"control":"Gradebook_RichContentClassDetails","parameters":{"classID":${this.classes[classPd][0]},"gradePeriodGU":"${this.periods[this.currentPeriod]}","OrgYearGU":"${this.orgYearGU}"}}}`
        const loadControlConfig = {
            jar: this.cookieJar,
            withCredentials: true,
            headers: {
                'Target-URL': 'https://md-mcps-psv.edupoint.com/service/PXP2Communication.asmx/LoadControl'
            }
        }

        const classData = '{"FriendlyName":"pxp.course.content.items","Method":"LoadWithOptions","Parameters":"{\\"loadOptions\\":{\\"sort\\":[{\\"selector\\":\\"due_date\\",\\"desc\\":false}],\\"filter\\":[[\\"isDone\\",\\"=\\",false]],\\"group\\":[{\\"Selector\\":\\"Week\\",\\"desc\\":false}],\\"requireTotalCount\\":true,\\"userData\\":{}},\\"clientState\\":{}}"}';
        const classConfig = {
            jar: this.cookieJar,
            withCredentials: true,
            headers: {
                'Target-URL': 'https://md-mcps-psv.edupoint.com/api/GB/ClientSideData/Transfer?action=genericdata.classdata-GetClassData'
            }
        }
        return new Promise((resolve, reject) => {
            this.client.post('', loadControlData, loadControlConfig).then(() => {
                this.client.post('', classData, classConfig).then(({ data }) => {
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
                'Target-URL': 'https://md-mcps-psv.edupoint.com/PXP2_GradeBook.aspx?AGU=0'
            }
        }
        return new Promise<void>((resolve, reject) => {
            this.client.get('', gradebookConfig).then(({ data }) => {
                let line:string = data.split('\n')[17];
                line = line.substring(line.indexOf('{'), line.length - 1);
                const jsondata = JSON.parse(line);
                this.schoolID = jsondata["Schools"][0]["SchoolID"];
                this.orgYearGU = jsondata["Schools"][0]["GradingPeriods"][0]["OrgYearGU"];
                this.periods = [] as [string, string][];
                for (const period of jsondata["Schools"][0]["GradingPeriods"]) {
                    this.periods.push([period["GU"], period["Name"]]);
                }
                resolve();
            }).catch((err) => {
                reject(err);
            })
        });
    }

    // public gradebook(): Promise<Grades> {
        
    // }
}

export { Client, loginVUE }