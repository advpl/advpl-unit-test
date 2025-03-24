import * as path from "path";
import * as vscode from "vscode";
import { TreeDataProvider } from "vscode";
import { TestNode } from "./TestNode";
import { TestCommands } from "./testCommands";
import { TestResult } from "./TestResult";

export class AdvplTestExplorer implements TreeDataProvider<TestNode> {
   

    private _onDidChangeTreeData: vscode.EventEmitter<TestNode | undefined> = new vscode.EventEmitter<TestNode | undefined>();
    readonly onDidChangeTreeData: vscode.Event<TestNode | undefined> = this._onDidChangeTreeData.event;


    private discoveredTests: string[];
    private testResults: TestResult[];
    private allNodes: TestNode[] = [];

    constructor(private context: vscode.ExtensionContext, private testCommands: TestCommands) {
        testCommands.onNewTestDiscovery(this.updateWithDiscoveredTests, this);
        testCommands.onTestRun(this.updateTreeWithRunningTest, this);
        testCommands.onFolderTestRun(this.updateTreeWithRunningFolderTests, this);
        testCommands.onNewResult(this.addTestResults, this);
    }

    refresh(): void {
        this._onDidChangeTreeData.fire(null);
    }

    getTreeItem(element: TestNode): vscode.TreeItem {
        this.allNodes.push(element);
        return {
            label: element.name,
            collapsibleState: element.isFolder ? vscode.TreeItemCollapsibleState.Expanded : void 0,
            contextValue: element.isFolder ? "folder" : "test",
            iconPath: element.icon ? element.icon : void 0,
        };
    }

    getChildren(element?: TestNode): TestNode[] | Thenable<TestNode[]> {
        
        
        if (element) {
            return element.children;
        }

        if (!this.discoveredTests) {
            this.testCommands.discoverTests();
            const loadingNode = new TestNode("", "Discovering tests", []);
            loadingNode.setAsLoading();
            return [loadingNode]

        }

        return this.discoveredTests.map(test => {
            if(!this.testResults){
                return new TestNode("", test, this.testResults);
            }
            let testResult = this.testResults.filter( tr => test.startsWith(tr.classname));
            if (testResult.length > 0){            
                let resultForTest = testResult[0].methods.map( m => new TestNode(test,m.methodname,this.testResults));
                return new TestNode("", test, this.testResults, resultForTest);
            }else{
                return new TestNode("", test, this.testResults);
            }
        });
        /*if (!false) {
            vscode.window.showInformationMessage('No dependency in empty workspace');
            return Promise.resolve([]);
        }*/
    }

    private updateWithDiscoveredTests(results: string[]) {
        this.allNodes = [];
        this.discoveredTests = results;
        this._onDidChangeTreeData.fire(null);
    }

    private updateTreeWithRunningTest(testName: string) {
        const testRun = this.allNodes.filter( (testNode: TestNode) => !testNode.isFolder && testNode.fullName.startsWith(testName) );
        this.updateTreeWithRunningTests(testRun);

    }

    private updateTreeWithRunningFolderTests(folder: string){
        this.updateTreeWithRunningTests(this.allNodes);
    }

    private updateTreeWithRunningTests(testRun: TestNode[]){
        testRun.forEach( (testNode: TestNode) => {
            testNode.setAsLoading();
            this._onDidChangeTreeData.fire(testNode);
        });
    }


    private addTestResults(results: TestResult[]) {
        if (this.testResults) {
            results.forEach( (newTestResult: TestResult) => {
                const indexOldTestResult = this.testResults.findIndex( (tr) => tr.classname === newTestResult.classname);

                if (indexOldTestResult < 0) {
                    this.testResults.push(newTestResult);
                } else {
                    this.testResults[indexOldTestResult] = newTestResult;
                }
            });
        } else {
            this.testResults = results;
        }

        this._onDidChangeTreeData.fire(null);
    }

    public refreshTestExplorer(): void {
        this.discoveredTests = null;
        this.testResults = null;
        this._onDidChangeTreeData.fire(null);

        this.testCommands.discoverTests();
    }

}


