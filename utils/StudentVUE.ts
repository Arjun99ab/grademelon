import axios from 'axios';
// @ts-ignore
import { wrapper } from 'axios-cookiejar-support';
import { map } from 'lodash';
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
	categories: Category[];
	assignments: Assignment[];
}

interface Category {
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

interface Period {
    markingGU: string;
    periodGU: string;
    name: string;
}

interface JSONInput {
    [key: string]: any;
}

function loginVUE(username: string, password: string, hostURL: string, testmode?: boolean): Promise<Client> {
    return new Promise((res, rej) => {
        if(hostURL.length === 0) {
            return rej();
        }
        const host = new URL(hostURL).host 
        const client = new Client(username, password, host, testmode===true);
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
    private testmode = false;
    private username: string;
    private password: string;
    private schoolID = '';
    private orgYearGU = '';
    private periods = [] as Period[];
    private classes: any;
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

    constructor(username: string, password: string, hostUrl: string, testmode?: boolean) {
        if (!(testmode == null)) {
            this.testmode = testmode;
        }
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
                'Content-Type': 'application/x-www-form-urlencoded', 
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7', 
                'Sec-Fetch-Mode': 'navigate', 
                'Sec-Fetch-User': '?1', 
                'Sec-Fetch-Dest': 'document', 
                'host': 'md-mcps-psv.edupoint.com', 
            },
        };
        await this.client.post("PXP2_Login_Student.aspx?regenerateSessionId=True", loginData, loginConfig).then(({ config }) => {
                if (config.jar) {
                    this.cookieJar = config.jar;
                }
            }).catch((err) => {
                console.log(err);
        })
    }
    public getClasses(p: number): Promise<JSON>  {
        const gradebookData = `{"request":{"gradingPeriodGU":"${this.periods[p]["periodGU"]}","AGU":"0","schoolID":${this.schoolID}}}`;
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

    public getClass(classPd: number, p: number): Promise<JSON> {
        const loadControlData = `{"request":{"control":"Gradebook_RichContentClassDetails","parameters":{"classID":${this.classes[classPd][0]},"markPeriodGU":"${this.periods[p]["markingGU"]}","OrgYearGU":"${this.orgYearGU}"}}}`;
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

    public getAssignments(classPd: number, p: number): Promise<JSON> {
        const loadControlData = `{"request":{"control":"Gradebook_RichContentClassDetails","parameters":{"classID":${this.classes[classPd][0]},"markPeriodGU":"${this.periods[p]["markingGU"]}","OrgYearGU":"${this.orgYearGU}"}}}`
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

        const classData = {"FriendlyName":"pxp.course.content.items","Method":"LoadWithOptions","Parameters":"{'loadOptions':{'sort':[{'selector':'due_date','desc':false}],'requireTotalCount':true,'userData':{}},'clientState':{}}"};
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
                for (const period of jsondata["Schools"][0]["GradingPeriods"]) {
                    this.periods.push({
                        markingGU: period["MarkPeriods"][0]["GU"], 
                        periodGU: period["GU"], 
                        name: period["Name"]});
                }
                resolve();
            }).catch((err) => {
                reject(err);
            })
        });
    }

    private isWeighted = (name: string): boolean => {
        let weighted = false;
        if (name.includes("AP")) return true;
        if (name.includes("Hon")) return true;
        if (name.includes("IB")) return true;
        if (name.includes("Mag")) return true;
        else return false;
    };

    private letterGrade = (grade: number): string => {
        if (grade >= 89.5) {
            return "A";
        } else if (grade >= 79.5) {
            return "B";
        } else if (grade >= 69.5) {
            return "C";
        } else if (grade >= 59.5) {
            return "D";
        } else if (!isNaN(grade)) {
            return "E";
        } else {
            return "N/A";
        }
    };

    private letterGradeColor = (letterGrade: string) => {
        switch (letterGrade) {
            case "A":
                return "green";
            case "B":
                return "blue";
            case "C":
                return "yellow";
            case "D":
                return "orange";
            case "E":
                return "red";
            default:
                return "gray";
        }
    };

    private parseCategories = (course: JSONInput) => {
        const categories = [] as Course["categories"];
        for (const category of course["measureTypeGrades"]) {
            const obj = {
                name: (() => {
                    for (const i of course["measureTypes"]) {
                        if (i["id"] === category["measureTypeId"]) {
                            return i["name"];
                        }
                    }
                    return "UNKNOWN CATEGORY";
                })(),
                weight: category["measureTypeWeight"],
                grade: {
                    letter: this.letterGrade(category["points"] / category["pointsPossible"] * 100),
                    raw: parseFloat(((category["points"] / category["pointsPossible"]) * 100).toFixed(2)),
                    color: this.letterGradeColor(this.letterGrade((category["points"] / category["pointsPossible"]) * 100))
                },
                points: {
                    earned: category["points"],
                    possible: category["pointsPossible"]
                }
            }
            categories.push(obj);
        }
        return categories;
    };

    public parseAssignments = (data: JSONInput) => {
        const assignments = [] as Assignment[];
        for (const assignment of data["responseData"]["data"]) {
            const obj = {
                name: assignment["title"],
                grade: {
                    letter: this.letterGrade((assignment["points"] / assignment["pointsPossible"]) * 100),
                    raw: parseFloat(((assignment["points"] / assignment["pointsPossible"]) * 100).toFixed(2)),
                    color: this.letterGradeColor(this.letterGrade((assignment["points"] / assignment["pointsPossible"]) * 100))
                },
                points: {
                    earned: assignment["points"],
                    possible: assignment["pointsPossible"]
                },
                date: {
                    due: new Date(assignment["due_date"]),
                    assigned: new Date(1970, 1, 1), // TODO
                },
                category: assignment["assignmentType"],
            }
            assignments.push(obj);
        }
        return assignments;
    }

    public async gradebook(p=0): Promise<Grades> {
        const courses: Course[] = [];
        await this.getClasses(p).then(async (res: JSONInput) => {
            let i = 0;
            for (const c of res["d"]["Data"]["Classes"]) {
                const course: JSONInput = await this.getClass(i, p);
                const res = {
                    name: c["Name"],
                    period: 0, // TODO
                    room: "ROOM", // TODO
                    weighted: this.isWeighted(c["Name"]),
                    grade: {
                        letter: this.letterGrade(course["students"][0]["calculatedMark"]),
                        raw: course["students"][0]["percentage"],
                        color: this.letterGradeColor(course["students"][0]["calculatedMark"])
                    },
                    teacher: {
                        name: c["TeacherName"],
                        email: "EMAIL" // TODO
                    },
                    categories: this.parseCategories(course),
                    assignments: this.parseAssignments(await this.getAssignments(i, p))
                }
                courses.push(res);
                i++;
            }
        })
        const grades: Grades = {
            courses: courses,
            gpa: 0, // TODO
            wgpa: 0, // TODO
            period: {
                name: this.periods[p]["name"],
                index: p
            },
            periods:  map(this.periods, (period, i) => {
                return {
                    name: period.name,
                    index: i
                }
            })
        }
        return new Promise((resolve, reject) => {
            resolve(grades);
        });
    }
}

export { Client, loginVUE }