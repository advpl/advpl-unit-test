import * as vscode from "vscode";
import { Event, EventEmitter } from "vscode";
import { discoverTests } from "./testDiscovery";
import { TestNode } from "./testNode";
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
                lcov = this.getRelativePath(lcov)
                this.onNewCoverageEmitter.fire(lcov);
                //const renderer = new RendererCoverage(lcov);
                //for(const file of lcov.TNs){
                   //this.createWatcher(file.SF, renderer);
                //}
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

    private createWatcher(file:string, renderer:RendererCoverage){
        let pattern = path.join(file);
        let rakePromise: Thenable<vscode.Task[]> | undefined = undefined;
        let fileWatcher = vscode.workspace.createFileSystemWatcher(pattern);
        fileWatcher.onDidChange(
            (filePath) => {
                renderer.drawCoverage();  
            }
        );
        fileWatcher.onDidCreate(() => rakePromise = undefined);
        fileWatcher.onDidDelete(() => rakePromise = undefined);
        
    }

    private getRelativePath(lcov: LCov) {
        const re = new RegExp(/\w+.PRW/g);
        let matches;

        for( const tn of lcov.TNs){
            
           tn.SF = this.getRelativePathInWorkspace((vscode.workspace.rootPath + "\\src\\"), tn.SF);
            
        }

        return lcov;
    }

    private getRelativePathInWorkspace(dir: string, fileName: string) {
        const files = fs.readdirSync(dir);
        let str: string = fileName;
        for (const file of files) {
            const dirStt: fs.Stats = fs.lstatSync((dir + file));
            if (dirStt === null) {
                return "";
            }
            if (dirStt.isDirectory()) {
                str = this.getRelativePathInWorkspace( (dir + file + "\\"), fileName);
                if ( str !== fileName) {
                    return str;
                }
            }
            if (file.toUpperCase() === fileName) {
                return (dir + file);
            }
        }
        return str;
    }

    private replaceCurrentFilePath(textEditors: vscode.TextEditor[], lcov: LCov){   

        for( const textDocument of vscode.workspace.textDocuments ) {
            const re = new RegExp(/(\w+.PR[X,W,Y])/g);
            const filePath: string  = textDocument.uri.fsPath; 
            let matches = re.exec(textDocument.fileName.toUpperCase());
            if  (matches !== null) {
                for (let file of lcov.TNs) {
                    if (file.SF === matches[0]) {
                        file.SF = filePath;
                    }               
                }
            }
        }
        return lcov;
    }

    
}


