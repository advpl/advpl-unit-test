import * as vscode from "vscode";
import { Event, EventEmitter } from "vscode";
import { discoverTests } from "./testDiscovery";
import { TestNode } from "./TestNode";
import { AdvplRunner } from "./AdvplRunner";
import { TestResult } from "./TestResult";
import { RendererCoverage } from "./renderer";

import * as path from 'path';
import * as fs from 'fs';
import {LCov} from "coverage";

export class TestCommands {
    private onNewTestDiscoveryEmitter = new EventEmitter<string[]>();
    private onTestRunEmitter = new EventEmitter<string>();
    private onFolderTestRunEmmitter = new EventEmitter<string>();
    private onNewResultEmitter = new EventEmitter<TestResult[]>();
    private onNewCoverageEmitter = new EventEmitter<LCov>();
    private lastRunTestName: string = null;

    constructor() {}

    public runAllTests(): void {
        this.runTestCommand("");
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
        if (!testDirectoryPath) throw new Error("advpl-unittest.testDirectoryPath not configured");
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

    public get onNewCoverage(): Event<LCov> {
        return this.onNewCoverageEmitter.event;
    }

    public get onFolderTestRun(): Event<string> {
        return this.onFolderTestRunEmmitter.event;
    }

    private runTestCommand(testName: string): void {
        var runner  = new AdvplRunner(JSON.stringify(vscode.workspace.getConfiguration("advpl")));
        runner.setAfterExec(() => {
            let res = runner.getResult();
            let lcov = runner.getCoverage();
            if (!res){
                //se está pela folder não gera
                if(testName){
                    res = new Array<TestResult>()
                    res.push(new TestResult());
                    res[0].classname = testName;
                }
            }else{
                if (! (res instanceof Array) ) res = [res]
            }

            if (res) this.onNewResultEmitter.fire(res);


            if(lcov != null){
                this.onNewCoverageEmitter.fire(lcov);
            }
            
        }); 
        if(!testName){
            let folder = vscode.workspace.getConfiguration("advpl-unittest").get<string>("testDirectoryPath");
            runner.runFolderTest(folder);
            this.onFolderTestRunEmmitter.fire(folder);
        }else{
            runner.runUnitTest(testName);
            this.lastRunTestName = testName;
            this.onTestRunEmitter.fire(testName);
        }
    }    
}


