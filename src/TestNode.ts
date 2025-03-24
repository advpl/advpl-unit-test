import { TestResult } from "./TestResult";
import { statusImages } from "./constants";
import * as vscode from 'vscode';

export class TestNode {
    private _isError: boolean;
    private _isLoading: boolean;
    private _icon: vscode.ThemeIcon;

    constructor(private _parentPath: string, private _name: string, testResults: TestResult[], private _children?: TestNode[]) {
        this.setIcon(testResults);
    }

    public get name(): string {
        return this._name;
    }

    public get fullName(): string {
        return (this._parentPath ? `${this._parentPath}.` : "") + this._name;
    }

    public get parentPath(): string {
        return this._parentPath;
    }

    public get isFolder(): boolean {
        return this._children && this._children.length > 0;
    }

    public get children(): TestNode[] {
        return this._children;
    }

    public get isError(): boolean {
        return !!this._isError;
    }

    public get icon(): vscode.ThemeIcon {
        return (this._isLoading) ? new vscode.ThemeIcon("loading") : this._icon;
    }

    public setAsError(error: string) {
        this._isError = true;
        this._name = error;
    }

    public setAsLoading() {
        this._isLoading = true;
    }

    public setIcon(testResults: TestResult[]) {
        if (!testResults) return;
        if (this.isFolder) return;
        this._isLoading = false;
        let testResult = testResults.filter( tr => this.parentPath.startsWith(tr.classname));
        if (testResult.length > 0){            
            let resultForTest = testResult[0].methods.filter(m => m.methodname == this.name);
            if (resultForTest.length > 0){
                if(resultForTest[0].skiped) {
                    this._icon = new vscode.ThemeIcon("testing-skipped-icon");
                }
                else { 
                    this._icon = resultForTest[0].success ?new vscode.ThemeIcon("testing-passed-icon") : new vscode.ThemeIcon("testing-failed-icon");;
                }
            }
        }
    }
}
