import * as vscode from "vscode";
import { Event, EventEmitter } from "vscode";
import { discoverTests } from "./testDiscovery";
import { TestNode } from "./testNode";
import { AdvplRunner } from "./AdvplRunner";
import { TestResult } from "./TestResult";

export class TestCommands {
    private onNewTestDiscoveryEmitter = new EventEmitter<string[]>();
    private onTestRunEmitter = new EventEmitter<string>();
    private onNewResultEmitter = new EventEmitter<TestResult[]>();
    private lastRunTestName: string = null;

    constructor() {}

    public runAllTests(): void {
        throw new Error("Not implemented")
        //this.runTestCommand("");
    }

    public runTest(test: TestNode): void {
        this.runTestByName(test.fullName);
    }

    public runTestByName(testName: string): void {
        this.runTestCommand(testName);
    }

    public rerunLastCommand(): void {
        if (this.lastRunTestName != null) {
            this.runTestCommand(this.lastRunTestName);
        }
    }

    public discoverTests() {
        let testDirectoryPath = vscode.workspace.getConfiguration("advpl-unittest").get<string>("testDirectoryPath")
        discoverTests(testDirectoryPath)
            .then((result) => {

                this.onNewTestDiscoveryEmitter.fire(result.testNames);

            })
            .catch((err) => {

                this.onNewTestDiscoveryEmitter.fire([]);
            });
    }

    public get onNewTestDiscovery(): Event<string[]> {
        return this.onNewTestDiscoveryEmitter.event;
    }

    public get onTestRun(): Event<string> {
        return this.onTestRunEmitter.event;
    }

    public get onNewResult(): Event<TestResult[]> {
        return this.onNewResultEmitter.event;
    }

    private runTestCommand(testName: string): void {
        var runner  = new AdvplRunner(JSON.stringify(vscode.workspace.getConfiguration("advpl")));
        runner.setAfterExec(() => {
            let res = runner.getResult();
            if (!res){
                res = new TestResult();
                res.classname = testName;
            }
            
            this.onNewResultEmitter.fire([res]);
        }); 
        runner.runUnitTest(testName);
        this.lastRunTestName = testName;
        this.onTestRunEmitter.fire(testName);

    }




    /**
     * @description
     * Gets the dotnet test argument to speicfy the output for the test results.
     */
    private outputTestResults(): string {
        // if (Utility.codeLensEnabled) {
        //     //return " --logger \"trx;LogFileName=" + this.resultsFile.fileName + "\"";
        // } else {
        //     return "";
        // }
        return '';
    }

}
