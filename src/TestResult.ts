export class TestResult {
    public testcasecount: string;
    public result: string;
    public suites: Array<TestSuite>;
    public classname: string;
    public methods: Array<any>;

    public static Failed:string = "Failed";
    public static Passed:string = "Passed";

    constructor() {
        this.suites = new Array<TestSuite>();
        this.methods = new Array<any>();
    }


    public  getResultsByClass(testClassName:string): any{
            var failedTests = new Array<TestCase>();
            var passeedTests  = new Array<TestCase>();

            this.suites.forEach(suite => {
                let testclass = suite.testclasses.find(tc => (testClassName.toLowerCase()===tc.name.toLowerCase()));
                if(testclass){
                    testclass.testcases.forEach(testcase => {
                        if(testcase.result.toLowerCase()===TestResult.Failed.toLowerCase()){
                            failedTests.push(testcase);
                        }else{
                            passeedTests.push(testcase);
                        }
                    });
                }
        });            
        return {"failed" : failedTests, "passed":passeedTests };
    }

}

export class TestSuite {
    public name: string;
    public testclasses: Array<TestClass>;

    constructor() {
        this.testclasses = new Array<TestClass>();
    }
}

export class TestClass {
    public name: string;
    public testcases: Array<TestCase>;

    constructor() {
        this.testcases = new Array<TestCase>();

    }
}

export class TestCase {
    public name: string;
    public fullName: string;
    public methodName: string;
    public className: string;
    public result: string;
}