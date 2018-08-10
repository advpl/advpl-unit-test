'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import {AdvplUnitTest} from './AdvplUnitTest';
import * as analyse from '../src/CodeAnalyser';
import { AdvplTestExplorer } from './AdvplTestExplorer';
import { TestCommands } from './testCommands';
import { TestNode } from './TestNode';
let advplExt = vscode.extensions.getExtension('KillerAll.advpl-vscode');
let consoleAdvpl = advplExt.exports
let oTdd;
let bfinish;
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    const unitTest = AdvplUnitTest.getInstance();
    oTdd = new TddBusiness();
    unitTest.activate();

    
    const testCommands = new TestCommands();
    const advplTestExplorer = new AdvplTestExplorer(context, testCommands);
    vscode.window.registerTreeDataProvider("advplTestExplorer", advplTestExplorer);
    context.subscriptions.push(vscode.commands.registerCommand("advpl-unittest.runTest", (test: TestNode) => {
        testCommands.runTest(test);
    }));
    
    context.subscriptions.push(unitTest);
    context.subscriptions.push(runUnitTest(testCommands));

    context.subscriptions.push(vscode.commands.registerCommand("advpl-unittest.refreshTestExplorer", () => {
        advplTestExplorer.refreshTestExplorer();
    }));
    
    context.subscriptions.push(vscode.commands.registerCommand("advpl-unittest.runAllTests", () => {
        testCommands.runAllTests();
    }));
    consoleAdvpl.writeAdvplConsole("Advpl Unit test initiated!")


}

// this method is called when your extension is deactivated
export function deactivate() {
}

function runUnitTest(testCommands: TestCommands)
{
   
let disposable = vscode.commands.registerCommand('advpl.unittest.run', function (context)  {
        
        var editor = vscode.window.activeTextEditor;
        var cSource = editor.document.fileName;
        if (editor.document.isDirty)
        {
            let list = ["Sim","Não"];
            vscode.window.showQuickPick(list,{placeHolder:"O arquivo não está salvo e foi modificado, deseja salva-lo antes de compilar?"}).then(function(select){
            console.log(select);
            
            if (select==="Sim")
            {
                editor.document.save().then(function(select)
                {
                __internal_run(cSource,editor,testCommands);
                }
            )
               
            }
            else
            {
                vscode.window.setStatusBarMessage('Ação cancelado pelo usuario, fonte não compilado!!!',5000);
            }
        })
            
            
        }
        else
        {
            __internal_run(cSource,editor,testCommands);
        }
       

});
return disposable;
}
function isFinish()
{
    return bfinish;
}
function __internal_run(cSource,editor,testCommands: TestCommands)
{
        bfinish = false;
        
        vscode.window.withProgress({ location: vscode.ProgressLocation.Window, title: 'Advpl Test Unit'}, p => {
            return new Promise((resolve, reject) => {
                p.report({message: 'Executando...' });
                let count= 0;
                let nextFinish = false;
                let handle = setInterval(() => {                    
                    p.report({message: 'Executando...' });
                    
                    if (isFinish()) {                        
                        p.report({message: 'Finalizado!' });
                        nextFinish = true;
                        bfinish = false;
                    }
                    else
                    {
                        if(nextFinish){
                            clearInterval(handle);
                            resolve();
                        }
                    }
                }, 1000);
            });
        });
    
        consoleAdvpl.writeAdvplConsole("-------------------------------------------------------");
        consoleAdvpl.writeAdvplConsole("----ADVPL Unit Test Running----------------------------");
        consoleAdvpl.writeAdvplConsole("-------------------------------------------------------");        
        consoleAdvpl.writeAdvplConsole("[Advpl Unit Test] - Iniciando a execução do TestCase:" +  cSource.replace(/^.*[\\\/]/, ''));
        
        testCommands.onNewResult((res) => {
            if (res != null)
            {
                oTdd.showTestResults(res[0]);        
            }
            consoleAdvpl.writeAdvplConsole("[Advpl Unit Test] - Finalizado");
            bfinish = true;
        })
        testCommands.runTestByName(cSource);   
    
}

export class TddBusiness {
    private _failedDecorator: vscode.TextEditorDecorationType;
    private _passedDecorator: vscode.TextEditorDecorationType;
    private _skipedDecorator: vscode.TextEditorDecorationType;

    //public static nunitResultsFilePath: string = path.join(vscode.workspace.rootPath, 'TestResult.xml');


    constructor() {
        this._skipedDecorator = vscode.window.createTextEditorDecorationType({
            cursor: 'crosshair',
            backgroundColor: 'rgba(255,255,0,0.3)'
        });

        this._failedDecorator = vscode.window.createTextEditorDecorationType({
            cursor: 'crosshair',
            backgroundColor: 'rgba(255,0,0,0.3)'
        });

        this._passedDecorator = vscode.window.createTextEditorDecorationType({
            cursor: 'crosshair',
            backgroundColor: 'rgba(0,255,0,0.3)'
        });
    }
  public showTestResults(resultTest) {
        let texteditor = vscode.window.activeTextEditor
        let currentDocument = texteditor.document;
            this.cleanUpPreviousResults(texteditor);
            let tests = resultTest;
            if (tests.runned)
            {
                var analyser = new analyse.CodeAnalyser();
                //consoleAdvpl.writeAdvplConsole
                var decoratorsSkiped = analyser.getDecorationOptions(tests.methods, currentDocument, "skipped",null,consoleAdvpl,true);
                var decoratorsFailed = analyser.getDecorationOptions(tests.methods, currentDocument, "failed",false,consoleAdvpl,false);
                var decoratorsPassed = analyser.getDecorationOptions(tests.methods, currentDocument, "passed",true,consoleAdvpl,false);
                texteditor.setDecorations(this._skipedDecorator, decoratorsSkiped);
                texteditor.setDecorations(this._failedDecorator, decoratorsFailed);
                texteditor.setDecorations(this._passedDecorator, decoratorsPassed);
            }
            else
            {
                consoleAdvpl.writeAdvplConsole("Fonte não possui teste unitario");
            }
    
    /*let parser = new resultParser.NunitResultParser();
        let nunitResult: jsresult.TestResult;
        vscode.workspace.openTextDocument(TddBusiness.nunitResultsFilePath).then((document) => {
            nunitResult = parser.parseResult(document.getText());
        }).then(() => {
            vscode.window.visibleTextEditors.forEach(texteditor => {
                let currentDocument = texteditor.document;
                this.cleanUpPreviousResults(texteditor);
                let tests = nunitResult.getResultsByClass(this.getClassName(currentDocument.getText()));
                var analyser = new analyse.CodeAnalyser();

                var decoratorsFailed = analyser.getDecorationOptions(tests.failed, currentDocument, "failed");
                var decoratorsPassed = analyser.getDecorationOptions(tests.passed, currentDocument, "passed");
                texteditor.setDecorations(this._failedDecorator, decoratorsFailed);
                texteditor.setDecorations(this._passedDecorator, decoratorsPassed);
            });

        });*/
    }
     private cleanUpPreviousResults(texteditor:vscode.TextEditor) {
        texteditor.setDecorations(this._skipedDecorator, []);
        texteditor.setDecorations(this._failedDecorator, []);
        texteditor.setDecorations(this._passedDecorator, []);
    }
}